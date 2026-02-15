/**
 * ==============================================================================
 * Laravel Web Application Component
 * ==============================================================================
 * Creates Kubernetes resources for the Laravel web application deployment.
 * Handles HTTP requests via Laravel Octane (Swoole/RoadRunner).
 *
 * This component creates:
 * - Deployment: Laravel Octane web server pods
 * - Service: ClusterIP service for internal routing
 * - HPA: Horizontal Pod Autoscaler (if enabled)
 * - PDB: Pod Disruption Budget (if enabled)
 *
 * @module components/laravel-app
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import {
  createHPA,
  createPDB,
  generateLabels,
  generateAnnotations,
  createLivenessProbe,
  createReadinessProbe,
  generateSelectorLabels,
  createResourceRequirements,
} from '@/utils';
import { Config } from '@/config';

/**
 * Return type for Laravel web application resources.
 *
 * @interface LaravelAppResources
 */
interface LaravelAppResources {
  deployment: k8s.apps.v1.Deployment;
  service: k8s.core.v1.Service;
  hpa?: k8s.autoscaling.v2.HorizontalPodAutoscaler;
  pdb?: k8s.policy.v1.PodDisruptionBudget;
}

/**
 * Creates Laravel web application Kubernetes resources.
 *
 * Deploys Laravel Octane web server with:
 * - Health checks (liveness and readiness probes)
 * - Resource limits and requests
 * - Horizontal autoscaling (optional)
 * - Pod disruption budget (optional)
 * - Prometheus metrics scraping
 * - Security contexts (non-root, read-only filesystem)
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @param {string} image - Docker image for Laravel application
 * @returns {LaravelAppResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const laravelApp = createLaravelApp(config, "laravel-prod", "laravel:1.0.0");
 * ```
 */
export function createLaravelApp(
  config: Config,
  namespace: string,
  image: string = 'laravel:latest'
): LaravelAppResources {
  const laravelConfig = config.getLaravelConfig();
  const featureFlags = config.getFeatureFlags();
  const stack = config.getStack();

  // Generate labels for the web application
  const labels = generateLabels('laravel', 'web', stack);
  const selectorLabels = generateSelectorLabels('laravel', 'web');

  // Prometheus annotations for metrics scraping
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '8000',
    'prometheus.io/path': '/metrics',
  });

  // Create resource requirements from config
  const resources = createResourceRequirements(
    laravelConfig.webMemoryRequest,
    laravelConfig.webMemoryLimit,
    laravelConfig.webCpuRequest,
    laravelConfig.webCpuLimit
  );

  // Create health probes
  const livenessProbe = createLivenessProbe('/health', 8000, 30, 10);
  const readinessProbe = createReadinessProbe('/health', 8000, 10, 5);

  // -------------------------------------------------------------------------
  // Deployment: Laravel Octane Web Server
  // -------------------------------------------------------------------------

  const deployment = new k8s.apps.v1.Deployment('laravel-web', {
    metadata: {
      name: 'laravel-web',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      replicas: featureFlags.hpa ? undefined : laravelConfig.webReplicas,
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
              name: 'laravel-web',
              image,
              imagePullPolicy: 'IfNotPresent',
              command: ['php', 'artisan', 'octane:start', '--host=0.0.0.0', '--port=8000'],
              ports: [
                {
                  name: 'http',
                  containerPort: 8000,
                  protocol: 'TCP',
                },
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
                {
                  name: 'OCTANE_SERVER',
                  value: 'swoole',
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
                // Session
                {
                  name: 'SESSION_DRIVER',
                  value: 'redis',
                },
              ],
              resources,
              livenessProbe,
              readinessProbe,
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
          // Termination grace period
          terminationGracePeriodSeconds: 30,
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // Service: ClusterIP for Internal Routing
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('laravel-web-service', {
    metadata: {
      name: 'laravel-web',
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
          port: 80,
          targetPort: 8000,
          protocol: 'TCP',
        },
      ],
      sessionAffinity: 'None',
    },
  });

  // -------------------------------------------------------------------------
  // HPA: Horizontal Pod Autoscaler (Optional)
  // -------------------------------------------------------------------------

  let hpa: k8s.autoscaling.v2.HorizontalPodAutoscaler | undefined;

  if (featureFlags.hpa) {
    hpa = createHPA(
      'laravel-web-hpa',
      namespace,
      'laravel-web',
      'Deployment',
      laravelConfig.webMinReplicas,
      laravelConfig.webMaxReplicas,
      70, // Target CPU utilization: 70%
      labels
    );
  }

  // -------------------------------------------------------------------------
  // PDB: Pod Disruption Budget (Optional)
  // -------------------------------------------------------------------------

  let pdb: k8s.policy.v1.PodDisruptionBudget | undefined;

  if (featureFlags.pdb) {
    // Ensure at least 1 pod is available during disruptions
    const minAvailable = Math.max(1, Math.floor(laravelConfig.webReplicas / 2));

    pdb = createPDB('laravel-web-pdb', namespace, selectorLabels, minAvailable, labels);
  }

  // -------------------------------------------------------------------------
  // Return Created Resources
  // -------------------------------------------------------------------------

  return {
    deployment,
    service,
    hpa,
    pdb,
  };
}
