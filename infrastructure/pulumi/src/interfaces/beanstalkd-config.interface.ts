/**
 * ==============================================================================
 * Beanstalkd Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for Beanstalkd queue deployment.
 *
 * @interface BeanstalkdConfig
 * @module interfaces
 * ==============================================================================
 */

import { BeanstalkdVersion } from '@/types';

/**
 * Beanstalkd queue configuration interface.
 *
 * @example
 * ```typescript
 * const beanstalkdConfig: BeanstalkdConfig = {
 *   enabled: true,
 *   host: "beanstalkd",
 *   port: 11300,
 *   version: "latest",
 *   replicas: 1
 * };
 * ```
 */
export interface BeanstalkdConfig {
  /**
   * Enable in-cluster Beanstalkd deployment.
   *
   * @type {boolean}
   * @default false
   */
  enabled: boolean;

  /**
   * Beanstalkd server hostname.
   *
   * @type {string}
   * @default "beanstalkd"
   */
  host: string;

  /**
   * Beanstalkd server port.
   *
   * @type {number}
   * @default 11300
   */
  port: number;

  /**
   * Beanstalkd version.
   *
   * @type {BeanstalkdVersion}
   * @example "1.13", "latest"
   */
  version: BeanstalkdVersion;

  /**
   * Number of Beanstalkd replicas.
   *
   * @type {number}
   * @default 1
   */
  replicas: number;
}
