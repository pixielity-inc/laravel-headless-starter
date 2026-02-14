/**
 * ==============================================================================
 * Kafka Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for Apache Kafka event streaming platform.
 * Kafka is used for event-driven architecture, async microservices communication,
 * and real-time data pipelines.
 *
 * @interface KafkaConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';
import { KafkaVersion } from '@/types';

/**
 * Apache Kafka configuration interface.
 *
 * This interface defines all configuration options for Kafka deployment,
 * including:
 * - Broker connection parameters
 * - Authentication and security settings (SASL/SSL)
 * - Deployment strategy (in-cluster vs managed service)
 * - Scaling and storage configuration
 *
 * Kafka use cases:
 * - Event sourcing and CQRS patterns
 * - Microservices communication
 * - Real-time data streaming
 * - Log aggregation
 * - Activity tracking
 * - Metrics collection
 *
 * @example
 * ```typescript
 * // Local development configuration (KRaft mode)
 * const localKafka: KafkaConfig = {
 *   enabled: true,
 *   brokers: "kafka:9092",
 *   replicas: 1,
 *   storageSize: "10Gi",
 *   saslMechanism: undefined,
 *   username: undefined,
 *   password: undefined
 * };
 *
 * // Production managed service configuration (AWS MSK)
 * const prodKafka: KafkaConfig = {
 *   enabled: false,  // Using AWS MSK
 *   brokers: "b-1.mycluster.xxxxx.kafka.us-east-1.amazonaws.com:9092",
 *   replicas: 3,  // Managed by MSK
 *   storageSize: "100Gi",
 *   saslMechanism: "SCRAM-SHA-512",
 *   username: "kafka_prod",
 *   password: pulumi.secret("secure-kafka-password")
 * };
 * ```
 */
export interface KafkaConfig {
  /**
   * Enable in-cluster Kafka deployment.
   *
   * When true, deploys Kafka as a StatefulSet in Kubernetes using KRaft mode.
   * When false, assumes an external managed Kafka service.
   *
   * @type {boolean}
   * @default true (local/dev), false (production)
   * @recommendation Use managed Kafka services in production:
   *   - AWS MSK (Managed Streaming for Apache Kafka)
   *   - Confluent Cloud
   *   - Azure Event Hubs for Kafka
   *   - Google Cloud Pub/Sub (Kafka-compatible)
   *
   * Benefits of managed services:
   * - Automatic scaling and rebalancing
   * - Multi-AZ high availability
   * - Automated backups and disaster recovery
   * - Monitoring and alerting
   * - Security and compliance
   * - Reduced operational overhead
   */
  enabled: boolean;

  /**
   * Kafka broker connection string.
   *
   * Comma-separated list of broker addresses in host:port format.
   * Multiple brokers provide redundancy and load balancing.
   *
   * @type {string}
   * @format "host1:port1,host2:port2,host3:port3"
   * @example
   * - In-cluster single broker: "kafka:9092"
   * - In-cluster multiple brokers: "kafka-0:9092,kafka-1:9092,kafka-2:9092"
   * - AWS MSK: "b-1.cluster.xxxxx.kafka.us-east-1.amazonaws.com:9092,b-2.cluster.xxxxx.kafka.us-east-1.amazonaws.com:9092"
   * - Confluent Cloud: "pkc-xxxxx.us-east-1.aws.confluent.cloud:9092"
   *
   * @note
   * - List all brokers for better fault tolerance
   * - Clients will discover other brokers automatically
   * - Use internal DNS names for in-cluster communication
   */
  brokers: string;

  /**
   * Kafka version.
   *
   * Specifies the Kafka version to use.
   *
   * @type {KafkaVersion | undefined}
   * @optional
   * @default "3.8"
   * @example "3.6", "3.7", "3.8"
   *
   * @recommendation
   * - Use latest stable version for new projects
   * - Kafka 3.8: Latest with KRaft mode stable
   * - Kafka 3.5+: KRaft is production-ready
   */
  version?: KafkaVersion;

  /**
   * Number of Kafka broker replicas.
   *
   * For in-cluster deployment:
   * - 1 broker: Single instance (local/dev only)
   * - 3+ brokers: Production-ready cluster with replication
   *
   * For managed services:
   * - This value is informational only
   * - Actual broker count is managed by the cloud provider
   *
   * @type {number}
   * @default 1 (local), 3 (production)
   * @minimum 1
   * @recommendation
   * - Local/Dev: 1 broker (saves resources)
   * - Production in-cluster: 3+ brokers (HA and fault tolerance)
   * - Production managed: 3+ brokers (configured in provider)
   *
   * @note
   * - Odd numbers (3, 5, 7) work better for quorum-based operations
   * - More brokers = better throughput and fault tolerance
   * - Each broker needs dedicated storage
   */
  replicas: number;

  /**
   * Persistent storage size per Kafka broker.
   *
   * Each broker gets its own PersistentVolumeClaim of this size.
   * Storage holds topic data, logs, and metadata.
   *
   * @type {string}
   * @format Kubernetes storage format (e.g., "10Gi", "100Gi", "1Ti")
   * @default "10Gi" (local), "100Gi" (production)
   * @recommendation
   * - Calculate based on: (message size × retention period × throughput)
   * - Add 50% buffer for growth and compaction
   * - Monitor disk usage and expand before reaching 80%
   *
   * @example
   * - Small workload: "10Gi" (1M messages/day, 7 days retention)
   * - Medium workload: "50Gi" (10M messages/day, 7 days retention)
   * - Large workload: "200Gi" (100M messages/day, 7 days retention)
   * - Enterprise: "1Ti" (1B+ messages/day, 30 days retention)
   *
   * @note
   * - Cannot be decreased after creation
   * - Consider log compaction for space efficiency
   * - Use tiered storage for long-term retention
   */
  storageSize: string;

  /**
   * SASL authentication mechanism for secure Kafka connections.
   *
   * SASL (Simple Authentication and Security Layer) provides authentication
   * between Kafka clients and brokers.
   *
   * @type {string | undefined}
   * @optional Not required for local development
   * @values
   * - "PLAIN": Simple username/password (not recommended for production)
   * - "SCRAM-SHA-256": Salted Challenge Response (good security)
   * - "SCRAM-SHA-512": Salted Challenge Response (best security)
   * - "GSSAPI": Kerberos authentication (enterprise)
   * - "OAUTHBEARER": OAuth 2.0 authentication
   *
   * @default undefined (local), "SCRAM-SHA-512" (production)
   * @recommendation
   * - Local: undefined (no auth for simplicity)
   * - Production: "SCRAM-SHA-512" (best balance of security and compatibility)
   * - Enterprise: "GSSAPI" (if using Kerberos)
   *
   * @security
   * - Always use SASL in production
   * - Combine with SSL/TLS for encryption
   * - Rotate credentials regularly
   *
   * @example
   * ```typescript
   * saslMechanism: "SCRAM-SHA-512"
   * ```
   */
  saslMechanism?: string;

  /**
   * Kafka authentication username.
   *
   * Required when SASL authentication is enabled.
   * Used for client authentication to Kafka brokers.
   *
   * @type {string | undefined}
   * @optional Not required if saslMechanism is undefined
   * @example "kafka_producer", "laravel_consumer", "app_user"
   * @security
   * - Use descriptive usernames for audit trails
   * - Create separate users for different applications
   * - Grant minimum required permissions (ACLs)
   */
  username?: string;

  /**
   * Kafka authentication password.
   *
   * Required when SASL authentication is enabled.
   * Used for client authentication to Kafka brokers.
   *
   * @type {pulumi.Output<string> | undefined}
   * @optional Not required if saslMechanism is undefined
   * @security
   * - Stored as encrypted secret in Pulumi state
   * - Use strong passwords (32+ characters)
   * - Rotate passwords regularly (every 90 days)
   * - Never commit plaintext passwords
   * - Consider using AWS Secrets Manager or similar
   *
   * @example
   * ```typescript
   * // Set via Pulumi CLI
   * pulumi config set --secret kafka:password "MySecureKafkaP@ssw0rd123"
   *
   * // Or in code
   * password: pulumi.secret("MySecureKafkaP@ssw0rd123")
   * ```
   */
  password?: pulumi.Output<string>;
}
