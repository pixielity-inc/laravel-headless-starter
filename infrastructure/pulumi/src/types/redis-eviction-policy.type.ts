/**
 * ==============================================================================
 * Redis Eviction Policy Type
 * ==============================================================================
 * Type definition for Redis eviction policies.
 *
 * @module types/redis-eviction-policy
 * ==============================================================================
 */

/**
 * Redis eviction policies.
 *
 * Determines how keys are evicted when memory limit is reached.
 *
 * @type {string}
 * @enum
 */
export type RedisEvictionPolicy =
  | 'noeviction' // Return errors when memory limit is reached
  | 'allkeys-lru' // Evict least recently used keys
  | 'allkeys-lfu' // Evict least frequently used keys
  | 'allkeys-random' // Evict random keys
  | 'volatile-lru' // Evict LRU keys with expire set
  | 'volatile-lfu' // Evict LFU keys with expire set
  | 'volatile-random' // Evict random keys with expire set
  | 'volatile-ttl'; // Evict keys with shortest TTL
