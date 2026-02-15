/**
 * ==============================================================================
 * Laravel Reverb WebSocket Server Component
 * ==============================================================================
 * Creates Kubernetes resources for Laravel Reverb WebSocket server deployment.
 * Handles real-time broadcasting and WebSocket connections.
 *
 * This component creates:
 * - Deployment: Laravel Reverb WebSocket server pods
 * - Service: ClusterIP service with session affinity for WebSocket connections
 * - HPA: Horizontal Pod Autoscaler (if enabled)
 * - PDB: Pod Disruption Budget (if enabled)
 *
 * @module components/laravel-reverb
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
 * Return type for Laravel Reverb resources.
 *
 * @interface LaravelReverbResources
 */
interface LaravelReverbResources {
  deployment: k8s.apps.v1.Deployment;
  service: k8s.core.v1.Service;
  hpa?: k8s.autoscaling.v2.HorizontalPodAutoscaler;
  pdb?: k8s.policy.v1.PodDisruptionBudget;
}

/**
 * Creates Laravel Reverb WebSocket server Kubernetes resources.
 *
 * Deploys Laravel Reverb with:
 * - Health checks (liveness and readiness probes)
 * - Resource limits and requests
 * - Session affinity for WebSocket connections
 * - Horizontal autoscaling (optional)
 * - Pod disruption budget (optional)
 * - Prometheus metrics scraping
 * - Security contexts (non-root, read-only filesystem)
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @param {string} image - Docker image for Laravel application
 * @returns {LaravelReverbResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const laravelReverb = createLaravelReverb(config, "laravel-prod", "laravel:1.0.0");
 * ```
 *
 * @note
 * WebSocket connections require session affinity (sticky sessions) to ensure
 * clients reconnect to the same pod. The Service uses ClientIP session affinity.
 */
export function createLaravelReverb(
  config: Config,
  namespace: string,
  image: string = 'laravel:latest'
): LaravelReverbResources {
  const laravelConfig = config.getLaravelConfig();
  const featureFlags = config.getFeatureFlags();
  const stack = config.getStack();

  // Generate labels for the Reverb server
  const labels = generateLabels('laravel', 'reverb', stack);
  const selectorLabels = generateSelectorLabels('laravel', 'reverb');

  // Prometheus annotations for metrics scraping
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '8080',
    'prometheus.io/path': '/metrics',
  });

  // Create resource requirements from config
  // Reverb uses similar resources to web server
  const resources = createResourceRequirements(
    laravelConfig.webMemoryRequest,
    laravelConfig.webMemoryLimit,
    laravelConfig.webCpuRequest,
    laravelConfig.webCpuLimit
  );

  // Create health probes
  const livenessProbe = createLivenessProbe('/health', 8080, 30, 10);
  const readinessProbe = createReadinessProbe('/health', 8080, 10, 5);

  // -------------------------------------------------------------------------
  // Deployment: Laravel Reverb WebSocket Server
  // -------------------------------------------------------------------------

  const deployment = new k8s.apps.v1.Deployment('laravel-reverb', {
    metadata: {
      name: 'laravel-reverb',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      replicas: featureFlags.hpa ? undefined : laravelConfig.reverbReplicas,
      selector: {
        matchLabels: selectorLabels,
      },
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0, // Ensure zero downtime for WebSocket connections
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
              name: 'laravel-reverb',
              image,
              imagePullPolicy: 'IfNotPresent',
              command: ['php', 'artisan', 'reverb:start', '--host=0.0.0.0', '--port=8080'],
              ports: [
                {
                  name: 'websocket',
                  containerPort: 8080,
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
                // Cache (Redis for Reverb scaling)
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
                // Reverb
                {
                  name: 'REVERB_APP_ID',
                  value: 'laravel-app',
                },
                {
                  name: 'REVERB_APP_KEY',
                  value: 'laravel-key',
                },
                {
                  name: 'REVERB_APP_SECRET',
                  value: 'laravel-secret',
                },
                {
                  name: 'REVERB_HOST',
                  value: '0.0.0.0',
                },
                {
                  name: 'REVERB_PORT',
                  value: '8080',
                },
                {
                  name: 'REVERB_SCHEME',
                  value: 'http',
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
              // Lifecycle hooks for graceful shutdown
              lifecycle: {
                preStop: {
                  exec: {
                    // Allow time for WebSocket connections to close gracefully
                    command: ['/bin/sh', '-c', 'sleep 15'],
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
          // Termination grace period (allow time for WebSocket connections to close)
          terminationGracePeriodSeconds: 60,
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // Service: ClusterIP with Session Affinity for WebSocket Connections
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('laravel-reverb-service', {
    metadata: {
      name: 'laravel-reverb',
      namespace,
      labels,
      annotations: generateAnnotations({
        'service.kubernetes.io/topology-aware-hints': 'auto',
      }),
    },
    spec: {
      type: 'ClusterIP',
      selector: selectorLabels,
      ports: [
        {
          name: 'websocket',
          port: 80,
          targetPort: 8080,
          protocol: 'TCP',
        },
      ],
      // Session affinity ensures WebSocket connections stick to the same pod
      sessionAffinity: 'ClientIP',
      sessionAffinityConfig: {
        clientIP: {
          timeoutSeconds: 10800, // 3 hours
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // HPA: Horizontal Pod Autoscaler (Optional)
  // -------------------------------------------------------------------------

  let hpa: k8s.autoscaling.v2.HorizontalPodAutoscaler | undefined;

  if (featureFlags.hpa) {
    // Scale based on CPU and active WebSocket connections
    hpa = createHPA(
      'laravel-reverb-hpa',
      namespace,
      'laravel-reverb',
      'Deployment',
      laravelConfig.reverbMinReplicas,
      laravelConfig.reverbMaxReplicas,
      70, // Target CPU utilization: 70%
      labels
    );
  }

  // -------------------------------------------------------------------------
  // PDB: Pod Disruption Budget (Optional)
  // -------------------------------------------------------------------------

  let pdb: k8s.policy.v1.PodDisruptionBudget | undefined;

  if (featureFlags.pdb) {
    // Ensure at least 1 Reverb pod is available during disruptions
    const minAvailable = Math.max(1, Math.floor(laravelConfig.reverbReplicas / 2));

    pdb = createPDB('laravel-reverb-pdb', namespace, selectorLabels, minAvailable, labels);
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
