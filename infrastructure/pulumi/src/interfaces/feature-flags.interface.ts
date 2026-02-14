/**
 * ==============================================================================
 * Feature Flags Interface
 * ==============================================================================
 * Defines feature flags for enabling/disabling Kubernetes features.
 * Allows environment-specific feature control (local vs production).
 *
 * @interface FeatureFlags
 * @module interfaces
 * ==============================================================================
 */

/**
 * Feature flags configuration interface.
 *
 * Controls which Kubernetes features are enabled:
 * - HPA: Horizontal Pod Autoscaling
 * - PDB: Pod Disruption Budgets
 * - Network Policies: Network isolation
 * - Pod Security Policies: Security constraints
 * - Resource Quotas: Namespace resource limits
 *
 * @example
 * ```typescript
 * // Production features (all enabled)
 * const prodFeatures: FeatureFlags = {
 *   hpa: true,
 *   pdb: true,
 *   networkPolicies: true,
 *   podSecurityPolicies: true,
 *   resourceQuotas: true
 * };
 *
 * // Local development (minimal)
 * const localFeatures: FeatureFlags = {
 *   hpa: false,  // Fixed replicas
 *   pdb: false,  // Not needed
 *   networkPolicies: false,  // Easier debugging
 *   podSecurityPolicies: false,
 *   resourceQuotas: false
 * };
 * ```
 */
export interface FeatureFlags {
  /**
   * Enable Horizontal Pod Autoscaling (HPA).
   *
   * When enabled, automatically scales pods based on CPU/memory utilization.
   * Ensures optimal resource usage and handles traffic spikes.
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @features
   * - Automatic scaling based on metrics
   * - CPU and memory-based scaling
   * - Custom metrics support (queue depth, request rate)
   * - Scale up and scale down policies
   * - Min and max replica limits
   * - Cooldown periods to prevent flapping
   *
   * @scaling_triggers
   * - CPU utilization > 70%
   * - Memory utilization > 80%
   * - Custom metrics (e.g., queue depth > 100)
   *
   * @recommendation
   * - Local: false (fixed replicas for predictability)
   * - Staging: true (test autoscaling behavior)
   * - Production: true (handle traffic variations)
   *
   * @note
   * - Requires metrics-server to be installed
   * - Scale up: 30 seconds after threshold
   * - Scale down: 5 minutes after threshold (prevents flapping)
   * - Works with Deployment and StatefulSet
   *
   * @example
   * ```yaml
   * # HPA scales web pods from 3 to 20 based on CPU
   * minReplicas: 3
   * maxReplicas: 20
   * targetCPUUtilization: 70%
   * ```
   */
  hpa: boolean;

  /**
   * Enable Pod Disruption Budgets (PDB).
   *
   * When enabled, ensures minimum number of pods remain available during
   * voluntary disruptions (node drains, updates, scaling down).
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @features
   * - Prevents all pods from being terminated simultaneously
   * - Ensures high availability during updates
   * - Protects against accidental downtime
   * - Works with rolling updates
   * - Configurable minimum available pods
   *
   * @protection_scenarios
   * - Node drains (maintenance, upgrades)
   * - Cluster autoscaler scale-down
   * - Manual pod evictions
   * - Deployment rollouts
   *
   * @recommendation
   * - Local: false (single node, not needed)
   * - Staging: true (test update procedures)
   * - Production: true (prevent downtime during updates)
   *
   * @note
   * - Only protects against voluntary disruptions
   * - Does not protect against node failures
   * - Requires at least 2 replicas to be effective
   * - Can block node drains if too restrictive
   *
   * @example
   * ```yaml
   * # Ensure at least 2 web pods are always available
   * minAvailable: 2
   * # Or ensure max 1 pod is unavailable
   * maxUnavailable: 1
   * ```
   */
  pdb: boolean;

  /**
   * Enable Network Policies for pod-to-pod isolation.
   *
   * When enabled, restricts network traffic between pods based on labels.
   * Implements zero-trust networking within the cluster.
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @features
   * - Pod-to-pod traffic control
   * - Namespace isolation
   * - Ingress and egress rules
   * - Label-based selection
   * - Default deny policies
   * - Protocol and port restrictions
   *
   * @security_benefits
   * - Limits blast radius of compromised pods
   * - Prevents lateral movement
   * - Enforces least privilege networking
   * - Compliance requirements (PCI-DSS, HIPAA)
   *
   * @recommendation
   * - Local: false (easier debugging without restrictions)
   * - Staging: true (test network policies)
   * - Production: true (security best practice)
   *
   * @note
   * - Requires CNI plugin support (Calico, Cilium, Weave)
   * - Default deny-all policy recommended
   * - Explicitly allow required traffic
   * - Can break services if misconfigured
   * - Test thoroughly before production
   *
   * @example
   * ```yaml
   * # Allow web pods to access database
   * - from:
   *   - podSelector:
   *       matchLabels:
   *         app: laravel-web
   *   ports:
   *   - protocol: TCP
   *     port: 5432
   * ```
   */
  networkPolicies: boolean;

  /**
   * Enable Pod Security Policies for security constraints.
   *
   * When enabled, enforces security standards on pod specifications.
   * Prevents insecure pod configurations.
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @features
   * - Prevent privileged containers
   * - Enforce read-only root filesystem
   * - Restrict volume types
   * - Control host network/IPC/PID access
   * - Enforce security contexts
   * - Prevent privilege escalation
   *
   * @security_standards
   * - Restricted: Most secure (recommended for production)
   * - Baseline: Minimal restrictions
   * - Privileged: No restrictions (development only)
   *
   * @restrictions_enforced
   * - No privileged containers
   * - No host network access
   * - No host path volumes
   * - Run as non-root user
   * - Read-only root filesystem
   * - Drop all capabilities
   *
   * @recommendation
   * - Local: false (flexibility for development)
   * - Staging: true (test security constraints)
   * - Production: true (security best practice)
   *
   * @note
   * - PSP is deprecated in Kubernetes 1.25+
   * - Use Pod Security Standards (PSS) instead
   * - Can break existing workloads if not prepared
   * - Test with audit mode first
   * - Requires pod spec modifications
   *
   * @migration
   * - Kubernetes 1.25+: Use Pod Security Admission
   * - Set namespace labels: pod-security.kubernetes.io/enforce=restricted
   */
  podSecurityPolicies: boolean;

  /**
   * Enable Resource Quotas for namespace limits.
   *
   * When enabled, limits total resource consumption per namespace.
   * Prevents resource exhaustion and ensures fair sharing.
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @features
   * - Limit total CPU and memory per namespace
   * - Limit number of pods, services, PVCs
   * - Prevent resource exhaustion
   * - Fair resource sharing
   * - Cost control
   * - Multi-tenancy support
   *
   * @quotas_enforced
   * - CPU requests and limits
   * - Memory requests and limits
   * - Storage requests
   * - Number of pods
   * - Number of services
   * - Number of PersistentVolumeClaims
   *
   * @recommendation
   * - Local: false (unlimited resources for development)
   * - Staging: true (test resource limits)
   * - Production: true (prevent resource exhaustion)
   * - Multi-tenant: true (isolate tenants)
   *
   * @note
   * - Requires resource requests/limits on all pods
   * - Pods without requests/limits will be rejected
   * - Can prevent deployments if quota exceeded
   * - Monitor quota usage regularly
   * - Adjust quotas based on actual usage
   *
   * @example
   * ```yaml
   * # Namespace quota limits
   * requests.cpu: "10"
   * requests.memory: "20Gi"
   * limits.cpu: "20"
   * limits.memory: "40Gi"
   * pods: "50"
   * ```
   */
  resourceQuotas: boolean;
}
