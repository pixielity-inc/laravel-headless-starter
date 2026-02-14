/**
 * ==============================================================================
 * Observability Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for observability stack.
 * Includes monitoring, logging, tracing, and alerting components.
 *
 * @interface ObservabilityConfig
 * @module interfaces
 * ==============================================================================
 */

/**
 * Observability stack configuration interface.
 *
 * Provides comprehensive monitoring and observability:
 * - Prometheus: Metrics collection and alerting
 * - Grafana: Metrics visualization and dashboards
 * - Loki: Log aggregation and querying
 * - Tempo: Distributed tracing
 * - Alertmanager: Alert routing and notification
 *
 * @example
 * ```typescript
 * // Production observability
 * const prodObservability: ObservabilityConfig = {
 *   prometheus: true,
 *   grafana: true,
 *   loki: true,
 *   tempo: true,
 *   alertmanager: true
 * };
 *
 * // Local development (minimal)
 * const localObservability: ObservabilityConfig = {
 *   prometheus: true,
 *   grafana: true,
 *   loki: false,  // Save resources
 *   tempo: false,
 *   alertmanager: false
 * };
 * ```
 */
export interface ObservabilityConfig {
  /**
   * Enable Prometheus metrics collection.
   *
   * Prometheus scrapes metrics from all pods with prometheus.io annotations.
   * Provides time-series metrics storage and querying.
   *
   * @type {boolean}
   * @default true
   * @features
   * - Metrics collection from all services
   * - Time-series database for metrics
   * - PromQL query language
   * - Alerting rules and recording rules
   * - Service discovery for targets
   * - Federation for multi-cluster setups
   *
   * @metrics_collected
   * - Application: Request rate, error rate, response time
   * - Infrastructure: CPU, memory, disk, network
   * - Laravel: Queue depth, job processing time, cache hit rate
   * - Database: Connection pool, query time, slow queries
   * - Redis: Memory usage, hit rate, evictions
   *
   * @recommendation
   * - Always enable in all environments
   * - Essential for monitoring and alerting
   * - Required for autoscaling decisions
   * - Helps with performance optimization
   *
   * @note
   * - Retention: 15 days (local), 30 days (production)
   * - Storage: ~1-2GB per day for typical Laravel app
   * - Scrape interval: 15 seconds (configurable)
   */
  prometheus: boolean;

  /**
   * Enable Grafana dashboards and visualization.
   *
   * Grafana provides beautiful dashboards for visualizing Prometheus metrics.
   * Pre-configured dashboards for Laravel, Kubernetes, and infrastructure.
   *
   * @type {boolean}
   * @default true
   * @features
   * - Pre-built dashboards for Laravel and Kubernetes
   * - Custom dashboard creation
   * - Alerting and notifications
   * - Multiple data source support
   * - User authentication and permissions
   * - Dashboard sharing and embedding
   *
   * @dashboards_included
   * - Laravel Application: Requests, errors, response times
   * - Kubernetes Cluster: Node health, pod status, resource usage
   * - PostgreSQL: Connections, queries, replication lag
   * - Redis: Memory, commands, hit rate
   * - NGINX Ingress: Traffic, status codes, latency
   *
   * @recommendation
   * - Always enable for visualization
   * - Essential for monitoring and troubleshooting
   * - Provides at-a-glance system health
   * - Helps identify performance bottlenecks
   *
   * @access
   * - Local: kubectl port-forward svc/grafana 3000:3000
   * - Production: https://grafana.example.com (via Ingress)
   * - Default credentials: admin/admin (change immediately)
   */
  grafana: boolean;

  /**
   * Enable Loki log aggregation.
   *
   * Loki aggregates logs from all pods and provides log querying.
   * Like Prometheus, but for logs instead of metrics.
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @features
   * - Centralized log aggregation
   * - LogQL query language (similar to PromQL)
   * - Label-based log indexing
   * - Integration with Grafana
   * - Low storage overhead (indexes labels, not content)
   * - Horizontal scalability
   *
   * @logs_collected
   * - Application logs (Laravel logs)
   * - Container stdout/stderr
   * - Kubernetes events
   * - Ingress access logs
   * - Database query logs (if enabled)
   *
   * @recommendation
   * - Local: false (saves resources, use kubectl logs)
   * - Staging: true (test log aggregation)
   * - Production: true (essential for troubleshooting)
   *
   * @note
   * - Requires Promtail for log collection
   * - Retention: 7 days (configurable)
   * - Storage: ~500MB-2GB per day for typical Laravel app
   * - Query logs via Grafana Explore
   */
  loki: boolean;

  /**
   * Enable Tempo distributed tracing.
   *
   * Tempo provides distributed tracing for tracking requests across services.
   * Helps identify performance bottlenecks in microservices.
   *
   * @type {boolean}
   * @default false
   * @features
   * - Distributed request tracing
   * - Service dependency mapping
   * - Latency analysis
   * - Error tracking across services
   * - Integration with Grafana
   * - OpenTelemetry compatible
   *
   * @use_cases
   * - Microservices architectures
   * - Debugging slow requests
   * - Understanding service dependencies
   * - Identifying bottlenecks
   * - Error propagation tracking
   *
   * @recommendation
   * - Local: false (not needed for monolith)
   * - Staging: false (unless testing tracing)
   * - Production: true (if using microservices)
   * - Monolith: false (not needed)
   *
   * @note
   * - Requires application instrumentation (OpenTelemetry)
   * - Adds ~1-5ms latency per request
   * - Storage: ~100MB-500MB per day
   * - Sample rate: 1-10% in production (configurable)
   */
  tempo: boolean;

  /**
   * Enable Alertmanager for alert routing and notification.
   *
   * Alertmanager handles alerts from Prometheus and routes them to
   * notification channels (email, Slack, PagerDuty, etc.).
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @features
   * - Alert deduplication and grouping
   * - Silencing and inhibition rules
   * - Multiple notification channels
   * - Alert routing based on labels
   * - High availability mode
   * - Web UI for alert management
   *
   * @notification_channels
   * - Email (SMTP)
   * - Slack
   * - PagerDuty
   * - Opsgenie
   * - Webhook (custom integrations)
   * - Microsoft Teams
   *
   * @alert_types
   * - Critical: Pod crashes, database down, high error rate
   * - Warning: High CPU/memory, slow responses, queue backlog
   * - Info: Deployments, scaling events, configuration changes
   *
   * @recommendation
   * - Local: false (alerts not needed for development)
   * - Staging: true (test alert configuration)
   * - Production: true (essential for incident response)
   *
   * @note
   * - Requires alert rules in Prometheus
   * - Configure notification channels before enabling
   * - Test alerts before production deployment
   * - Set up on-call rotation for critical alerts
   */
  alertmanager: boolean;
}
