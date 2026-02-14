/**
 * ==============================================================================
 * Cache Engine Type
 * ==============================================================================
 * Type definition for supported cache engines.
 *
 * @module types/cache-engine
 * ==============================================================================
 */

/**
 * Supported cache engines.
 *
 * @type {string}
 * @enum
 */
export type CacheEngine = 'redis' | 'memcached' | 'valkey';
