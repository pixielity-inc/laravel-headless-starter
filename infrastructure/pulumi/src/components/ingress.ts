/**
 * ==============================================================================
 * Ingress Component
 * ==============================================================================
 * Creates Kubernetes Ingress resource for external HTTP/HTTPS access.
 * Manages routing, TLS termination, and load balancing.
 *
 * This component creates:
 * - Ingress: External access to Laravel web service
 *
 * @module components/ingress
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import { generateLabels, generateAnnotations } from '@/utils';
import { Config } from '@/config';

/**
 * Return type for Ingress resources.
 *
 * @interface IngressResources
 */
interface IngressResources {
  ingress?: k8s.networking.v1.Ingress;
}

/**
 * Creates Kubernetes Ingress resource.
 *
 * Deploys Ingress with:
 * - External HTTP/HTTPS access
 * - TLS/SSL termination (optional)
 * - Virtual host routing
 * - Custom annotations for Ingress Controller
 * - cert-manager integration (optional)
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {IngressResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const ingress = createIngress(config, "laravel-prod");
 * ```
 *
 * @note
 * Requires an Ingress Controller to be installed in the cluster:
 * - NGINX Ingress Controller (most popular)
 * - Traefik (modern, feature-rich)
 * - Kong (API gateway features)
 * - AWS ALB Ingress Controller (AWS-specific)
 */
export function createIngress(config: Config, namespace: string): IngressResources {
  const ingressConfig = config.getIngressConfig();
  const stack = config.getStack();

  // Skip if Ingress is disabled
  if (!ingressConfig.enabled) {
    return {};
  }

  // Generate labels
  const labels = generateLabels('laravel', 'ingress', stack);

  // Merge custom annotations with standard annotations
  const annotations = generateAnnotations({
    ...ingressConfig.annotations,
  });

  // -------------------------------------------------------------------------
  // Ingress: External HTTP/HTTPS Access
  // -------------------------------------------------------------------------

  const ingress = new k8s.networking.v1.Ingress('laravel-ingress', {
    metadata: {
      name: 'laravel-ingress',
      namespace,
      labels,
      annotations,
    },
    spec: {
      ingressClassName: ingressConfig.className,
      // TLS configuration (optional)
      ...(ingressConfig.tls && ingressConfig.tlsSecretName
        ? {
            tls: [
              {
                hosts: [ingressConfig.host],
                secretName: ingressConfig.tlsSecretName,
              },
            ],
          }
        : {}),
      rules: [
        {
          host: ingressConfig.host,
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: 'laravel-web',
                    port: {
                      number: 80,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  });

  return {
    ingress,
  };
}
