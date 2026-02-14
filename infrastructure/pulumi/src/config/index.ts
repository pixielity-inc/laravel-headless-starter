/**
 * ==============================================================================
 * Configuration Module
 * ==============================================================================
 * Centralized configuration management for the Kubernetes infrastructure.
 * Loads and validates configuration from Pulumi stack files.
 *
 * This module provides type-safe access to all configuration values with
 * sensible defaults and validation.
 *
 * @module config
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';

/**
 * Re-export all interface types from the interfaces module for convenience
 */
import type {
  RedisConfig,
  KafkaConfig,
  FeatureFlags,
  SearchConfig,
  LaravelConfig,
  StorageConfig,
  MailpitConfig,
  IngressConfig,
  PostgresConfig,
  RabbitMQConfig,
  ObservabilityConfig,
  MySQLConfig,
  MariaDBConfig,
  MemcachedConfig,
  BeanstalkdConfig,
  DatabaseConfig,
  CacheConfig,
  QueueConfig,
} from '@/interfaces';

/**
 * Main configuration class that loads all settings from Pulumi config.
 * Provides type-safe access to configuration values with defaults.
 */
export class Config {
  /**
   * Private configuration store and stack name
   */
  private config: pulumi.Config;

  /**
   * Private stack name for environment detection
   */
  private stack: string;

  /**
   * Creates a new Config instance and loads Pulumi configuration.
   */
  constructor() {
    this.stack = pulumi.getStack();
    this.config = new pulumi.Config();
  }

  /**
   * Determines if the current stack is a local development environment.
   * @returns {boolean} True if running in local/dev environment
   */
  public isLocal(): boolean {
    return this.stack === 'dev' || this.stack === 'local';
  }

  /**
   * Determines if the current stack is production.
   * @returns {boolean} True if running in production environment
   */
  public isProduction(): boolean {
    return this.stack === 'production' || this.stack === 'prod';
  }

  /**
   * Gets the current stack name.
   * @returns {string} Stack name (dev, staging, production)
   */
  public getStack(): string {
    return this.stack;
  }

  /**
   * Gets the Kubernetes namespace for this environment.
   * @returns {string} Kubernetes namespace
   */
  public getNamespace(): string {
    return this.config.get('laravel:namespace') || `laravel-${this.stack}`;
  }

  /**
   * Gets Laravel application configuration.
   * @returns {LaravelConfig} Laravel configuration object
   */
  public getLaravelConfig(): LaravelConfig {
    return {
      environment: this.config.get('laravel:environment') || this.stack,
      debug: this.config.getBoolean('laravel:debug') || !this.isProduction(),
      appName: this.config.get('laravel:appName') || 'Laravel',
      appUrl: this.config.get('laravel:appUrl') || 'http://localhost',
      appKey: this.config.getSecret('laravel:appKey') || pulumi.secret('base64:changeme'),

      // Scaling configuration
      webReplicas: this.config.getNumber('laravel:webReplicas') || (this.isLocal() ? 1 : 3),
      webMinReplicas: this.config.getNumber('laravel:webMinReplicas') || 1,
      webMaxReplicas: this.config.getNumber('laravel:webMaxReplicas') || 10,
      workerReplicas: this.config.getNumber('laravel:workerReplicas') || (this.isLocal() ? 1 : 2),
      workerMinReplicas: this.config.getNumber('laravel:workerMinReplicas') || 1,
      workerMaxReplicas: this.config.getNumber('laravel:workerMaxReplicas') || 20,
      reverbReplicas: this.config.getNumber('laravel:reverbReplicas') || 1,
      reverbMinReplicas: this.config.getNumber('laravel:reverbMinReplicas') || 1,
      reverbMaxReplicas: this.config.getNumber('laravel:reverbMaxReplicas') || 5,

      // Resource limits
      webMemoryLimit: this.config.get('laravel:webMemoryLimit') || '512Mi',
      webMemoryRequest: this.config.get('laravel:webMemoryRequest') || '256Mi',
      webCpuLimit: this.config.get('laravel:webCpuLimit') || '1',
      webCpuRequest: this.config.get('laravel:webCpuRequest') || '0.5',
      workerMemoryLimit: this.config.get('laravel:workerMemoryLimit') || '256Mi',
      workerMemoryRequest: this.config.get('laravel:workerMemoryRequest') || '128Mi',
      workerCpuLimit: this.config.get('laravel:workerCpuLimit') || '0.5',
      workerCpuRequest: this.config.get('laravel:workerCpuRequest') || '0.25',
    };
  }

  /**
   * Gets PostgreSQL database configuration.
   * @returns {PostgresConfig} PostgreSQL configuration object
   */
  public getPostgresConfig(): PostgresConfig {
    const extensions = this.config.getObject<string[]>('postgres:extensions') || [];

    return {
      enabled: this.config.getBoolean('postgres:enabled') ?? this.isLocal(),
      host: this.config.get('postgres:host') || 'postgres',
      port: this.config.getNumber('postgres:port') || 5432,
      database: this.config.get('postgres:database') || 'laravel',
      username: this.config.get('postgres:username') || 'laravel',
      password: this.config.getSecret('postgres:password') || pulumi.secret('changeme'),
      replicas: this.config.getNumber('postgres:replicas') || 1,
      storageSize: this.config.get('postgres:storageSize') || '10Gi',
      extensions: extensions.length > 0 ? (extensions as any[]) : undefined,
    };
  }

  /**
   * Gets MySQL database configuration.
   * @returns {MySQLConfig} MySQL configuration object
   */
  public getMySQLConfig(): MySQLConfig {
    const enabled = this.config.getBoolean('mysql:enabled') ?? false;
    return {
      enabled,
      host: this.config.get('mysql:host') || 'mysql',
      port: this.config.getNumber('mysql:port') || 3306,
      database: this.config.get('mysql:database') || 'laravel',
      username: this.config.get('mysql:username') || 'laravel',
      password: this.config.getSecret('mysql:password') || pulumi.secret('changeme'),
      version: (this.config.get('mysql:version') as any) || '8.4',
      replicas: this.config.getNumber('mysql:replicas') || 1,
      storageSize: this.config.get('mysql:storageSize') || '10Gi',
    };
  }

  /**
   * Gets MariaDB database configuration.
   * @returns {MariaDBConfig} MariaDB configuration object
   */
  public getMariaDBConfig(): MariaDBConfig {
    const enabled = this.config.getBoolean('mariadb:enabled') ?? false;
    return {
      enabled,
      host: this.config.get('mariadb:host') || 'mariadb',
      port: this.config.getNumber('mariadb:port') || 3306,
      database: this.config.get('mariadb:database') || 'laravel',
      username: this.config.get('mariadb:username') || 'laravel',
      password: this.config.getSecret('mariadb:password') || pulumi.secret('changeme'),
      version: (this.config.get('mariadb:version') as any) || '11.4',
      replicas: this.config.getNumber('mariadb:replicas') || 1,
      storageSize: this.config.get('mariadb:storageSize') || '10Gi',
    };
  }

  /**
   * Gets unified database configuration.
   * @returns {DatabaseConfig} Database configuration object
   */
  public getDatabaseConfig(): DatabaseConfig {
    const engine = (this.config.get('database:engine') as any) || 'postgresql';
    const version = this.config.get('database:version') || '16';
    const extensions = this.config.getObject<string[]>('database:extensions') || [];

    return {
      engine,
      version,
      extensions: extensions.length > 0 ? (extensions as any[]) : undefined,
      enablePostGIS: this.config.getBoolean('database:enablePostGIS') || false,
      enableTimescaleDB: this.config.getBoolean('database:enableTimescaleDB') || false,
    };
  }

  /**
   * Gets Redis configuration.
   * @returns {RedisConfig} Redis configuration object
   */
  public getRedisConfig(): RedisConfig {
    return {
      enabled: this.config.getBoolean('redis:enabled') ?? this.isLocal(),
      host: this.config.get('redis:host') || 'redis',
      port: this.config.getNumber('redis:port') || 6379,
      version: this.config.get('redis:version') as any,
      password: this.config.getSecret('redis:password'),
      replicas: this.config.getNumber('redis:replicas') || 1,
      tls: this.config.getBoolean('redis:tls') || false,
    };
  }

  /**
   * Gets Memcached configuration.
   * @returns {MemcachedConfig} Memcached configuration object
   */
  public getMemcachedConfig(): MemcachedConfig {
    return {
      enabled: this.config.getBoolean('memcached:enabled') ?? false,
      host: this.config.get('memcached:host') || 'memcached',
      port: this.config.getNumber('memcached:port') || 11211,
      version: (this.config.get('memcached:version') as any) || '1.6',
      replicas: this.config.getNumber('memcached:replicas') || 1,
    };
  }

  /**
   * Gets unified cache configuration.
   * @returns {CacheConfig} Cache configuration object
   */
  public getCacheConfig(): CacheConfig {
    const engine = (this.config.get('cache:engine') as any) || 'redis';
    const version = this.config.get('cache:version') || '7.4';

    return {
      engine,
      version,
      persistence: this.config.getBoolean('cache:persistence'),
      evictionPolicy: this.config.get('cache:evictionPolicy') as any,
    };
  }

  /**
   * Gets Kafka configuration.
   * @returns {KafkaConfig} Kafka configuration object
   */
  public getKafkaConfig(): KafkaConfig {
    return {
      enabled: this.config.getBoolean('kafka:enabled') ?? this.isLocal(),
      brokers: this.config.get('kafka:brokers') || 'kafka:9092',
      version: this.config.get('kafka:version') as any,
      replicas: this.config.getNumber('kafka:replicas') || 1,
      storageSize: this.config.get('kafka:storageSize') || '10Gi',
      saslMechanism: this.config.get('kafka:saslMechanism'),
      username: this.config.get('kafka:username'),
      password: this.config.getSecret('kafka:password'),
    };
  }

  /**
   * Gets RabbitMQ configuration.
   * @returns {RabbitMQConfig} RabbitMQ configuration object
   */
  public getRabbitMQConfig(): RabbitMQConfig {
    const enabled = this.config.getBoolean('rabbitmq:enabled') ?? this.isLocal();
    return {
      enabled,
      host: this.config.get('rabbitmq:host') || 'rabbitmq',
      port: this.config.getNumber('rabbitmq:port') || 5672,
      version: this.config.get('rabbitmq:version') as any,
      managementPort: this.config.getNumber('rabbitmq:managementPort') || 15672,
      username: this.config.get('rabbitmq:username') || 'guest',
      password: this.config.getSecret('rabbitmq:password') || pulumi.secret('guest'),
      replicas: this.config.getNumber('rabbitmq:replicas') || 1,
      tls: this.config.getBoolean('rabbitmq:tls') || false,
    };
  }

  /**
   * Gets Beanstalkd configuration.
   * @returns {BeanstalkdConfig} Beanstalkd configuration object
   */
  public getBeanstalkdConfig(): BeanstalkdConfig {
    return {
      enabled: this.config.getBoolean('beanstalkd:enabled') ?? false,
      host: this.config.get('beanstalkd:host') || 'beanstalkd',
      port: this.config.getNumber('beanstalkd:port') || 11300,
      version: (this.config.get('beanstalkd:version') as any) || 'latest',
      replicas: this.config.getNumber('beanstalkd:replicas') || 1,
    };
  }

  /**
   * Gets unified queue configuration.
   * @returns {QueueConfig} Queue configuration object
   */
  public getQueueConfig(): QueueConfig {
    const engine = (this.config.get('queue:engine') as any) || 'rabbitmq';
    const version = this.config.get('queue:version') || '3.13';

    return {
      engine,
      version,
      managementUI: this.config.getBoolean('queue:managementUI'),
      kraftMode: this.config.getBoolean('queue:kraftMode'),
    };
  }

  /**
   * Gets MinIO/S3 storage configuration.
   * @returns {StorageConfig} Storage configuration object
   */
  public getStorageConfig(): StorageConfig {
    const minioEnabled = this.config.getBoolean('minio:enabled') ?? this.isLocal();

    if (minioEnabled) {
      return {
        type: 'minio',
        endpoint: this.config.get('minio:endpoint') || 'http://minio:9000',
        accessKey: this.config.get('minio:accessKey') || 'minioadmin',
        secretKey: this.config.getSecret('minio:secretKey') || pulumi.secret('minioadmin'),
        bucket: this.config.get('minio:bucket') || 'laravel',
        replicas: this.config.getNumber('minio:replicas') || 1,
        storageSize: this.config.get('minio:storageSize') || '20Gi',
      };
    } else {
      return {
        type: 's3',
        bucket: this.config.require('s3:bucket'),
        region: this.config.get('s3:region') || 'us-east-1',
        accessKey: this.config.getSecret('s3:accessKey') || pulumi.secret('changeme'),
        secretKey: this.config.getSecret('s3:secretKey') || pulumi.secret('changeme'),
      };
    }
  }

  /**
   * Gets search engine configuration (Meilisearch or Elasticsearch).
   * @returns {SearchConfig} Search configuration object
   */
  public getSearchConfig(): SearchConfig {
    const meilisearchEnabled = this.config.getBoolean('meilisearch:enabled') ?? true;

    if (meilisearchEnabled) {
      return {
        type: 'meilisearch',
        host: this.config.get('meilisearch:host') || 'http://meilisearch:7700',
        masterKey: this.config.getSecret('meilisearch:masterKey') || pulumi.secret('changeme'),
        replicas: this.config.getNumber('meilisearch:replicas') || 1,
      };
    } else {
      return {
        type: 'elasticsearch',
        host: this.config.require('elasticsearch:host'),
        username: this.config.get('elasticsearch:username'),
        password: this.config.getSecret('elasticsearch:password'),
        replicas: this.config.getNumber('elasticsearch:replicas') || 1,
      };
    }
  }

  /**
   * Gets Mailpit configuration (local development only).
   * @returns {MailpitConfig | null} Mailpit configuration or null if disabled
   */
  public getMailpitConfig(): MailpitConfig | null {
    const enabled = this.config.getBoolean('mailpit:enabled') ?? this.isLocal();

    if (!enabled) {
      return null;
    }

    return {
      smtpPort: this.config.getNumber('mailpit:smtpPort') || 1025,
      uiPort: this.config.getNumber('mailpit:uiPort') || 8025,
    };
  }

  /**
   * Gets ingress configuration.
   * @returns {IngressConfig} Ingress configuration object
   */
  public getIngressConfig(): IngressConfig {
    return {
      enabled: this.config.getBoolean('ingress:enabled') ?? true,
      className: this.config.get('ingress:className') || 'nginx',
      host: this.config.get('ingress:host') || 'laravel.local',
      tls: this.config.getBoolean('ingress:tls') || false,
      tlsSecretName: this.config.get('ingress:tlsSecretName'),
      annotations: this.config.getObject<Record<string, string>>('ingress:annotations') || {},
    };
  }

  /**
   * Gets observability configuration.
   * @returns {ObservabilityConfig} Observability configuration object
   */
  public getObservabilityConfig(): ObservabilityConfig {
    return {
      prometheus: this.config.getBoolean('observability:prometheus') ?? true,
      grafana: this.config.getBoolean('observability:grafana') ?? true,
      loki: this.config.getBoolean('observability:loki') ?? this.isProduction(),
      tempo: this.config.getBoolean('observability:tempo') ?? false,
      alertmanager: this.config.getBoolean('observability:alertmanager') ?? this.isProduction(),
    };
  }

  /**
   * Gets feature flags configuration.
   * @returns {FeatureFlags} Feature flags object
   */
  public getFeatureFlags(): FeatureFlags {
    return {
      hpa: this.config.getBoolean('features:hpa') ?? !this.isLocal(),
      pdb: this.config.getBoolean('features:pdb') ?? this.isProduction(),
      networkPolicies: this.config.getBoolean('features:networkPolicies') ?? this.isProduction(),
      podSecurityPolicies:
        this.config.getBoolean('features:podSecurityPolicies') ?? this.isProduction(),
      resourceQuotas: this.config.getBoolean('features:resourceQuotas') ?? this.isProduction(),
    };
  }
}
