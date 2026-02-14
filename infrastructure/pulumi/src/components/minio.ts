/**
 * ==============================================================================
 * MinIO Component
 * ==============================================================================
 * Creates Kubernetes resources for MinIO object storage.
 * S3-compatible storage for file uploads, media, and backups.
 *
 * This component creates:
 * - StatefulSet: MinIO server pods with persistent storage
 * - Service: Headless service for StatefulSet + ClusterIP for API access
 * - Secret: MinIO access credentials
 * - PVC: Persistent volume claim for object storage
 *
 * @module components/minio
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import {
  createSecret,
  generateLabels,
  generateAnnotations,
  generateSelectorLabels,
  createResourceRequirements,
} from '@/utils';
import { Config } from '@/config';

/**
 * Return type for MinIO resources.
 *
 * @interface MinioResources
 */
interface MinioResources {
  statefulSet?: k8s.apps.v1.StatefulSet;
  service?: k8s.core.v1.Service;
  headlessService?: k8s.core.v1.Service;
  secret?: k8s.core.v1.Secret;
}

/**
 * Creates MinIO Kubernetes resources.
 *
 * Deploys MinIO with:
 * - Persistent storage via StatefulSet
 * - S3-compatible API
 * - Web console UI
 * - Health checks
 * - Resource limits
 * - Prometheus metrics
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {MinioResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const minio = createMinio(config, "laravel-prod");
 * ```
 *
 * @note
 * For production, consider using managed object storage:
 * - AWS S3
 * - Google Cloud Storage
 * - Azure Blob Storage
 */
export function createMinio(config: Config, namespace: string): MinioResources {
  const storageConfig = config.getStorageConfig();
  const stack = config.getStack();

  // Skip if not using MinIO (using S3 or other external storage)
  if (storageConfig.type !== 'minio') {
    return {};
  }

  // Generate labels
  const labels = generateLabels('minio', 'storage', stack);
  const selectorLabels = generateSelectorLabels('minio', 'storage');

  // Prometheus annotations
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '9000',
    'prometheus.io/path': '/minio/v2/metrics/cluster',
  });

  // -------------------------------------------------------------------------
  // Secret: MinIO Credentials
  // -------------------------------------------------------------------------

  const secret = createSecret(
    'minio-credentials',
    namespace,
    {
      'root-user': storageConfig.accessKey,
      'root-password': storageConfig.secretKey,
    },
    labels
  );

  // -------------------------------------------------------------------------
  // StatefulSet: MinIO Server
  // -------------------------------------------------------------------------

  const statefulSet = new k8s.apps.v1.StatefulSet('minio', {
    metadata: {
      name: 'minio',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      serviceName: 'minio-headless',
      replicas: storageConfig.replicas,
      selector: {
        matchLabels: selectorLabels,
      },
      template: {
        metadata: {
          labels,
          annotations: prometheusAnnotations,
        },
        spec: {
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
              name: 'minio',
              image: 'minio/minio:latest',
              imagePullPolicy: 'IfNotPresent',
              command: ['minio', 'server', '/data', '--console-address', ':9001'],
              ports: [
                {
                  name: 'api',
                  containerPort: 9000,
                  protocol: 'TCP',
                },
                {
                  name: 'console',
                  containerPort: 9001,
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'MINIO_ROOT_USER',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'minio-credentials',
                      key: 'root-user',
                    },
                  },
                },
                {
                  name: 'MINIO_ROOT_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'minio-credentials',
                      key: 'root-password',
                    },
                  },
                },
                {
                  name: 'MINIO_PROMETHEUS_AUTH_TYPE',
                  value: 'public',
                },
              ],
              resources: createResourceRequirements('512Mi', '1Gi', '0.5', '1'),
              livenessProbe: {
                httpGet: {
                  path: '/minio/health/live',
                  port: 9000,
                  scheme: 'HTTP',
                },
                initialDelaySeconds: 30,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              readinessProbe: {
                httpGet: {
                  path: '/minio/health/ready',
                  port: 9000,
                  scheme: 'HTTP',
                },
                initialDelaySeconds: 10,
                periodSeconds: 5,
                timeoutSeconds: 3,
                failureThreshold: 3,
              },
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: false,
                runAsNonRoot: true,
                runAsUser: 1000,
                capabilities: {
                  drop: ['ALL'],
                },
              },
              volumeMounts: [
                {
                  name: 'data',
                  mountPath: '/data',
                },
              ],
            },
          ],
          restartPolicy: 'Always',
          dnsPolicy: 'ClusterFirst',
          terminationGracePeriodSeconds: 30,
        },
      },
      volumeClaimTemplates: [
        {
          metadata: {
            name: 'data',
            labels,
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: storageConfig.storageSize || '20Gi',
              },
            },
          },
        },
      ],
    },
  });

  // -------------------------------------------------------------------------
  // Service: Headless Service for StatefulSet
  // -------------------------------------------------------------------------

  const headlessService = new k8s.core.v1.Service('minio-headless-service', {
    metadata: {
      name: 'minio-headless',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      clusterIP: 'None', // Headless service
      selector: selectorLabels,
      ports: [
        {
          name: 'api',
          port: 9000,
          targetPort: 9000,
          protocol: 'TCP',
        },
        {
          name: 'console',
          port: 9001,
          targetPort: 9001,
          protocol: 'TCP',
        },
      ],
      publishNotReadyAddresses: true,
    },
  });

  // -------------------------------------------------------------------------
  // Service: ClusterIP for API Access
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('minio-service', {
    metadata: {
      name: 'minio',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      selector: selectorLabels,
      ports: [
        {
          name: 'api',
          port: 9000,
          targetPort: 9000,
          protocol: 'TCP',
        },
        {
          name: 'console',
          port: 9001,
          targetPort: 9001,
          protocol: 'TCP',
        },
      ],
      sessionAffinity: 'None',
    },
  });

  return {
    statefulSet,
    service,
    headlessService,
    secret,
  };
}
