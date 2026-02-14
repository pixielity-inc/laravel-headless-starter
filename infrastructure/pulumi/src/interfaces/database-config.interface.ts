/**
 * ==============================================================================
 * Database Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for database deployment with support
 * for multiple database engines (PostgreSQL, MySQL, MariaDB) and extensions.
 *
 * @interface DatabaseConfig
 * @module interfaces
 * ==============================================================================
 */

import { DatabaseEngine, PostgreSQLExtension } from '@/types';

/**
 * Database configuration interface.
 *
 * This interface defines all configuration options for database deployment,
 * supporting multiple database engines with their specific features and extensions.
 *
 * @example
 * ```typescript
 * // PostgreSQL with PostGIS
 * const postgresConfig: DatabaseConfig = {
 *   engine: "postgresql",
 *   version: "16",
 *   extensions: ["postgis", "uuid-ossp"],
 *   enablePostGIS: true
 * };
 *
 * // MySQL configuration
 * const mysqlConfig: DatabaseConfig = {
 *   engine: "mysql",
 *   version: "8.4"
 * };
 * ```
 */
export interface DatabaseConfig {
  /**
   * Database engine type.
   *
   * Determines which database system to deploy:
   * - "postgresql": PostgreSQL relational database
   * - "mysql": MySQL relational database
   * - "mariadb": MariaDB relational database (MySQL fork)
   *
   * @type {DatabaseEngine}
   * @default "postgresql"
   * @example "postgresql", "mysql", "mariadb"
   *
   * @recommendation
   * - PostgreSQL: Best for complex queries, JSON data, full-text search
   * - MySQL: Best for read-heavy workloads, simple queries
   * - MariaDB: MySQL-compatible with additional features
   */
  engine: DatabaseEngine;

  /**
   * Database version.
   *
   * Specifies the major.minor version of the database engine.
   * Available versions depend on the selected engine.
   *
   * @type {string}
   * @required true
   * @example
   * - PostgreSQL: "12", "13", "14", "15", "16", "17"
   * - MySQL: "5.7", "8.0", "8.1", "8.2", "8.3", "8.4"
   * - MariaDB: "10.6", "10.11", "11.0", "11.1", "11.2", "11.3", "11.4"
   *
   * @recommendation
   * - Use latest stable version for new projects
   * - Check Laravel compatibility before upgrading
   * - Test thoroughly before production upgrades
   */
  version: string;

  /**
   * PostgreSQL extensions to enable.
   *
   * Only applicable when engine is "postgresql".
   * Extensions provide additional functionality beyond core PostgreSQL.
   *
   * @type {PostgreSQLExtension[] | undefined}
   * @optional Only for PostgreSQL
   * @default []
   *
   * @available_extensions
   * - "postgis": Geographic objects support (GIS data)
   * - "timescaledb": Time-series data optimization
   * - "pg_stat_statements": Query performance statistics
   * - "pg_trgm": Trigram matching for fuzzy search
   * - "uuid-ossp": UUID generation functions
   * - "hstore": Key-value store within PostgreSQL
   * - "citext": Case-insensitive text type
   * - "pgcrypto": Cryptographic functions
   * - "pg_partman": Partition management
   * - "pg_repack": Table reorganization without locks
   *
   * @example
   * ```typescript
   * extensions: ["postgis", "uuid-ossp", "pg_trgm"]
   * ```
   *
   * @note
   * - Extensions must be installed in the Docker image
   * - Some extensions require additional configuration
   * - Check extension compatibility with PostgreSQL version
   */
  extensions?: PostgreSQLExtension[];

  /**
   * Enable PostGIS extension.
   *
   * Shorthand for including "postgis" in extensions array.
   * PostGIS adds support for geographic objects and spatial queries.
   *
   * @type {boolean | undefined}
   * @optional Only for PostgreSQL
   * @default false
   *
   * @use_cases
   * - Store and query geographic coordinates
   * - Calculate distances between locations
   * - Perform spatial joins and intersections
   * - Build location-based features
   *
   * @example
   * ```typescript
   * enablePostGIS: true
   * // Equivalent to: extensions: ["postgis"]
   * ```
   *
   * @note
   * - Requires PostGIS-enabled PostgreSQL image
   * - Adds ~50MB to image size
   * - Provides ST_* spatial functions
   */
  enablePostGIS?: boolean;

  /**
   * Enable TimescaleDB extension.
   *
   * Shorthand for including "timescaledb" in extensions array.
   * TimescaleDB optimizes PostgreSQL for time-series data.
   *
   * @type {boolean | undefined}
   * @optional Only for PostgreSQL
   * @default false
   *
   * @use_cases
   * - Store IoT sensor data
   * - Track application metrics over time
   * - Analyze financial time-series data
   * - Monitor system performance
   *
   * @features
   * - Automatic partitioning by time
   * - Compression for old data
   * - Continuous aggregates
   * - Time-based retention policies
   *
   * @example
   * ```typescript
   * enableTimescaleDB: true
   * // Equivalent to: extensions: ["timescaledb"]
   * ```
   *
   * @note
   * - Requires TimescaleDB-enabled PostgreSQL image
   * - Best for append-only time-series data
   * - Provides hypertables and continuous aggregates
   */
  enableTimescaleDB?: boolean;
}
