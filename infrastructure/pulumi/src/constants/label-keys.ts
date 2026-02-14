/**
 * ==============================================================================
 * Label Keys Constants
 * ==============================================================================
 * Standard Kubernetes label keys following recommended conventions.
 * These labels are used across all Kubernetes resources for consistent
 * identification, selection, and management.
 *
 * @see https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/
 * @module constants/label-keys
 * ==============================================================================
 */

/**
 * Standard Kubernetes label keys following recommended conventions.
 *
 * These labels provide consistent metadata for all Kubernetes resources:
 * - Resource identification and grouping
 * - Service discovery and selection
 * - Monitoring and observability
 * - Cost allocation and tracking
 * - Operational management
 *
 * @constant
 * @readonly
 *
 * @example
 * ```typescript
 * import { LabelKeys } from "@/constants";
 *
 * const labels = {
 *   [LabelKeys.APP_NAME]: "laravel",
 *   [LabelKeys.APP_COMPONENT]: "web",
 *   [LabelKeys.ENVIRONMENT]: "production"
 * };
 * ```
 */
export const LabelKeys = {
  /**
   * Name of the application.
   *
   * Identifies the application or service name.
   *
   * @type {string}
   * @example "laravel", "redis", "postgres"
   */
  APP_NAME: 'app.kubernetes.io/name',

  /**
   * Current version of the application.
   *
   * Tracks the application version for rollbacks and auditing.
   *
   * @type {string}
   * @example "1.0.0", "2.3.1", "latest"
   */
  APP_VERSION: 'app.kubernetes.io/version',

  /**
   * Component within the architecture.
   *
   * Identifies the role or component type within the application.
   *
   * @type {string}
   * @example "web", "worker", "database", "cache", "queue"
   */
  APP_COMPONENT: 'app.kubernetes.io/component',

  /**
   * Name of a higher level application this one is part of.
   *
   * Groups related components into a logical application stack.
   *
   * @type {string}
   * @example "laravel-stack", "ecommerce-platform"
   */
  APP_PART_OF: 'app.kubernetes.io/part-of',

  /**
   * Tool being used to manage the operation of an application.
   *
   * Identifies the deployment tool or infrastructure-as-code system.
   *
   * @type {string}
   * @example "pulumi", "helm", "terraform", "kubectl"
   */
  APP_MANAGED_BY: 'app.kubernetes.io/managed-by',

  /**
   * Instance identifier.
   *
   * Unique identifier for this specific instance of the application.
   *
   * @type {string}
   * @example "laravel-prod-001", "laravel-staging-002"
   */
  APP_INSTANCE: 'app.kubernetes.io/instance',

  /**
   * Environment identifier.
   *
   * Identifies the deployment environment.
   *
   * @type {string}
   * @example "dev", "staging", "production"
   */
  ENVIRONMENT: 'environment',
} as const;
