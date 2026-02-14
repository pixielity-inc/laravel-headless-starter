/**
 * ==============================================================================
 * RabbitMQ Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for RabbitMQ message broker.
 * RabbitMQ is used for traditional message queuing, task distribution,
 * and pub/sub messaging patterns.
 *
 * @interface RabbitMQConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';
import { RabbitMQVersion } from '@/types';

/**
 * RabbitMQ message broker configuration interface.
 *
 * RabbitMQ provides reliable message queuing with features like:
 * - Message acknowledgments and persistence
 * - Flexible routing (direct, topic, fanout, headers)
 * - Dead letter queues for failed messages
 * - Message TTL and priority queues
 * - Plugin ecosystem (management UI, MQTT, STOMP)
 *
 * @example
 * ```typescript
 * const rabbitmqConfig: RabbitMQConfig = {
 *   enabled: true,
 *   host: "rabbitmq",
 *   port: 5672,
 *   managementPort: 15672,
 *   username: "guest",
 *   password: pulumi.secret("guest"),
 *   replicas: 1,
 *   tls: false
 * };
 * ```
 */
export interface RabbitMQConfig {
  /**
   * Enable in-cluster RabbitMQ deployment.
   *
   * When true, deploys RabbitMQ as a StatefulSet in Kubernetes.
   * When false, assumes an external managed RabbitMQ service.
   *
   * @type {boolean}
   * @default true (local/dev), false (production)
   * @recommendation Use managed RabbitMQ services in production:
   *   - AWS Amazon MQ for RabbitMQ
   *   - CloudAMQP
   *   - Azure Service Bus (AMQP compatible)
   *   - Google Cloud Pub/Sub (AMQP compatible)
   *
   * Benefits of managed services:
   * - Automatic failover and high availability
   * - Automated backups and disaster recovery
   * - Monitoring and alerting
   * - Security patches and updates
   * - Better performance and scalability
   * - Reduced operational overhead
   */
  enabled: boolean;

  /**
   * RabbitMQ server hostname or IP address.
   *
   * For in-cluster deployment: Use Kubernetes service name
   * For managed service: Use the provided endpoint hostname
   *
   * @type {string}
   * @default "rabbitmq" (in-cluster)
   * @example
   * - In-cluster: "rabbitmq" or "rabbitmq.laravel-prod.svc.cluster.local"
   * - AWS Amazon MQ: "b-xxxxx.mq.us-east-1.amazonaws.com"
   * - CloudAMQP: "rabbit.cloudamqp.com"
   * - Azure Service Bus: "myservicebus.servicebus.windows.net"
   */
  host: string;

  /**
   * AMQP protocol port number.
   *
   * Standard port for RabbitMQ AMQP 0-9-1 protocol.
   *
   * @type {number}
   * @default 5672 (standard), 5671 (TLS)
   * @standard RabbitMQ default AMQP port is 5672
   * @note Some managed services use different ports (e.g., 5671 for TLS)
   */
  port: number;

  /**
   * RabbitMQ version.
   *
   * Specifies the RabbitMQ version to use.
   *
   * @type {RabbitMQVersion | undefined}
   * @optional
   * @default "3.13"
   * @example "3.12", "3.13", "3.12-management", "3.13-management"
   *
   * @recommendation
   * - Use latest stable version for new projects
   * - RabbitMQ 3.13: Latest with improved performance
   * - Use "-management" suffix for management UI
   */
  version?: RabbitMQVersion;

  /**
   * Management UI and HTTP API port number.
   *
   * Provides web-based management interface and REST API.
   *
   * @type {number}
   * @default 15672
   * @standard RabbitMQ management plugin default port
   * @features
   * - Web UI for queue management
   * - REST API for monitoring
   * - User and permission management
   * - Virtual host configuration
   */
  managementPort: number;

  /**
   * RabbitMQ authentication username.
   *
   * Used for AMQP connections and management API access.
   *
   * @type {string}
   * @default "guest" (local only)
   * @example "rabbitmq_prod", "app_user", "laravel_queue"
   * @security
   * - Never use "guest" in production
   * - Create separate users for different applications
   * - Grant minimum required permissions (vhost access)
   * - Use descriptive usernames for audit trails
   */
  username: string;

  /**
   * RabbitMQ authentication password.
   *
   * Required for all AMQP connections and management API access.
   *
   * @type {pulumi.Output<string>}
   * @security
   * - Stored as encrypted secret in Pulumi state
   * - Use strong passwords (16+ characters, mixed case, numbers, symbols)
   * - Rotate passwords regularly (every 90 days)
   * - Never commit plaintext passwords to version control
   * - Consider using AWS Secrets Manager or similar for production
   *
   * @example
   * ```typescript
   * // Set via Pulumi CLI
   * pulumi config set --secret rabbitmq:password "MySecureRabbitMQP@ssw0rd123"
   *
   * // Or in code
   * password: pulumi.secret("MySecureRabbitMQP@ssw0rd123")
   * ```
   */
  password: pulumi.Output<string>;

  /**
   * Number of RabbitMQ replicas for high availability.
   *
   * For in-cluster deployment:
   * - 1 replica: Single instance (local/dev)
   * - 3+ replicas: High availability cluster with mirrored queues (production)
   *
   * For managed services:
   * - This value is informational only
   * - Actual replication is managed by the cloud provider
   *
   * @type {number}
   * @default 1 (local), 3 (production with in-cluster)
   * @minimum 1
   * @recommendation
   * - Local/Dev: 1 replica (saves resources)
   * - Production in-cluster: 3 replicas (HA with quorum queues)
   * - Production managed: 1 (provider handles HA)
   *
   * @note
   * - RabbitMQ clustering requires proper network configuration
   * - Use quorum queues for better consistency in clusters
   * - Classic mirrored queues are deprecated in RabbitMQ 3.12+
   */
  replicas: number;

  /**
   * Enable TLS/SSL encryption for RabbitMQ connections.
   *
   * When enabled, all AMQP connections are encrypted using TLS.
   * Required for production deployments to protect data in transit.
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @security
   * - Always enable TLS in production
   * - Protects against man-in-the-middle attacks
   * - Encrypts message payloads and credentials
   * - Required for compliance (PCI-DSS, HIPAA, SOC 2)
   *
   * @note
   * - TLS adds ~5-10% latency overhead
   * - Requires certificate configuration
   * - May require client-side certificate verification
   * - Management UI should also use HTTPS
   *
   * @example
   * ```typescript
   * // Production with TLS
   * tls: true
   *
   * // Local development without TLS
   * tls: false
   * ```
   */
  tls: boolean;
}
