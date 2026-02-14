/**
 * ==============================================================================
 * Laravel Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for Laravel application deployment.
 * This interface encompasses all Laravel-specific settings including scaling,
 * resource allocation, and application-level configuration.
 *
 * @interface LaravelConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';

/**
 * Laravel application configuration interface.
 *
 * This interface defines all configuration options for deploying Laravel
 * applications in Kubernetes, including:
 * - Application environment settings
 * - Scaling configuration for web, worker, and Reverb pods
 * - Resource limits and requests for optimal performance
 * - Debug and development settings
 *
 * @example
 * ```typescript
 * const laravelConfig: LaravelConfig = {
 *   environment: "production",
 *   debug: false,
 *   appName: "Laravel API",
 *   appUrl: "https://api.example.com",
 *   appKey: pulumi.secret("base64:..."),
 *   webReplicas: 3,
 *   webMinReplicas: 3,
 *   webMaxReplicas: 20,
 *   // ... other configuration
 * };
 * ```
 */
export interface LaravelConfig {
  /**
   * Application environment identifier.
   * Determines which configuration set to use and affects behavior.
   *
   * @type {string}
   * @example "local", "development", "staging", "production"
   */
  environment: string;

  /**
   * Enable debug mode for detailed error messages and logging.
   * Should be false in production for security and performance.
   *
   * @type {boolean}
   * @default false (production), true (development)
   */
  debug: boolean;

  /**
   * Human-readable application name.
   * Used in logs, monitoring dashboards, and user-facing messages.
   *
   * @type {string}
   * @example "Laravel Headless Starter"
   */
  appName: string;

  /**
   * Full URL where the application is accessible.
   * Used for generating absolute URLs, CORS, and OAuth redirects.
   *
   * @type {string}
   * @example "https://api.example.com"
   */
  appUrl: string;

  /**
   * Laravel application encryption key.
   * Must be a base64-encoded 32-character string.
   * Generate with: php artisan key:generate --show
   *
   * @type {pulumi.Output<string>}
   * @security Stored as encrypted secret in Pulumi state
   * @example pulumi.secret("base64:MmwvL+x2OOcdQv3WRmt3ZLr4QXX6PB+N2veydVbVYaE=")
   */
  appKey: pulumi.Output<string>;

  // -------------------------------------------------------------------------
  // Web Server Scaling Configuration
  // -------------------------------------------------------------------------

  /**
   * Initial number of web server pod replicas.
   * Web pods handle HTTP requests via Laravel Octane.
   *
   * @type {number}
   * @default 1 (local), 3 (production)
   * @minimum 1
   */
  webReplicas: number;

  /**
   * Minimum number of web server replicas for HPA (Horizontal Pod Autoscaler).
   * HPA will never scale below this number.
   *
   * @type {number}
   * @default 1 (local), 3 (production)
   * @minimum 1
   */
  webMinReplicas: number;

  /**
   * Maximum number of web server replicas for HPA.
   * HPA will never scale above this number.
   *
   * @type {number}
   * @default 10 (local), 20 (production)
   * @minimum webMinReplicas
   */
  webMaxReplicas: number;

  // -------------------------------------------------------------------------
  // Queue Worker Scaling Configuration
  // -------------------------------------------------------------------------

  /**
   * Initial number of queue worker pod replicas.
   * Workers process background jobs from Redis/RabbitMQ/Kafka queues.
   *
   * @type {number}
   * @default 1 (local), 2 (production)
   * @minimum 1
   */
  workerReplicas: number;

  /**
   * Minimum number of worker replicas for HPA/KEDA.
   * KEDA can scale to zero if no jobs are pending.
   *
   * @type {number}
   * @default 1 (local), 2 (production)
   * @minimum 0
   */
  workerMinReplicas: number;

  /**
   * Maximum number of worker replicas for HPA/KEDA.
   * Workers scale based on queue depth and processing time.
   *
   * @type {number}
   * @default 20 (local), 50 (production)
   * @minimum workerMinReplicas
   */
  workerMaxReplicas: number;

  // -------------------------------------------------------------------------
  // Laravel Reverb (WebSocket) Scaling Configuration
  // -------------------------------------------------------------------------

  /**
   * Initial number of Reverb WebSocket server replicas.
   * Reverb handles real-time broadcasting and WebSocket connections.
   *
   * @type {number}
   * @default 1 (local), 2 (production)
   * @minimum 1
   */
  reverbReplicas: number;

  /**
   * Minimum number of Reverb replicas for HPA.
   * Reverb requires sticky sessions for WebSocket connections.
   *
   * @type {number}
   * @default 1 (local), 2 (production)
   * @minimum 1
   */
  reverbMinReplicas: number;

  /**
   * Maximum number of Reverb replicas for HPA.
   * Scales based on active WebSocket connections.
   *
   * @type {number}
   * @default 5 (local), 10 (production)
   * @minimum reverbMinReplicas
   */
  reverbMaxReplicas: number;

  // -------------------------------------------------------------------------
  // Web Server Resource Limits
  // -------------------------------------------------------------------------

  /**
   * Maximum memory allocation for web server pods.
   * Pod will be OOMKilled if it exceeds this limit.
   *
   * @type {string}
   * @format Kubernetes memory format (e.g., "512Mi", "2Gi")
   * @default "512Mi" (local), "2Gi" (production)
   * @example "1Gi", "2048Mi"
   */
  webMemoryLimit: string;

  /**
   * Guaranteed memory allocation for web server pods.
   * Kubernetes scheduler ensures this amount is available.
   *
   * @type {string}
   * @format Kubernetes memory format
   * @default "256Mi" (local), "1Gi" (production)
   * @recommendation Set to 50-75% of limit
   */
  webMemoryRequest: string;

  /**
   * Maximum CPU allocation for web server pods.
   * Pod will be throttled if it exceeds this limit.
   *
   * @type {string}
   * @format Kubernetes CPU format (e.g., "0.5", "1", "2")
   * @default "1" (local), "2" (production)
   * @example "0.5" = 500 millicores, "2" = 2 cores
   */
  webCpuLimit: string;

  /**
   * Guaranteed CPU allocation for web server pods.
   * Kubernetes scheduler ensures this amount is available.
   *
   * @type {string}
   * @format Kubernetes CPU format
   * @default "0.5" (local), "1" (production)
   * @recommendation Set to 50-75% of limit
   */
  webCpuRequest: string;

  // -------------------------------------------------------------------------
  // Queue Worker Resource Limits
  // -------------------------------------------------------------------------

  /**
   * Maximum memory allocation for worker pods.
   * Workers typically need less memory than web servers.
   *
   * @type {string}
   * @format Kubernetes memory format
   * @default "256Mi" (local), "1Gi" (production)
   */
  workerMemoryLimit: string;

  /**
   * Guaranteed memory allocation for worker pods.
   *
   * @type {string}
   * @format Kubernetes memory format
   * @default "128Mi" (local), "512Mi" (production)
   */
  workerMemoryRequest: string;

  /**
   * Maximum CPU allocation for worker pods.
   * Workers process jobs asynchronously and can use less CPU.
   *
   * @type {string}
   * @format Kubernetes CPU format
   * @default "0.5" (local), "1" (production)
   */
  workerCpuLimit: string;

  /**
   * Guaranteed CPU allocation for worker pods.
   *
   * @type {string}
   * @format Kubernetes CPU format
   * @default "0.25" (local), "0.5" (production)
   */
  workerCpuRequest: string;
}
