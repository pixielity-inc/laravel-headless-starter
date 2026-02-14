/**
 * ==============================================================================
 * Redis Component
 * ==============================================================================
 * Creates Kubernetes resources for Redis in-memory data store.
 * Used for caching, sessions, queues, and rate limiting.
 *
 * This component creates:
 * - Deployment: Redis server pods
 * - Service: ClusterIP service for internal access
 * - Secret: Redis password (if configured)
 * - PVC: Persistent storage (optional, for data persistence)
 *
 * @module components/redis
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
 * Return type for Redis resources.
 *
 * @interface RedisResources
 */
interface RedisResources {
  deployment?: k8s.apps.v1.Deployment;
  service?: k8s.core.v1.Service;
  secret?: k8s.core.v1.Secret;
}

/**
 * Creates Redis Kubernetes resources.
 *
 * Deploys Redis with:
 * - Persistent storage (optional)
 * - Password authentication
 * - Health checks
 * - Resource limits
 * - Prometheus metrics
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {RedisResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const redis = createRedis(config, "laravel-prod");
 * ```
 *
 * @note
 * For production, consider using managed Redis services:
 * - AWS ElastiCache for Redis
 * - Google Cloud Memorystore
 * - Azure Cache for Redis
 */
export function createRedis(config: Config, namespace: string): RedisResources {
  const redisConfig = config.getRedisConfig();
  const stack = config.getStack();

  // Skip if Redis is disabled (using external managed service)
  if (!redisConfig.enabled) {
    return {};
  }

  // Generate labels
  const labels = generateLabels('redis', 'cache', stack);
  const selectorLabels = generateSelectorLabels('redis', 'cache');

  // Prometheus annotations
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '9121', // Redis exporter port
    'prometheus.io/path': '/metrics',
  });

  // -------------------------------------------------------------------------
  // Secret: Redis Password
  // -------------------------------------------------------------------------

  let secret: k8s.core.v1.Secret | undefined;

  if (redisConfig.password) {
    secret = createSecret(
      'redis-password',
      namespace,
      {
        'redis-password': redisConfig.password,
      },
      labels
    );
  }

  // -------------------------------------------------------------------------
  // Deployment: Redis Server
  // -------------------------------------------------------------------------

  const deployment = new k8s.apps.v1.Deployment('redis', {
    metadata: {
      name: 'redis',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      replicas: redisConfig.replicas,
      selector: {
        matchLabels: selectorLabels,
      },
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0,
        },
      },
      template: {
        metadata: {
          labels,
          annotations: prometheusAnnotations,
        },
        spec: {
          securityContext: {
            runAsNonRoot: true,
            runAsUser: 999, // Redis user
            fsGroup: 999,
            seccompProfile: {
              type: 'RuntimeDefault',
            },
          },
          containers: [
            {
              name: 'redis',
              image: 'redis:7-alpine',
              imagePullPolicy: 'IfNotPresent',
              command: redisConfig.password
                ? ['redis-server', '--requirepass', '$(REDIS_PASSWORD)', '--appendonly', 'yes']
                : ['redis-server', '--appendonly', 'yes'],
              ports: [
                {
                  name: 'redis',
                  containerPort: 6379,
                  protocol: 'TCP',
                },
              ],
              env: redisConfig.password
                ? [
                    {
                      name: 'REDIS_PASSWORD',
                      valueFrom: {
                        secretKeyRef: {
                          name: 'redis-password',
                          key: 'redis-password',
                        },
                      },
                    },
                  ]
                : [],
              resources: createResourceRequirements('128Mi', '256Mi', '0.1', '0.5'),
              livenessProbe: {
                exec: {
                  command: ['redis-cli', 'ping'],
                },
                initialDelaySeconds: 30,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              readinessProbe: {
                exec: {
                  command: ['redis-cli', 'ping'],
                },
                initialDelaySeconds: 5,
                periodSeconds: 5,
                timeoutSeconds: 3,
                failureThreshold: 3,
              },
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: false,
                runAsNonRoot: true,
                runAsUser: 999,
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
            // Redis Exporter for Prometheus metrics
            {
              name: 'redis-exporter',
              image: 'oliver006/redis_exporter:latest',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'metrics',
                  containerPort: 9121,
                  protocol: 'TCP',
                },
              ],
              env: redisConfig.password
                ? [
                    {
                      name: 'REDIS_PASSWORD',
                      valueFrom: {
                        secretKeyRef: {
                          name: 'redis-password',
                          key: 'redis-password',
                        },
                      },
                    },
                  ]
                : [],
              resources: createResourceRequirements('32Mi', '64Mi', '0.05', '0.1'),
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: true,
                runAsNonRoot: true,
                runAsUser: 59000,
                capabilities: {
                  drop: ['ALL'],
                },
              },
            },
          ],
          volumes: [
            {
              name: 'data',
              emptyDir: {}, // Use PVC for production persistence
            },
          ],
          restartPolicy: 'Always',
          dnsPolicy: 'ClusterFirst',
          terminationGracePeriodSeconds: 30,
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // Service: ClusterIP for Internal Access
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('redis-service', {
    metadata: {
      name: 'redis',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      selector: selectorLabels,
      ports: [
        {
          name: 'redis',
          port: 6379,
          targetPort: 6379,
          protocol: 'TCP',
        },
        {
          name: 'metrics',
          port: 9121,
          targetPort: 9121,
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
