/**
 * ==============================================================================
 * Resource Utilities
 * ==============================================================================
 * Helper functions for creating and managing Kubernetes resources.
 * Provides common patterns for resource creation with consistent configuration.
 *
 * @module utils/resources
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

/**
 * Creates a Kubernetes namespace with standard labels and annotations.
 *
 * @param {string} name - Namespace name
 * @param {Record<string, string>} labels - Labels to apply
 * @param {Record<string, string>} annotations - Annotations to apply
 * @returns {k8s.core.v1.Namespace} Created namespace resource
 *
 * @example
 * ```typescript
 * const ns = createNamespace("laravel-prod", {
 *   "environment": "production",
 *   "app.kubernetes.io/name": "laravel"
 * });
 * ```
 */
export function createNamespace(
  name: string,
  labels: Record<string, string> = {},
  annotations: Record<string, string> = {}
): k8s.core.v1.Namespace {
  return new k8s.core.v1.Namespace(name, {
    metadata: {
      name,
      labels,
      annotations,
    },
  });
}

/**
 * Creates a Kubernetes ConfigMap with validation.
 *
 * @param {string} name - ConfigMap name
 * @param {string} namespace - Namespace to create in
 * @param {Record<string, string>} data - Configuration data
 * @param {Record<string, string>} labels - Labels to apply
 * @returns {k8s.core.v1.ConfigMap} Created ConfigMap resource
 *
 * @example
 * ```typescript
 * const config = createConfigMap("app-config", "default", {
 *   "APP_ENV": "production",
 *   "LOG_LEVEL": "info"
 * }, labels);
 * ```
 */
export function createConfigMap(
  name: string,
  namespace: string,
  data: Record<string, string>,
  labels: Record<string, string> = {}
): k8s.core.v1.ConfigMap {
  return new k8s.core.v1.ConfigMap(name, {
    metadata: {
      name,
      namespace,
      labels,
    },
    data,
  });
}

/**
 * Creates resource requirements for pods.
 *
 * @param {string} memoryRequest - Memory request (e.g., "256Mi")
 * @param {string} memoryLimit - Memory limit (e.g., "512Mi")
 * @param {string} cpuRequest - CPU request (e.g., "0.5")
 * @param {string} cpuLimit - CPU limit (e.g., "1")
 * @returns {object} Resource requirements object
 *
 * @example
 * ```typescript
 * const resources = createResourceRequirements("256Mi", "512Mi", "0.5", "1");
 * ```
 */
export function createResourceRequirements(
  memoryRequest: string,
  memoryLimit: string,
  cpuRequest: string,
  cpuLimit: string
) {
  return {
    requests: {
      memory: memoryRequest,
      cpu: cpuRequest,
    },
    limits: {
      memory: memoryLimit,
      cpu: cpuLimit,
    },
  };
}

/**
 * Creates a liveness probe for health checking.
 *
 * @param {string} path - HTTP path to check
 * @param {number} port - Port to check
 * @param {number} initialDelaySeconds - Delay before first check
 * @param {number} periodSeconds - Interval between checks
 * @returns {object} Liveness probe configuration
 *
 * @example
 * ```typescript
 * const probe = createLivenessProbe("/health", 8000, 30, 10);
 * ```
 */
export function createLivenessProbe(
  path: string,
  port: number,
  initialDelaySeconds: number = 30,
  periodSeconds: number = 10
) {
  return {
    httpGet: {
      path,
      port,
    },
    initialDelaySeconds,
    periodSeconds,
    timeoutSeconds: 5,
    failureThreshold: 3,
  };
}

/**
 * Creates a readiness probe for traffic routing.
 *
 * @param {string} path - HTTP path to check
 * @param {number} port - Port to check
 * @param {number} initialDelaySeconds - Delay before first check
 * @param {number} periodSeconds - Interval between checks
 * @returns {object} Readiness probe configuration
 *
 * @example
 * ```typescript
 * const probe = createReadinessProbe("/ready", 8000, 10, 5);
 * ```
 */
export function createReadinessProbe(
  path: string,
  port: number,
  initialDelaySeconds: number = 10,
  periodSeconds: number = 5
) {
  return {
    httpGet: {
      path,
      port,
    },
    initialDelaySeconds,
    periodSeconds,
    timeoutSeconds: 3,
    failureThreshold: 3,
  };
}

/**
 * Creates a PersistentVolumeClaim for storage.
 *
 * @param {string} name - PVC name
 * @param {string} namespace - Namespace to create in
 * @param {string} size - Storage size (e.g., "10Gi")
 * @param {string} storageClass - Storage class name
 * @param {Record<string, string>} labels - Labels to apply
 * @returns {k8s.core.v1.PersistentVolumeClaim} Created PVC resource
 *
 * @example
 * ```typescript
 * const pvc = createPVC("data-volume", "default", "10Gi", "standard", labels);
 * ```
 */
export function createPVC(
  name: string,
  namespace: string,
  size: string,
  storageClass: string = 'standard',
  labels: Record<string, string> = {}
): k8s.core.v1.PersistentVolumeClaim {
  return new k8s.core.v1.PersistentVolumeClaim(name, {
    metadata: {
      name,
      namespace,
      labels,
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      storageClassName: storageClass,
      resources: {
        requests: {
          storage: size,
        },
      },
    },
  });
}

/**
 * Creates a Horizontal Pod Autoscaler.
 *
 * @param {string} name - HPA name
 * @param {string} namespace - Namespace
 * @param {string} targetName - Target deployment/statefulset name
 * @param {string} targetKind - Target kind (Deployment, StatefulSet)
 * @param {number} minReplicas - Minimum replicas
 * @param {number} maxReplicas - Maximum replicas
 * @param {number} targetCPU - Target CPU utilization percentage
 * @param {Record<string, string>} labels - Labels to apply
 * @returns {k8s.autoscaling.v2.HorizontalPodAutoscaler} Created HPA resource
 *
 * @example
 * ```typescript
 * const hpa = createHPA("web-hpa", "default", "web", "Deployment", 3, 20, 70, labels);
 * ```
 */
export function createHPA(
  name: string,
  namespace: string,
  targetName: string,
  targetKind: string,
  minReplicas: number,
  maxReplicas: number,
  targetCPU: number = 70,
  labels: Record<string, string> = {}
): k8s.autoscaling.v2.HorizontalPodAutoscaler {
  return new k8s.autoscaling.v2.HorizontalPodAutoscaler(name, {
    metadata: {
      name,
      namespace,
      labels,
    },
    spec: {
      scaleTargetRef: {
        apiVersion: 'apps/v1',
        kind: targetKind,
        name: targetName,
      },
      minReplicas,
      maxReplicas,
      metrics: [
        {
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              averageUtilization: targetCPU,
            },
          },
        },
      ],
    },
  });
}

/**
 * Creates a Pod Disruption Budget.
 *
 * @param {string} name - PDB name
 * @param {string} namespace - Namespace
 * @param {Record<string, string>} selector - Pod selector labels
 * @param {number} minAvailable - Minimum available pods
 * @param {Record<string, string>} labels - Labels to apply
 * @returns {k8s.policy.v1.PodDisruptionBudget} Created PDB resource
 *
 * @example
 * ```typescript
 * const pdb = createPDB("web-pdb", "default", {"app": "web"}, 2, labels);
 * ```
 */
export function createPDB(
  name: string,
  namespace: string,
  selector: Record<string, string>,
  minAvailable: number,
  labels: Record<string, string> = {}
): k8s.policy.v1.PodDisruptionBudget {
  return new k8s.policy.v1.PodDisruptionBudget(name, {
    metadata: {
      name,
      namespace,
      labels,
    },
    spec: {
      minAvailable,
      selector: {
        matchLabels: selector,
      },
    },
  });
}
