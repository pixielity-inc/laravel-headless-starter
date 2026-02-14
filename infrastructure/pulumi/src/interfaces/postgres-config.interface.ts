/**
 * ==============================================================================
 * PostgreSQL Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for PostgreSQL database deployment.
 * Supports both in-cluster StatefulSet deployment (local/dev) and managed
 * database services (production).
 *
 * @interface PostgresConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';
import { PostgreSQLExtension } from '@/types';

/**
 * PostgreSQL database configuration interface.
 *
 * This interface defines all configuration options for PostgreSQL database
 * deployment, including:
 * - Connection parameters (host, port, credentials)
 * - Deployment strategy (in-cluster vs managed service)
 * - Scaling and storage configuration
 * - High availability settings
 *
 * @example
 * ```typescript
 * // Local development configuration
 * const localPostgres: PostgresConfig = {
 *   enabled: true,
 *   host: "postgres",
 *   port: 5432,
 *   database: "laravel",
 *   username: "laravel",
 *   password: pulumi.secret("secret"),
 *   replicas: 1,
 *   storageSize: "10Gi"
 * };
 *
 * // Production managed database configuration
 * const prodPostgres: PostgresConfig = {
 *   enabled: false,  // Using managed RDS
 *   host: "prod-db.xxxxx.rds.amazonaws.com",
 *   port: 5432,
 *   database: "laravel_production",
 *   username: "laravel_prod",
 *   password: pulumi.secret("secure-password"),
 *   replicas: 1,  // Managed by RDS
 *   storageSize: "100Gi"
 * };
 * ```
 */
export interface PostgresConfig {
  /**
   * Enable in-cluster PostgreSQL deployment.
   *
   * When true, deploys PostgreSQL as a StatefulSet in the Kubernetes cluster.
   * When false, assumes an external managed database service (RDS, Cloud SQL, etc.).
   *
   * @type {boolean}
   * @default true (local/dev), false (production)
   * @recommendation Use managed database services in production for:
   *   - Automated backups and point-in-time recovery
   *   - High availability and automatic failover
   *   - Managed updates and security patches
   *   - Better performance and scalability
   */
  enabled: boolean;

  /**
   * PostgreSQL server hostname or IP address.
   *
   * For in-cluster deployment: Use Kubernetes service name (e.g., "postgres")
   * For managed service: Use the provided endpoint hostname
   *
   * @type {string}
   * @example
   * - In-cluster: "postgres" or "postgres.laravel-prod.svc.cluster.local"
   * - AWS RDS: "mydb.xxxxx.us-east-1.rds.amazonaws.com"
   * - GCP Cloud SQL: "10.0.0.3" (private IP)
   * - Azure Database: "mydb.postgres.database.azure.com"
   */
  host: string;

  /**
   * PostgreSQL server port number.
   *
   * @type {number}
   * @default 5432
   * @standard PostgreSQL default port
   */
  port: number;

  /**
   * Database name to connect to.
   *
   * This database will be created automatically in in-cluster deployments.
   * For managed services, ensure the database exists before deployment.
   *
   * @type {string}
   * @example "laravel", "laravel_production", "app_database"
   * @naming Use lowercase with underscores, avoid special characters
   */
  database: string;

  /**
   * Database username for authentication.
   *
   * For in-cluster deployment: This user will be created with full privileges.
   * For managed service: Use the username provided by your cloud provider.
   *
   * @type {string}
   * @example "laravel", "laravel_prod", "app_user"
   * @security Avoid using 'postgres' or 'root' in production
   */
  username: string;

  /**
   * Database password for authentication.
   *
   * @type {pulumi.Output<string>}
   * @security
   * - Stored as encrypted secret in Pulumi state
   * - Never commit plaintext passwords to version control
   * - Use strong passwords (16+ characters, mixed case, numbers, symbols)
   * - Rotate passwords regularly in production
   * - Consider using AWS Secrets Manager or similar for production
   *
   * @example
   * ```typescript
   * // Set via Pulumi CLI
   * pulumi config set --secret postgres:password "MySecureP@ssw0rd123"
   *
   * // Or in code
   * password: pulumi.secret("MySecureP@ssw0rd123")
   * ```
   */
  password: pulumi.Output<string>;

  /**
   * Number of PostgreSQL replicas for high availability.
   *
   * For in-cluster deployment:
   * - 1 replica: Single instance (local/dev)
   * - 3+ replicas: High availability with streaming replication (production)
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
   * - Production in-cluster: 3 replicas (HA with quorum)
   * - Production managed: 1 (provider handles HA)
   */
  replicas: number;

  /**
   * Persistent storage size for PostgreSQL data.
   *
   * For in-cluster deployment:
   * - Allocates a PersistentVolumeClaim of this size
   * - Data persists across pod restarts
   * - Cannot be decreased after creation (can only increase)
   *
   * For managed services:
   * - This value is informational only
   * - Configure storage in your cloud provider console
   *
   * @type {string}
   * @format Kubernetes storage format (e.g., "10Gi", "100Gi", "1Ti")
   * @default "10Gi" (local), "100Gi" (production)
   * @recommendation
   * - Calculate based on: (data size × 2) + (growth × 12 months)
   * - Monitor disk usage and expand before reaching 80%
   * - Consider backup storage separately
   *
   * @example
   * - Small app: "10Gi"
   * - Medium app: "50Gi"
   * - Large app: "200Gi"
   * - Enterprise: "1Ti"
   */
  storageSize: string;

  /**
   * PostgreSQL extensions to enable.
   *
   * Extensions provide additional functionality beyond core PostgreSQL.
   * Extensions are installed and enabled automatically during deployment.
   *
   * @type {PostgreSQLExtension[] | undefined}
   * @optional
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
   * - Extensions must be available in the PostgreSQL Docker image
   * - Some extensions require additional configuration
   * - Check extension compatibility with PostgreSQL version
   * - TimescaleDB runs on the same PostgreSQL instance as an extension
   * - PostGIS adds ~50MB to image size
   */
  extensions?: PostgreSQLExtension[];
}
