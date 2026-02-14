/**
 * ==============================================================================
 * PostgreSQL Extension Type
 * ==============================================================================
 * Type definition for supported PostgreSQL extensions.
 *
 * @module types/postgresql-extension
 * ==============================================================================
 */

/**
 * Supported PostgreSQL extensions.
 *
 * @type {string}
 * @enum
 */
export type PostgreSQLExtension =
  | 'postgis' // Geographic objects support
  | 'timescaledb' // Time-series data optimization
  | 'pg_stat_statements' // Query performance statistics
  | 'pg_trgm' // Trigram matching for fuzzy search
  | 'uuid-ossp' // UUID generation functions
  | 'hstore' // Key-value store within PostgreSQL
  | 'citext' // Case-insensitive text type
  | 'pgcrypto' // Cryptographic functions
  | 'pg_partman' // Partition management
  | 'pg_repack'; // Table reorganization without locks
