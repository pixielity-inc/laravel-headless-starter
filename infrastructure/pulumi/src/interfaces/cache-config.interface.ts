/**
 * ==============================================================================
 * Cache Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for cache engine deployment with support
 * for multiple cache systems (Redis, Memcached, Valkey).
 *
 * @interface CacheConfig
 * @module interfaces
 * ==============================================================================
 */

import { CacheEngine, RedisEvictionPolicy } from '@/types';

/**
 * Cache configuration interface.
 *
 * This interface defines all configuration options for cache deployment,
 * supporting multiple cache engines with their specific features.
 *
 * @example
 * ```typescript
 * // Redis with persistence
 * const redisConfig: CacheConfig = {
 *   engine: "redis",
 *   version: "7.2",
 *   persistence: true,
 *   evictionPolicy: "allkeys-lru"
 * };
 *
 * // Memcached configuration
 * const memcachedConfig: CacheConfig = {
 *   engine: "memcached",
 *   version: "1.6"
 * };
 * ```
 */
export interface CacheConfig {
  /**
   * Cache engine type.
   *
   * Determines which cache system to deploy:
   * - "redis": In-memory data structure store (most popular)
   * - "memcached": High-performance distributed memory caching
   * - "valkey": Redis fork with enhanced features
   *
   * @type {CacheEngine}
   * @default "redis"
   * @example "redis", "memcached", "valkey"
   *
   * @comparison
   * Redis:
   * - Rich data structures (strings, lists, sets, hashes, sorted sets)
   * - Persistence options (RDB, AOF)
   * - Pub/Sub messaging
   * - Lua scripting
   * - Transactions
   *
   * Memcached:
   * - Simple key-value store
   * - No persistence
   * - Lower memory overhead
   * - Faster for simple operations
   * - Multi-threaded
   *
   * Valkey:
   * - Redis-compatible
   * - Enhanced performance
   * - Additional features
   * - Active development
   *
   * @recommendation
   * - Redis: Best for most use cases (sessions, queues, cache)
   * - Memcached: Best for simple caching with high throughput
   * - Valkey: Alternative to Redis with similar features
   */
  engine: CacheEngine;

  /**
   * Cache engine version.
   *
   * Specifies the version of the cache engine.
   * Available versions depend on the selected engine.
   *
   * @type {string}
   * @required true
   * @example
   * - Redis: "6.2", "7.0", "7.2", "7.4"
   * - Memcached: "1.6", "1.6-alpine"
   * - Valkey: "7.2", "8.0"
   *
   * @recommendation
   * - Use latest stable version for new projects
   * - Redis 7.x: Improved performance and new features
   * - Memcached 1.6: Latest stable with TLS support
   * - Valkey 8.x: Latest with enhanced features
   */
  version: string;

  /**
   * Enable persistence.
   *
   * Only applicable for Redis and Valkey.
   * When enabled, data is persisted to disk and survives restarts.
   *
   * @type {boolean | undefined}
   * @optional Only for Redis/Valkey
   * @default false (local), true (production)
   *
   * @persistence_modes
   * - RDB (Redis Database): Point-in-time snapshots
   * - AOF (Append Only File): Log of all write operations
   * - Hybrid: Combination of RDB and AOF
   *
   * @use_cases
   * - Session storage (requires persistence)
   * - Queue data (requires persistence)
   * - Cache data (persistence optional)
   *
   * @trade_offs
   * - Pros: Data survives restarts, disaster recovery
   * - Cons: Slower writes, increased disk I/O, larger storage
   *
   * @example
   * ```typescript
   * persistence: true  // Enable RDB + AOF
   * ```
   *
   * @note
   * - Memcached does not support persistence
   * - Persistence adds ~10-20% write latency
   * - Requires persistent volume (PVC)
   */
  persistence?: boolean;

  /**
   * Eviction policy.
   *
   * Only applicable for Redis and Valkey.
   * Determines how keys are evicted when memory limit is reached.
   *
   * @type {RedisEvictionPolicy | undefined}
   * @optional Only for Redis/Valkey
   * @default "allkeys-lru"
   *
   * @available_policies
   * - "noeviction": Return errors when memory limit reached (no eviction)
   * - "allkeys-lru": Evict least recently used keys (recommended for cache)
   * - "allkeys-lfu": Evict least frequently used keys (better for hot data)
   * - "allkeys-random": Evict random keys (fastest eviction)
   * - "volatile-lru": Evict LRU keys with TTL set
   * - "volatile-lfu": Evict LFU keys with TTL set
   * - "volatile-random": Evict random keys with TTL set
   * - "volatile-ttl": Evict keys with shortest TTL
   *
   * @use_cases
   * - Cache: "allkeys-lru" or "allkeys-lfu"
   * - Sessions: "noeviction" (never evict sessions)
   * - Queues: "noeviction" (never evict jobs)
   * - Mixed: "volatile-lru" (only evict cache, not sessions/queues)
   *
   * @example
   * ```typescript
   * evictionPolicy: "allkeys-lru"  // Evict least recently used
   * ```
   *
   * @recommendation
   * - Cache only: "allkeys-lru" (most common)
   * - Cache + Sessions: "volatile-lru" (set TTL on cache keys only)
   * - Critical data: "noeviction" (prevent data loss)
   *
   * @note
   * - LRU: Good for temporal locality (recent = important)
   * - LFU: Good for frequency locality (popular = important)
   * - Set appropriate maxmemory limit
   */
  evictionPolicy?: RedisEvictionPolicy;
}
