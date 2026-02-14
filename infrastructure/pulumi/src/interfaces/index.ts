/**
 * ==============================================================================
 * Interfaces Module
 * ==============================================================================
 * Central export point for all configuration interfaces.
 * Provides type-safe configuration structures for the entire infrastructure.
 *
 * @module interfaces
 * ==============================================================================
 */

// Application Configuration
export { LaravelConfig } from './laravel-config.interface';

// Database Configuration
export { PostgresConfig } from './postgres-config.interface';
export { DatabaseConfig } from './database-config.interface';
export { MySQLConfig } from './mysql-config.interface';
export { MariaDBConfig } from './mariadb-config.interface';

// Cache and Queue Configuration
export { RedisConfig } from './redis-config.interface';
export { CacheConfig } from './cache-config.interface';
export { MemcachedConfig } from './memcached-config.interface';

// Message Broker Configuration
export { KafkaConfig } from './kafka-config.interface';
export { RabbitMQConfig } from './rabbitmq-config.interface';
export { QueueConfig } from './queue-config.interface';
export { BeanstalkdConfig } from './beanstalkd-config.interface';

// Storage Configuration
export { StorageConfig } from './storage-config.interface';

// Search Configuration
export { SearchConfig } from './search-config.interface';

// Development Tools Configuration
export { MailpitConfig } from './mailpit-config.interface';
export { MailCatcherConfig } from './mail-catcher-config.interface';

// PHP Runtime Configuration
export { PHPRuntimeConfig } from './php-runtime-config.interface';

// Networking Configuration
export { IngressConfig } from './ingress-config.interface';

// Observability Configuration
export { ObservabilityConfig } from './observability-config.interface';

// Feature Flags
export { FeatureFlags } from './feature-flags.interface';
