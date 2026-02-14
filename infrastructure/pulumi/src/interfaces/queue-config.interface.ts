/**
 * ==============================================================================
 * Queue Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for queue/message broker deployment
 * with support for multiple queue systems.
 *
 * @interface QueueConfig
 * @module interfaces
 * ==============================================================================
 */

import { QueueEngine } from '@/types';

/**
 * Queue configuration interface.
 *
 * This interface defines all configuration options for queue/message broker
 * deployment, supporting multiple queue engines with their specific features.
 *
 * @example
 * ```typescript
 * // RabbitMQ with management UI
 * const rabbitmqConfig: QueueConfig = {
 *   engine: "rabbitmq",
 *   version: "3.13",
 *   managementUI: true
 * };
 *
 * // Kafka with KRaft mode
 * const kafkaConfig: QueueConfig = {
 *   engine: "kafka",
 *   version: "3.8",
 *   kraftMode: true
 * };
 *
 * // Beanstalkd configuration
 * const beanstalkdConfig: QueueConfig = {
 *   engine: "beanstalkd",
 *   version: "latest"
 * };
 * ```
 */
export interface QueueConfig {
  /**
   * Queue engine type.
   *
   * Determines which queue/message broker system to deploy:
   * - "rabbitmq": Advanced message queuing with routing
   * - "kafka": High-throughput event streaming platform
   * - "beanstalkd": Simple, fast work queue
   * - "redis": In-memory data store with pub/sub
   * - "sqs": AWS Simple Queue Service (managed)
   *
   * @type {QueueEngine}
   * @default "rabbitmq"
   * @example "rabbitmq", "kafka", "beanstalkd", "redis", "sqs"
   *
   * @comparison
   * RabbitMQ:
   * - Advanced routing (exchanges, bindings)
   * - Message acknowledgments
   * - Dead letter queues
   * - Priority queues
   * - Management UI
   * - Best for: Traditional message queuing
   *
   * Kafka:
   * - High throughput (millions of messages/sec)
   * - Event streaming and replay
   * - Distributed partitions
   * - Consumer groups
   * - Best for: Event sourcing, log aggregation
   *
   * Beanstalkd:
   * - Simple and fast
   * - Low latency
   * - Minimal features
   * - Easy to use
   * - Best for: Simple background jobs
   *
   * Redis:
   * - In-memory speed
   * - Pub/Sub messaging
   * - List-based queues
   * - Simple implementation
   * - Best for: Simple queues, real-time messaging
   *
   * @recommendation
   * - RabbitMQ: Best for most Laravel applications
   * - Kafka: Best for event-driven microservices
   * - Beanstalkd: Best for simple job queues
   * - Redis: Best for simple queues with low latency
   */
  engine: QueueEngine;

  /**
   * Queue engine version.
   *
   * Specifies the version of the queue engine.
   * Available versions depend on the selected engine.
   *
   * @type {string}
   * @required true
   * @example
   * - RabbitMQ: "3.12", "3.13", "3.12-management", "3.13-management"
   * - Kafka: "3.6", "3.7", "3.8"
   * - Beanstalkd: "1.13", "latest"
   * - Redis: "7.0", "7.2", "7.4"
   *
   * @recommendation
   * - Use latest stable version for new projects
   * - RabbitMQ 3.13: Latest with improved performance
   * - Kafka 3.8: Latest with KRaft mode stable
   * - Beanstalkd: Use "latest" for simplicity
   */
  version: string;

  /**
   * Enable management UI.
   *
   * Only applicable for RabbitMQ.
   * Provides web-based management interface for monitoring and administration.
   *
   * @type {boolean | undefined}
   * @optional Only for RabbitMQ
   * @default true (local/staging), false (production)
   *
   * @features
   * - Queue monitoring and statistics
   * - Message browsing and publishing
   * - User and permission management
   * - Virtual host configuration
   * - Connection and channel monitoring
   * - Plugin management
   *
   * @access
   * - Default port: 15672
   * - Default credentials: guest/guest (change in production!)
   * - URL: http://rabbitmq:15672
   *
   * @example
   * ```typescript
   * managementUI: true  // Enable management UI
   * ```
   *
   * @security
   * - Change default credentials immediately
   * - Use strong passwords
   * - Restrict access via network policies
   * - Enable TLS for production
   *
   * @note
   * - Adds ~50MB to image size
   * - Minimal performance impact
   * - Very useful for debugging
   */
  managementUI?: boolean;

  /**
   * Enable KRaft mode.
   *
   * Only applicable for Kafka.
   * When enabled, Kafka runs without Zookeeper using KRaft consensus protocol.
   *
   * @type {boolean | undefined}
   * @optional Only for Kafka
   * @default true (Kafka 3.3+)
   *
   * @benefits
   * - No Zookeeper dependency (simpler architecture)
   * - Faster metadata operations
   * - Improved scalability
   * - Reduced operational complexity
   * - Lower resource usage
   *
   * @requirements
   * - Kafka 3.3+ (production-ready in 3.5+)
   * - Minimum 3 controller nodes for HA
   * - Cannot migrate from Zookeeper mode
   *
   * @example
   * ```typescript
   * kraftMode: true  // Use KRaft instead of Zookeeper
   * ```
   *
   * @recommendation
   * - Use KRaft for all new Kafka deployments
   * - Kafka 3.5+: KRaft is production-ready
   * - Kafka 4.0+: Zookeeper will be removed
   *
   * @note
   * - KRaft is the future of Kafka
   * - Zookeeper mode is deprecated
   * - Migration from Zookeeper not supported
   * - Requires different configuration
   */
  kraftMode?: boolean;
}
