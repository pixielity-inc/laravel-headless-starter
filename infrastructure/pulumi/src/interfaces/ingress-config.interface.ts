/**
 * ==============================================================================
 * Ingress Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for Kubernetes Ingress.
 * Ingress manages external access to services, typically HTTP/HTTPS.
 *
 * @interface IngressConfig
 * @module interfaces
 * ==============================================================================
 */

/**
 * Kubernetes Ingress configuration interface.
 *
 * Ingress provides:
 * - External HTTP/HTTPS access to services
 * - TLS/SSL termination
 * - Virtual host routing
 * - Path-based routing
 * - Load balancing
 *
 * @example
 * ```typescript
 * const ingressConfig: IngressConfig = {
 *   enabled: true,
 *   className: "nginx",
 *   host: "api.example.com",
 *   tls: true,
 *   tlsSecretName: "api-tls-cert",
 *   annotations: {
 *     "cert-manager.io/cluster-issuer": "letsencrypt-prod",
 *     "nginx.ingress.kubernetes.io/rate-limit": "100"
 *   }
 * };
 * ```
 */
export interface IngressConfig {
  /**
   * Enable Ingress resource creation.
   *
   * When true, creates a Kubernetes Ingress resource for external HTTP/HTTPS access.
   * When false, services are only accessible within the cluster.
   *
   * @type {boolean}
   * @default true
   * @recommendation
   * - Local/Dev: true (for easy access via browser)
   * - Production: true (required for external access)
   * - Internal services: false (no external access needed)
   *
   * @note
   * - Requires an Ingress Controller to be installed (nginx, traefik, etc.)
   * - Without Ingress, use kubectl port-forward or LoadBalancer services
   * - Ingress provides centralized routing and TLS termination
   */
  enabled: boolean;

  /**
   * Ingress class name to use.
   *
   * Specifies which Ingress Controller should handle this Ingress.
   * Different controllers provide different features and performance.
   *
   * @type {string}
   * @default "nginx"
   * @options
   * - "nginx": NGINX Ingress Controller (most popular)
   * - "traefik": Traefik Ingress Controller (modern, feature-rich)
   * - "kong": Kong Ingress Controller (API gateway features)
   * - "istio": Istio Ingress Gateway (service mesh)
   * - "alb": AWS ALB Ingress Controller (AWS-specific)
   *
   * @recommendation
   * - General use: "nginx" (battle-tested, widely supported)
   * - Modern features: "traefik" (automatic HTTPS, middleware)
   * - API gateway: "kong" (rate limiting, authentication)
   * - Service mesh: "istio" (advanced traffic management)
   *
   * @note
   * - Ingress Controller must be installed in cluster
   * - Each controller has different annotation support
   * - Check controller documentation for specific features
   */
  className: string;

  /**
   * Hostname for the application.
   *
   * The domain name where the application will be accessible.
   * Must be a valid DNS hostname.
   *
   * @type {string}
   * @required true
   * @example
   * - Local: "laravel.local", "api.local"
   * - Staging: "staging-api.example.com"
   * - Production: "api.example.com", "www.example.com"
   *
   * @dns
   * - Must point to Ingress Controller's LoadBalancer IP
   * - Use A record for IPv4 or AAAA for IPv6
   * - Can use CNAME for cloud load balancers
   * - Wildcard subdomains supported: "*.example.com"
   *
   * @recommendation
   * - Use subdomain for API: "api.example.com"
   * - Separate by environment: "staging-api.example.com"
   * - Consider CDN for static assets
   *
   * @note
   * - For local development, add to /etc/hosts
   * - Production requires proper DNS configuration
   * - SSL certificates must match hostname
   */
  host: string;

  /**
   * Enable TLS/SSL encryption.
   *
   * When true, configures HTTPS with TLS certificate.
   * When false, uses HTTP only (not recommended for production).
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @security
   * - Always enable TLS in production
   * - Protects data in transit
   * - Required for modern browsers (HSTS, secure cookies)
   * - Improves SEO rankings
   * - Required for compliance (PCI-DSS, HIPAA)
   *
   * @recommendation
   * - Local/Dev: false (simpler setup, self-signed certs cause warnings)
   * - Staging: true (test TLS configuration)
   * - Production: true (mandatory for security)
   *
   * @note
   * - Requires valid TLS certificate in Kubernetes Secret
   * - Use cert-manager for automatic certificate management
   * - Let's Encrypt provides free certificates
   * - Wildcard certificates cover all subdomains
   */
  tls: boolean;

  /**
   * Kubernetes secret name containing TLS certificate.
   *
   * Only required when tls is true.
   * Secret must contain tls.crt and tls.key files.
   *
   * @type {string | undefined}
   * @optional Only required when tls=true
   * @example "api-tls-cert", "wildcard-tls", "letsencrypt-prod"
   * @format
   * ```yaml
   * apiVersion: v1
   * kind: Secret
   * type: kubernetes.io/tls
   * metadata:
   *   name: api-tls-cert
   * data:
   *   tls.crt: <base64-encoded-certificate>
   *   tls.key: <base64-encoded-private-key>
   * ```
   *
   * @recommendation
   * - Use cert-manager for automatic certificate management
   * - Store certificates securely (never commit to git)
   * - Use separate certificates per environment
   * - Monitor certificate expiration dates
   *
   * @note
   * - cert-manager can create this secret automatically
   * - Certificate must be valid for the specified hostname
   * - Wildcard certificates can cover multiple subdomains
   * - Consider using AWS ACM or similar for managed certificates
   */
  tlsSecretName?: string;

  /**
   * Custom annotations for Ingress controller.
   *
   * Annotations provide configuration specific to the Ingress Controller.
   * Different controllers support different annotations.
   *
   * @type {Record<string, string>}
   * @default {}
   * @example
   * ```typescript
   * annotations: {
   *   // cert-manager automatic certificate
   *   "cert-manager.io/cluster-issuer": "letsencrypt-prod",
   *
   *   // NGINX rate limiting
   *   "nginx.ingress.kubernetes.io/rate-limit": "100",
   *
   *   // Force HTTPS redirect
   *   "nginx.ingress.kubernetes.io/ssl-redirect": "true",
   *
   *   // CORS configuration
   *   "nginx.ingress.kubernetes.io/enable-cors": "true",
   *
   *   // Request timeout
   *   "nginx.ingress.kubernetes.io/proxy-read-timeout": "3600",
   *
   *   // WebSocket support
   *   "nginx.ingress.kubernetes.io/websocket-services": "reverb",
   *
   *   // Client body size limit
   *   "nginx.ingress.kubernetes.io/proxy-body-size": "50m"
   * }
   * ```
   *
   * @common_annotations
   * - cert-manager.io/cluster-issuer: Automatic TLS certificate
   * - nginx.ingress.kubernetes.io/rate-limit: Rate limiting
   * - nginx.ingress.kubernetes.io/ssl-redirect: Force HTTPS
   * - nginx.ingress.kubernetes.io/enable-cors: CORS support
   * - nginx.ingress.kubernetes.io/auth-type: Authentication
   *
   * @recommendation
   * - Use cert-manager for automatic HTTPS
   * - Enable rate limiting to prevent abuse
   * - Force HTTPS redirect in production
   * - Configure appropriate timeouts for long requests
   * - Set body size limit based on upload requirements
   *
   * @note
   * - Annotations are controller-specific
   * - Check controller documentation for supported annotations
   * - Invalid annotations are silently ignored
   * - Some annotations require controller configuration
   */
  annotations: Record<string, string>;
}
