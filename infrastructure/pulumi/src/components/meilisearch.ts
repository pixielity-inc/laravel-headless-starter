/**
 * ==============================================================================
 * Meilisearch Component
 * ==============================================================================
 * Creates Kubernetes resources for Meilisearch search engine.
 * Fast, typo-tolerant search engine optimized for instant search experiences.
 *
 * This component creates:
 * - Deployment: Meilisearch server pods
 * - Service: ClusterIP service for internal routing
 * - Secret: Meilisearch master key
 *
 * @module components/meilisearch
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import {
  generateLabels,
  generateAnnotations,
  createLivenessProbe,
  createReadinessProbe,
  generateSelectorLabels,
  createResourceRequirements,
  createSecret,
} from '@/utils';
import { Config } from '@/config';

/**
 * Return type for Meilisearch resources.
 *
 * @interface MeilisearchResources
 */
interface MeilisearchResources {
  deployment?: k8s.apps.v1.Deployment;
  service?: k8s.core.v1.Service;
  secret?: k8s.core.v1.Secret;
}

/**
 * Creates Meilisearch Kubernetes resources.
 *
 * Deploys Meilisearch with:
 * - Fast, typo-tolerant search
 * - Health checks (liveness and readiness probes)
 * - Resource limits and requests
 * - Security contexts (non-root)
 * - Prometheus metrics scraping
 * - Master key authentication
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {MeilisearchResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const meilisearch = createMeilisearch(config, "laravel-prod");
 * ```
 *
 * @note
 * For production with large datasets, consider:
 * - Using persistent storage instead of emptyDir
 * - Scaling horizontally with multiple replicas
 * - Using managed Elasticsearch for advanced features
 */
export function createMeilisearch(config: Config, namespace: string): MeilisearchResources {
  const searchConfig = config.getSearchConfig();
  const stack = config.getStack();

  // Skip if search type is not Meilisearch
  if (searchConfig.type !== 'meilisearch') {
    return {};
  }

  // Generate labels
  const labels = generateLabels('meilisearch', 'search', stack);
  const selectorLabels = generateSelectorLabels('meilisearch', 'search');

  // Prometheus annotations
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '7700',
    'prometheus.io/path': '/metrics',
  });

  // -------------------------------------------------------------------------
  // Secret: Meilisearch Master Key
  // -------------------------------------------------------------------------

  let secret: k8s.core.v1.Secret | undefined;

  if (searchConfig.masterKey) {
    secret = createSecret(
      'meilisearch-credentials',
      namespace,
      {
        'master-key': searchConfig.masterKey,
      },
      labels
    );
  }

  // Create resource requirements from config
  const resources = createResourceRequirements('512Mi', '1Gi', '0.5', '1');

  // Create health probes
  const livenessProbe = createLivenessProbe('/health', 7700, 30, 10);
  const readinessProbe = createReadinessProbe('/health', 7700, 10, 5);

  // -------------------------------------------------------------------------
  // Deployment: Meilisearch Server
  // -------------------------------------------------------------------------

  const deployment = new k8s.apps.v1.Deployment('meilisearch', {
    metadata: {
      name: 'meilisearch',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      replicas: searchConfig.replicas,
      selector: {
        matchLabels: selectorLabels,
      },
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0, // Ensure zero downtime
        },
      },
      template: {
        metadata: {
          labels,
          annotations: prometheusAnnotations,
        },
        spec: {
          // Security context for the pod
          securityContext: {
            runAsNonRoot: true,
            runAsUser: 1000,
            fsGroup: 1000,
            seccompProfile: {
              type: 'RuntimeDefault',
            },
          },
          containers: [
            {
              name: 'meilisearch',
              image: 'getmeili/meilisearch:latest',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'http',
                  containerPort: 7700,
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'MEILI_ENV',
                  value: stack === 'production' ? 'production' : 'development',
                },
                ...(searchConfig.masterKey
                  ? [
                      {
                        name: 'MEILI_MASTER_KEY',
                        valueFrom: {
                          secretKeyRef: {
                            name: 'meilisearch-credentials',
                            key: 'master-key',
                          },
                        },
                      },
                    ]
                  : []),
                {
                  name: 'MEILI_HTTP_ADDR',
                  value: '0.0.0.0:7700',
                },
                {
                  name: 'MEILI_NO_ANALYTICS',
                  value: 'true',
                },
              ],
              resources,
              livenessProbe,
              readinessProbe,
              // Security context for the container
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: false,
                runAsNonRoot: true,
                runAsUser: 1000,
                capabilities: {
                  drop: ['ALL'],
                },
              },
              // Volume mounts for data storage
              volumeMounts: [
                {
                  name: 'data',
                  mountPath: '/meili_data',
                },
              ],
            },
          ],
          // Volumes for data storage
          volumes: [
            {
              name: 'data',
              emptyDir: {}, // For production, use PVC
            },
          ],
          // Restart policy
          restartPolicy: 'Always',
          // DNS policy
          dnsPolicy: 'ClusterFirst',
          // Termination grace period
          terminationGracePeriodSeconds: 30,
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // Service: ClusterIP for Internal Routing
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('meilisearch-service', {
    metadata: {
      name: 'meilisearch',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      selector: selectorLabels,
      ports: [
        {
          name: 'http',
          port: 7700,
          targetPort: 7700,
          protocol: 'TCP',
        },
      ],
      sessionAffinity: 'None',
    },
  });

  return {
    deployment,
    service,
    secret,
  };
}
