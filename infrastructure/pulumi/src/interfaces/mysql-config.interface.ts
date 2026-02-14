/**
 * ==============================================================================
 * MySQL Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for MySQL database deployment.
 * Supports both in-cluster deployment and managed database services.
 *
 * @interface MySQLConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';
import { MySQLVersion } from '@/types';

/**
 * MySQL database configuration interface.
 *
 * @example
 * ```typescript
 * const mysqlConfig: MySQLConfig = {
 *   enabled: true,
 *   host: "mysql",
 *   port: 3306,
 *   database: "laravel",
 *   username: "laravel",
 *   password: pulumi.secret("secret"),
 *   version: "8.4",
 *   replicas: 1,
 *   storageSize: "10Gi"
 * };
 * ```
 */
export interface MySQLConfig {
  /**
   * Enable in-cluster MySQL deployment.
   *
   * @type {boolean}
   * @default true (local/dev), false (production)
   */
  enabled: boolean;

  /**
   * MySQL server hostname or IP address.
   *
   * @type {string}
   * @example "mysql", "mysql.laravel-prod.svc.cluster.local"
   */
  host: string;

  /**
   * MySQL server port number.
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
   * MySQL version.
   *
   * @type {MySQLVersion}
   * @example "5.7", "8.0", "8.4"
   */
  version: MySQLVersion;

  /**
   * Number of MySQL replicas.
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
