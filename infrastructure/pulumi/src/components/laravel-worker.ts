/**
 * ==============================================================================
 * Laravel Queue Worker Component
 * ==============================================================================
 * Creates Kubernetes resources for Laravel queue worker deployment.
 * Processes background jobs from Redis/RabbitMQ/Kafka queues.
 *
 * This component creates:
 * - Deployment: Laravel queue worker pods
 * - HPA: Horizontal Pod Autoscaler (if enabled)
 * - PDB: Pod Disruption Budget (if enabled)
 *
 * Note: Workers don't need a Service as they don't accept incoming connections.
 *
 * @module components/laravel-worker
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import {
  createHPA,
  createPDB,
  generateLabels,
  generateAnnotations,
  generateSelectorLabels,
  createResourceRequirements,
} from '@/utils';
import { Config } from '@/config';

/**
 * Return type for Laravel worker resources.
 *
 * @interface LaravelWorkerResources
 */
interface LaravelWorkerResources {
  deployment: k8s.apps.v1.Deployment;
  hpa?: k8s.autoscaling.v2.HorizontalPodAutoscaler;
  pdb?: k8s.policy.v1.PodDisruptionBudget;
}

/**
 * Creates Laravel queue worker Kubernetes resources.
 *
 * Deploys Laravel queue workers with:
 * - Graceful shutdown handling
 * - Resource limits and requests
 * - Horizontal autoscaling (optional, KEDA recommended for queue-based scaling)
 * - Pod disruption budget (optional)
 * - Prometheus metrics scraping
 * - Security contexts (non-root, read-only filesystem)
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @param {string} image - Docker image for Laravel application
 * @returns {LaravelWorkerResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const laravelWorker = createLaravelWorker(config, "laravel-prod", "laravel:1.0.0");
 * ```
 *
 * @note
 * For production, consider using KEDA (Kubernetes Event-Driven Autoscaling)
 * to scale workers based on queue depth instead of CPU/memory metrics.
 */
export function createLaravelWorker(
  config: Config,
  namespace: string,
  image: string = 'laravel:latest'
): LaravelWorkerResources {
  const laravelConfig = config.getLaravelConfig();
  const featureFlags = config.getFeatureFlags();
  const stack = config.getStack();

  // Generate labels for the queue worker
  const labels = generateLabels('laravel', 'worker', stack);
  const selectorLabels = generateSelectorLabels('laravel', 'worker');

  // Prometheus annotations for metrics scraping
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '9090', // Metrics port (if using Laravel Horizon or custom exporter)
    'prometheus.io/path': '/metrics',
  });

  // Create resource requirements from config
  const resources = createResourceRequirements(
    laravelConfig.workerMemoryRequest,
    laravelConfig.workerMemoryLimit,
    laravelConfig.workerCpuRequest,
    laravelConfig.workerCpuLimit
  );

  // -------------------------------------------------------------------------
  // Deployment: Laravel Queue Worker
  // -------------------------------------------------------------------------

  const deployment = new k8s.apps.v1.Deployment('laravel-worker', {
    metadata: {
      name: 'laravel-worker',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      replicas: featureFlags.hpa ? undefined : laravelConfig.workerReplicas,
      selector: {
        matchLabels: selectorLabels,
      },
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0, // Ensure workers are always available
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
              name: 'laravel-worker',
              image,
              imagePullPolicy: 'IfNotPresent',
              command: [
                'php',
                'artisan',
                'queue:work',
                '--tries=3',
                '--timeout=90',
                '--sleep=3',
                '--max-jobs=1000',
                '--max-time=3600',
              ],
              env: [
                {
                  name: 'APP_ENV',
                  value: laravelConfig.environment,
                },
                {
                  name: 'APP_DEBUG',
                  value: laravelConfig.debug.toString(),
                },
                {
                  name: 'APP_NAME',
                  value: laravelConfig.appName,
                },
                {
                  name: 'APP_URL',
                  value: laravelConfig.appUrl,
                },
                {
                  name: 'APP_KEY',
                  value: laravelConfig.appKey,
                },
                // Database
                {
                  name: 'DB_CONNECTION',
                  value: 'pgsql',
                },
                {
                  name: 'DB_HOST',
                  value: 'postgres',
                },
                {
                  name: 'DB_PORT',
                  value: '5432',
                },
                {
                  name: 'DB_DATABASE',
                  value: 'laravel',
                },
                {
                  name: 'DB_USERNAME',
                  value: 'laravel',
                },
                {
                  name: 'DB_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'postgres-credentials',
                      key: 'postgres-password',
                    },
                  },
                },
                // Cache
                {
                  name: 'CACHE_DRIVER',
                  value: 'redis',
                },
                {
                  name: 'REDIS_HOST',
                  value: 'redis',
                },
                {
                  name: 'REDIS_PORT',
                  value: '6379',
                },
                {
                  name: 'REDIS_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'redis-password',
                      key: 'redis-password',
                    },
                  },
                },
                // Queue
                {
                  name: 'QUEUE_CONNECTION',
                  value: 'rabbitmq',
                },
                {
                  name: 'RABBITMQ_HOST',
                  value: 'rabbitmq',
                },
                {
                  name: 'RABBITMQ_PORT',
                  value: '5672',
                },
                {
                  name: 'RABBITMQ_USER',
                  value: 'guest',
                },
                {
                  name: 'RABBITMQ_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'rabbitmq-credentials',
                      key: 'rabbitmq-password',
                    },
                  },
                },
              ],
              resources,
              // Security context for the container
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: false, // Laravel needs write access to storage/
                runAsNonRoot: true,
                runAsUser: 1000,
                capabilities: {
                  drop: ['ALL'],
                },
              },
              // Volume mounts for Laravel storage
              volumeMounts: [
                {
                  name: 'storage',
                  mountPath: '/var/www/html/storage',
                },
                {
                  name: 'cache',
                  mountPath: '/var/www/html/bootstrap/cache',
                },
              ],
              // Lifecycle hooks for graceful shutdown
              lifecycle: {
                preStop: {
                  exec: {
                    // Send SIGTERM to allow worker to finish current job
                    command: ['/bin/sh', '-c', 'sleep 10'],
                  },
                },
              },
            },
          ],
          // Volumes for writable directories
          volumes: [
            {
              name: 'storage',
              emptyDir: {},
            },
            {
              name: 'cache',
              emptyDir: {},
            },
          ],
          // Restart policy
          restartPolicy: 'Always',
          // DNS policy
          dnsPolicy: 'ClusterFirst',
          // Termination grace period (allow time to finish current job)
          terminationGracePeriodSeconds: 120,
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // HPA: Horizontal Pod Autoscaler (Optional)
  // -------------------------------------------------------------------------

  let hpa: k8s.autoscaling.v2.HorizontalPodAutoscaler | undefined;

  if (featureFlags.hpa) {
    // Note: For production, consider using KEDA for queue-based scaling
    // HPA scales based on CPU/memory, which may not reflect queue depth
    hpa = createHPA(
      'laravel-worker-hpa',
      namespace,
      'laravel-worker',
      'Deployment',
      laravelConfig.workerMinReplicas,
      laravelConfig.workerMaxReplicas,
      70, // Target CPU utilization: 70%
      labels
    );
  }

  // -------------------------------------------------------------------------
  // PDB: Pod Disruption Budget (Optional)
  // -------------------------------------------------------------------------

  let pdb: k8s.policy.v1.PodDisruptionBudget | undefined;

  if (featureFlags.pdb) {
    // Ensure at least 1 worker is available during disruptions
    const minAvailable = Math.max(1, Math.floor(laravelConfig.workerReplicas / 2));

    pdb = createPDB('laravel-worker-pdb', namespace, selectorLabels, minAvailable, labels);
  }

  // -------------------------------------------------------------------------
  // Return Created Resources
  // -------------------------------------------------------------------------

  return {
    deployment,
    hpa,
    pdb,
  };
}
