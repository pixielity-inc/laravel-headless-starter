/**
 * ==============================================================================
 * Laravel Kubernetes Infrastructure - Main Entry Point
 * ==============================================================================
 * Pulumi program for deploying Laravel applications to Kubernetes.
 * Creates a complete production-ready infrastructure stack.
 *
 * @module index
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';
import { Config } from './config';
import {
  createLaravelApp,
  createLaravelWorker,
  createLaravelReverb,
  createPostgres,
  createMySQL,
  createMariaDB,
  createRedis,
  createMemcached,
  createKafka,
  createRabbitMQ,
  createBeanstalkd,
  createMinio,
  createMeilisearch,
  createMailpit,
  createIngress,
  createObservability,
  createArgoCD,
  getArgoCDConfig,
} from './components';
import { createNamespace, generateLabels } from './utils';

// ============================================================================
// Configuration
// ============================================================================

const config = new Config();
const stack = config.getStack();
const namespace = config.getNamespace();

pulumi.log.info(`Deploying Laravel infrastructure to ${stack} environment`);
pulumi.log.info(`Kubernetes namespace: ${namespace}`);

// ============================================================================
// Namespace
// ============================================================================

const labels = generateLabels('laravel', 'infrastructure', stack);

const ns = createNamespace(namespace, labels, {
  'pulumi.com/stack': stack,
  'pulumi.com/project': pulumi.getProject(),
});

// ============================================================================
// Infrastructure Components
// ============================================================================

pulumi.log.info('Creating infrastructure components...');

// Database - Deploy based on configuration
const databaseConfig = config.getDatabaseConfig();
let postgres, mysql, mariadb;

switch (databaseConfig.engine) {
  case 'postgresql':
    postgres = createPostgres(config, namespace);
    pulumi.log.info('✓ PostgreSQL database configured');
    break;
  case 'mysql':
    mysql = createMySQL(config, namespace);
    pulumi.log.info('✓ MySQL database configured');
    break;
  case 'mariadb':
    mariadb = createMariaDB(config, namespace);
    pulumi.log.info('✓ MariaDB database configured');
    break;
}

// Cache - Deploy based on configuration
const cacheConfig = config.getCacheConfig();
let redis, memcached;

switch (cacheConfig.engine) {
  case 'redis':
    redis = createRedis(config, namespace);
    pulumi.log.info('✓ Redis cache configured');
    break;
  case 'memcached':
    memcached = createMemcached(config, namespace);
    pulumi.log.info('✓ Memcached cache configured');
    break;
  case 'valkey':
    // Valkey uses same component as Redis (compatible)
    redis = createRedis(config, namespace);
    pulumi.log.info('✓ Valkey cache configured');
    break;
}

// Queue - Deploy based on configuration
const queueConfig = config.getQueueConfig();
let kafka, rabbitmq, beanstalkd;

switch (queueConfig.engine) {
  case 'kafka':
    kafka = createKafka(config, namespace);
    pulumi.log.info('✓ Kafka queue configured');
    break;
  case 'rabbitmq':
    rabbitmq = createRabbitMQ(config, namespace);
    pulumi.log.info('✓ RabbitMQ queue configured');
    break;
  case 'beanstalkd':
    beanstalkd = createBeanstalkd(config, namespace);
    pulumi.log.info('✓ Beanstalkd queue configured');
    break;
  case 'redis':
    // Redis can also be used as queue
    if (!redis) {
      redis = createRedis(config, namespace);
    }
    pulumi.log.info('✓ Redis queue configured');
    break;
  case 'sqs':
    pulumi.log.info('✓ AWS SQS queue configured (external)');
    break;
}

// Storage
const storageConfig = config.getStorageConfig();
const minio = storageConfig.type === 'minio' ? createMinio(config, namespace) : undefined;
if (storageConfig.type === 'minio') {
  pulumi.log.info('✓ MinIO storage configured');
} else {
  pulumi.log.info('✓ S3 storage configured (external)');
}

// Search
const searchConfig = config.getSearchConfig();
const meilisearch =
  searchConfig.type === 'meilisearch' ? createMeilisearch(config, namespace) : undefined;
if (searchConfig.type === 'meilisearch') {
  pulumi.log.info('✓ Meilisearch configured');
} else {
  pulumi.log.info('✓ Elasticsearch configured (external)');
}

// Development Tools
const mailpitConfig = config.getMailpitConfig();
const mailpit = mailpitConfig ? createMailpit(config, namespace) : undefined;
if (mailpitConfig) {
  pulumi.log.info('✓ Mailpit configured');
}

// ============================================================================
// Laravel Application Components
// ============================================================================

pulumi.log.info('Creating Laravel application components...');

// Docker image for Laravel (from config or default)
// In production, this would come from a container registry
const laravelImage = 'laravel:latest';

// Web Application
const laravelApp = createLaravelApp(config, namespace, laravelImage);

// Queue Workers
const laravelWorker = createLaravelWorker(config, namespace, laravelImage);

// WebSocket Server
const laravelReverb = createLaravelReverb(config, namespace, laravelImage);

// ============================================================================
// Networking
// ============================================================================

pulumi.log.info('Creating networking components...');

// Ingress for external access
const ingress = createIngress(config, namespace);

// ============================================================================
// Observability
// ============================================================================

pulumi.log.info('Creating observability stack...');

// Monitoring and logging
const observability = createObservability(config, namespace);

// ============================================================================
// GitOps - ArgoCD
// ============================================================================

pulumi.log.info('Creating GitOps stack...');

// ArgoCD for GitOps continuous delivery
const argocdConfig = getArgoCDConfig(new pulumi.Config());
const argocd = createArgoCD(argocdConfig, labels);

if (argocdConfig.enabled) {
  pulumi.log.info('✓ ArgoCD configured');
}

// ============================================================================
// Exports
// ============================================================================

// Export important resource information
export const namespaceName = ns.metadata.name;
export const stackName = stack;

// Laravel Application
export const laravelWebService = laravelApp.service?.metadata.name;
export const laravelWebDeployment = laravelApp.deployment.metadata.name;
export const laravelWorkerDeployment = laravelWorker.deployment.metadata.name;
export const laravelReverbService = laravelReverb.service?.metadata.name;

// Infrastructure Services
export const postgresService = postgres?.service?.metadata.name;
export const redisService = redis?.service?.metadata.name;
export const rabbitmqService = rabbitmq?.service?.metadata.name;
export const minioService = minio?.service?.metadata.name;
export const meilisearchService = meilisearch?.service?.metadata.name;
export const mailpitService = mailpit?.service?.metadata.name;

// Optional services - only exported when enabled in configuration
export const mysqlService = mysql?.service?.metadata.name;
export const mariadbService = mariadb?.service?.metadata.name;
export const memcachedService = memcached?.service?.metadata.name;
export const kafkaService = kafka?.service?.metadata.name;
export const beanstalkdService = beanstalkd?.service?.metadata.name;

// Ingress
export const ingressHost = ingress.ingress?.spec.apply((spec) => {
  if (spec && spec.rules && spec.rules.length > 0) {
    return spec.rules[0].host;
  }
  return undefined;
});

// Observability
export const prometheusService = observability.prometheusService?.metadata.name;
export const grafanaService = observability.grafanaService?.metadata.name;
// export const lokiService = observability.lokiService?.metadata.name; // Disabled in dev

// GitOps
export const argocdNamespace = argocd.namespace?.metadata.name;
export const argocdRelease = argocd.release?.status.name;
export const argocdHost = argocdConfig.enabled ? argocdConfig.host : undefined;

// Application URL
export const appUrl = config.getLaravelConfig().appUrl;

// ============================================================================
// Deployment Summary
// ============================================================================

pulumi.log.info('='.repeat(80));
pulumi.log.info('Laravel Kubernetes Infrastructure Deployment Complete');
pulumi.log.info('='.repeat(80));
pulumi.log.info(`Environment: ${stack}`);
pulumi.log.info(`Namespace: ${namespace}`);
pulumi.log.info('');
pulumi.log.info('Components Deployed:');
pulumi.log.info(`  - Laravel Web: ${laravelApp.deployment ? '✓' : '✗'}`);
pulumi.log.info(`  - Laravel Worker: ${laravelWorker.deployment ? '✓' : '✗'}`);
pulumi.log.info(`  - Laravel Reverb: ${laravelReverb.deployment ? '✓' : '✗'}`);
pulumi.log.info(
  `  - Database (${databaseConfig.engine}): ${postgres?.statefulSet || mysql?.statefulSet || mariadb?.statefulSet ? '✓' : '✗ (external)'}`
);
pulumi.log.info(
  `  - Cache (${cacheConfig.engine}): ${redis?.deployment || memcached?.deployment ? '✓' : '✗ (external)'}`
);
pulumi.log.info(
  `  - Queue (${queueConfig.engine}): ${kafka?.statefulSet || rabbitmq?.statefulSet || beanstalkd?.deployment ? '✓' : '✗ (external)'}`
);
pulumi.log.info(
  `  - Storage (${storageConfig.type}): ${minio?.statefulSet ? '✓' : '✗ (external)'}`
);
pulumi.log.info(
  `  - Search (${searchConfig.type}): ${meilisearch?.deployment ? '✓' : '✗ (external)'}`
);
pulumi.log.info(`  - Mailpit: ${mailpit?.deployment ? '✓' : '✗ (production)'}`);
pulumi.log.info(`  - Ingress: ${ingress.ingress ? '✓' : '✗'}`);
pulumi.log.info(`  - Prometheus: ${observability.prometheusDeployment ? '✓' : '✗'}`);
pulumi.log.info(`  - Grafana: ${observability.grafanaDeployment ? '✓' : '✗'}`);
pulumi.log.info(`  - Loki: ${observability.lokiDeployment ? '✓' : '✗'}`);
pulumi.log.info(`  - ArgoCD: ${argocd.release ? '✓' : '✗'}`);
pulumi.log.info('='.repeat(80));
