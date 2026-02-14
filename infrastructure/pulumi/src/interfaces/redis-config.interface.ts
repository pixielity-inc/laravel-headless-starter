/**
 * ==============================================================================
 * Redis Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for Redis in-memory data store.
 * Redis is used for caching, sessions, queues, and rate limiting.
 *
 * @interface RedisConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';
import { RedisVersion } from '@/types';

/**
 * Redis configuration interface.
 *
 * This interface defines all configuration options for Redis deployment,
 * including:
 * - Connection parameters (host, port, authentication)
 * - Deployment strategy (in-cluster vs managed service)
 * - High availability and replication settings
 * - TLS/SSL configuration for secure connections
 *
 * Redis is a critical component used for:
 * - Application caching (reducing database load)
 * - Session storage (user authentication state)
 * - Queue backend (background job processing)
 * - Rate limiting (API throttling)
 * - Real-time features (pub/sub messaging)
 *
 * @example
 * ```typescript
 * // Local development configuration
 * const localRedis: RedisConfig = {
 *   enabled: true,
 *   host: "redis",
 *   port: 6379,
 *   password: pulumi.secret("redis_password"),
 *   replicas: 1,
 *   tls: false
 * };
 *
 * // Production managed service configuration
 * const prodRedis: RedisConfig = {
 *   enabled: false,  // Using ElastiCache/MemoryStore
 *   host: "prod-redis.xxxxx.cache.amazonaws.com",
 *   port: 6379,
 *   password: pulumi.secret("secure-redis-password"),
 *   replicas: 1,  // Managed by cloud provider
 *   tls: true  // Encrypted connections
 * };
 * ```
 */
export interface RedisConfig {
  /**
   * Enable in-cluster Redis deployment.
   *
   * When true, deploys Redis as a Deployment/StatefulSet in Kubernetes.
   * When false, assumes an external managed Redis service.
   *
   * @type {boolean}
   * @default true (local/dev), false (production)
   * @recommendation Use managed Redis services in production:
   *   - AWS ElastiCache for Redis
   *   - Google Cloud Memorystore
   *   - Azure Cache for Redis
   *   - Redis Enterprise Cloud
   *
   * Benefits of managed services:
   * - Automatic failover and high availability
   * - Automated backups and snapshots
   * - Monitoring and alerting
   * - Security patches and updates
   * - Better performance and scalability
   */
  enabled: boolean;

  /**
   * Redis server hostname or IP address.
   *
   * For in-cluster deployment: Use Kubernetes service name
   * For managed service: Use the provided endpoint hostname
   *
   * @type {string}
   * @example
   * - In-cluster: "redis" or "redis.laravel-prod.svc.cluster.local"
   * - AWS ElastiCache: "myredis.xxxxx.cache.amazonaws.com"
   * - GCP Memorystore: "10.0.0.4" (private IP)
   * - Azure Cache: "myredis.redis.cache.windows.net"
   * - Redis Cloud: "redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com"
   */
  host: string;

  /**
   * Redis server port number.
   *
   * @type {number}
   * @default 6379 (standard), 6380 (TLS)
   * @standard Redis default port is 6379
   * @note Some managed services use different ports (e.g., 6380 for TLS)
   */
  port: number;

  /**
   * Redis version.
   *
   * Specifies the Redis version to use.
   *
   * @type {RedisVersion | undefined}
   * @optional
   * @default "7.4"
   * @example "6.2", "7.0", "7.2", "7.4"
   *
   * @recommendation
   * - Use latest stable version for new projects
   * - Redis 7.x: Improved performance and new features
   * - Redis 6.2: Stable with ACL support
   */
  version?: RedisVersion;

  /**
   * Redis authentication password.
   *
   * Redis supports password authentication via the AUTH command.
   * Required for production deployments to prevent unauthorized access.
   *
   * @type {pulumi.Output<string> | undefined}
   * @security
   * - Always set a password in production
   * - Use strong passwords (32+ characters recommended)
   * - Stored as encrypted secret in Pulumi state
   * - Rotate passwords regularly
   * - Consider using ACLs (Redis 6+) for fine-grained access control
   *
   * @optional Can be undefined for local development (not recommended)
   *
   * @example
   * ```typescript
   * // Set via Pulumi CLI
   * pulumi config set --secret redis:password "MySecureRedisP@ssw0rd123"
   *
   * // Or in code
   * password: pulumi.secret("MySecureRedisP@ssw0rd123")
   *
   * // No password (local dev only)
   * password: undefined
   * ```
   */
  password: pulumi.Output<string> | undefined;

  /**
   * Number of Redis replicas for high availability.
   *
   * For in-cluster deployment:
   * - 1 replica: Single instance (local/dev)
   * - 3+ replicas: High availability with Redis Sentinel (production)
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
   * - Production in-cluster: 3 replicas (HA with Sentinel)
   * - Production managed: 1 (provider handles HA)
   *
   * @note Redis replication is asynchronous, so some data loss is possible
   *       during failover. For critical data, use Redis Cluster or managed
   *       services with automatic failover.
   */
  replicas: number;

  /**
   * Enable TLS/SSL encryption for Redis connections.
   *
   * When enabled, all connections to Redis are encrypted using TLS.
   * Required for production deployments to protect data in transit.
   *
   * @type {boolean}
   * @default false (local), true (production)
   * @security
   * - Always enable TLS in production
   * - Protects against man-in-the-middle attacks
   * - Encrypts sensitive data (sessions, cache keys, queue payloads)
   * - Required for compliance (PCI-DSS, HIPAA, SOC 2)
   *
   * @note
   * - TLS adds ~5-10% latency overhead
   * - Requires Redis 6+ or managed service with TLS support
   * - May require certificate configuration for self-signed certs
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
