/**
 * ==============================================================================
 * MariaDB Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for MariaDB database deployment.
 * Supports both in-cluster deployment and managed database services.
 *
 * @interface MariaDBConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';
import { MariaDBVersion } from '@/types';

/**
 * MariaDB database configuration interface.
 *
 * @example
 * ```typescript
 * const mariadbConfig: MariaDBConfig = {
 *   enabled: true,
 *   host: "mariadb",
 *   port: 3306,
 *   database: "laravel",
 *   username: "laravel",
 *   password: pulumi.secret("secret"),
 *   version: "11.4",
 *   replicas: 1,
 *   storageSize: "10Gi"
 * };
 * ```
 */
export interface MariaDBConfig {
  /**
   * Enable in-cluster MariaDB deployment.
   *
   * @type {boolean}
   * @default true (local/dev), false (production)
   */
  enabled: boolean;

  /**
   * MariaDB server hostname or IP address.
   *
   * @type {string}
   * @example "mariadb", "mariadb.laravel-prod.svc.cluster.local"
   */
  host: string;

  /**
   * MariaDB server port number.
   *
   * @type {number}
   * @default 3306
   */
  port: number;

  /**
   * Database name.
   *
   * @type {string}
   * @example "laravel", "laravel_production"
   */
  database: string;

  /**
   * Database username.
   *
   * @type {string}
   * @example "laravel", "laravel_prod"
   */
  username: string;

  /**
   * Database password.
   *
   * @type {pulumi.Output<string>}
   * @security Stored as encrypted secret
   */
  password: pulumi.Output<string>;

  /**
   * MariaDB version.
   *
   * @type {MariaDBVersion}
   * @example "10.11", "11.4"
   */
  version: MariaDBVersion;

  /**
   * Number of MariaDB replicas.
   *
   * @type {number}
   * @default 1
   */
  replicas: number;

  /**
   * Persistent storage size.
   *
   * @type {string}
   * @example "10Gi", "100Gi"
   */
  storageSize: string;
}
