/**
 * ==============================================================================
 * Label Utilities
 * ==============================================================================
 * Utility functions for generating consistent Kubernetes labels and selectors.
 * Follows Kubernetes recommended label conventions.
 *
 * @see https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/
 * @module utils/labels
 * ==============================================================================
 */

import { LabelKeys } from '@/constants';

/**
 * Generates standard labels for a Kubernetes resource.
 *
 * @param {string} name - Name of the application/component
 * @param {string} component - Component type (web, worker, database, etc.)
 * @param {string} environment - Environment name (dev, staging, production)
 * @param {string} version - Application version
 * @returns {Record<string, string>} Label object
 *
 * @example
 * ```typescript
 * const labels = generateLabels("laravel", "web", "production", "1.0.0");
 * // Returns:
 * // {
 * //   "app.kubernetes.io/name": "laravel",
 * //   "app.kubernetes.io/component": "web",
 * //   "app.kubernetes.io/part-of": "laravel-stack",
 * //   "app.kubernetes.io/managed-by": "pulumi",
 * //   "app.kubernetes.io/version": "1.0.0",
 * //   "environment": "production"
 * // }
 * ```
 */
export function generateLabels(
  name: string,
  component: string,
  environment: string,
  version: string = 'latest'
): Record<string, string> {
  return {
    [LabelKeys.APP_NAME]: name,
    [LabelKeys.APP_COMPONENT]: component,
    [LabelKeys.APP_PART_OF]: 'laravel-stack',
    [LabelKeys.APP_MANAGED_BY]: 'pulumi',
    [LabelKeys.APP_VERSION]: version,
    [LabelKeys.ENVIRONMENT]: environment,
  };
}

/**
 * Generates selector labels for matching pods.
 * Uses a subset of labels that should remain stable across updates.
 *
 * @param {string} name - Name of the application/component
 * @param {string} component - Component type
 * @returns {Record<string, string>} Selector label object
 *
 * @example
 * ```typescript
 * const selector = generateSelectorLabels("laravel", "web");
 * // Returns:
 * // {
 * //   "app.kubernetes.io/name": "laravel",
 * //   "app.kubernetes.io/component": "web"
 * // }
 * ```
 */
export function generateSelectorLabels(name: string, component: string): Record<string, string> {
  return {
    [LabelKeys.APP_NAME]: name,
    [LabelKeys.APP_COMPONENT]: component,
  };
}

/**
 * Merges custom labels with standard labels.
 * Custom labels take precedence over standard labels.
 *
 * @param {Record<string, string>} standardLabels - Standard labels
 * @param {Record<string, string>} customLabels - Custom labels to merge
 * @returns {Record<string, string>} Merged label object
 *
 * @example
 * ```typescript
 * const standard = generateLabels("laravel", "web", "prod");
 * const custom = { "team": "backend", "cost-center": "engineering" };
 * const merged = mergeLabels(standard, custom);
 * ```
 */
export function mergeLabels(
  standardLabels: Record<string, string>,
  customLabels: Record<string, string> = {}
): Record<string, string> {
  return {
    ...standardLabels,
    ...customLabels,
  };
}

/**
 * Generates annotations for Kubernetes resources.
 *
 * @param {Record<string, string>} customAnnotations - Custom annotations
 * @returns {Record<string, string>} Annotation object
 *
 * @example
 * ```typescript
 * const annotations = generateAnnotations({
 *   "prometheus.io/scrape": "true",
 *   "prometheus.io/port": "9090"
 * });
 * ```
 */
export function generateAnnotations(
  customAnnotations: Record<string, string> = {}
): Record<string, string> {
  return {
    'pulumi.com/managed': 'true',
    ...customAnnotations,
  };
}
