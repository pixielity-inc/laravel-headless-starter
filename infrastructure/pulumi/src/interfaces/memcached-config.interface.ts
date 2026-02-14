/**
 * ==============================================================================
 * Memcached Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for Memcached cache deployment.
 *
 * @interface MemcachedConfig
 * @module interfaces
 * ==============================================================================
 */

import { MemcachedVersion } from '@/types';

/**
 * Memcached cache configuration interface.
 *
 * @example
 * ```typescript
 * const memcachedConfig: MemcachedConfig = {
 *   enabled: true,
 *   host: "memcached",
 *   port: 11211,
 *   version: "1.6",
 *   replicas: 1
 * };
 * ```
 */
export interface MemcachedConfig {
  /**
   * Enable in-cluster Memcached deployment.
   *
   * @type {boolean}
   * @default false
   */
  enabled: boolean;

  /**
   * Memcached server hostname.
   *
   * @type {string}
   * @default "memcached"
   */
  host: string;

  /**
   * Memcached server port.
   *
   * @type {number}
   * @default 11211
   */
  port: number;

  /**
   * Memcached version.
   *
   * @type {MemcachedVersion}
   * @example "1.6", "1.6-alpine"
   */
  version: MemcachedVersion;

  /**
   * Number of Memcached replicas.
   *
   * @type {number}
   * @default 1
   */
  replicas: number;
}
