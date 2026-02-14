/**
 * ==============================================================================
 * Types Module
 * ==============================================================================
 * Central export point for all type definitions and enums.
 * Provides type-safe configuration options for infrastructure components.
 *
 * @module types
 * ==============================================================================
 */

// Database types
export * from './database-engine.type';
export * from './postgresql-version.type';
export * from './mysql-version.type';
export * from './mariadb-version.type';
export * from './postgresql-extension.type';

// Cache types
export * from './cache-engine.type';
export * from './redis-version.type';
export * from './memcached-version.type';
export * from './valkey-version.type';
export * from './redis-eviction-policy.type';

// Queue types
export * from './queue-engine.type';
export * from './rabbitmq-version.type';
export * from './kafka-version.type';
export * from './beanstalkd-version.type';

// Mail types
export * from './mail-catcher.type';
export * from './mailpit-version.type';
export * from './mailhog-version.type';

// PHP types
export * from './php-runtime.type';
export * from './php-version.type';
export * from './octane-server.type';
export * from './fpm-process-manager.type';

// Search types
export * from './search-engine.type';
export * from './meilisearch-version.type';
export * from './elasticsearch-version.type';
export * from './opensearch-version.type';
export * from './typesense-version.type';
