/**
 * ==============================================================================
 * PHP Runtime Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for PHP runtime deployment with support
 * for multiple PHP runtimes (Octane, FPM, CLI).
 *
 * @interface PHPRuntimeConfig
 * @module interfaces
 * ==============================================================================
 */

import { PHPRuntime, PHPVersion, OctaneServer, FPMProcessManager } from '@/types';

/**
 * PHP runtime configuration interface.
 *
 * This interface defines all configuration options for PHP runtime deployment,
 * supporting multiple PHP runtimes with their specific features.
 *
 * @example
 * ```typescript
 * // Laravel Octane with FrankenPHP
 * const octaneConfig: PHPRuntimeConfig = {
 *   runtime: "octane",
 *   version: "8.3",
 *   octaneServer: "frankenphp",
 *   opcacheEnabled: true,
 *   opcacheMemory: 256
 * };
 *
 * // PHP-FPM configuration
 * const fpmConfig: PHPRuntimeConfig = {
 *   runtime: "fpm",
 *   version: "8.3",
 *   fpmProcessManager: "dynamic",
 *   fpmWorkers: 10,
 *   opcacheEnabled: true
 * };
 * ```
 */
export interface PHPRuntimeConfig {
  /**
   * PHP runtime type.
   *
   * Determines which PHP runtime to use:
   * - "octane": Laravel Octane for high-performance PHP
   * - "fpm": PHP-FPM (FastCGI Process Manager)
   * - "cli": PHP CLI for command-line scripts
   *
   * @type {PHPRuntime}
   * @default "octane"
   * @example "octane", "fpm", "cli"
   *
   * @comparison
   * Octane:
   * - High performance (10x faster than FPM)
   * - Application stays in memory
   * - Async/concurrent requests
   * - WebSocket support
   * - Best for: APIs, real-time apps
   *
   * FPM:
   * - Traditional PHP runtime
   * - Process per request
   * - Stable and mature
   * - Wide compatibility
   * - Best for: Traditional Laravel apps
   *
   * CLI:
   * - Command-line scripts
   * - Queue workers
   * - Scheduled tasks
   * - Best for: Background jobs
   *
   * @recommendation
   * - New projects: "octane" (best performance)
   * - Legacy projects: "fpm" (compatibility)
   * - Workers: "cli" (background jobs)
   */
  runtime: PHPRuntime;

  /**
   * PHP version.
   *
   * Specifies the PHP version to use.
   * Must be compatible with Laravel version.
   *
   * @type {PHPVersion}
   * @required true
   * @example "8.1", "8.2", "8.3", "8.4"
   *
   * @laravel_compatibility
   * - Laravel 10: PHP 8.1+
   * - Laravel 11: PHP 8.2+
   * - Laravel 12: PHP 8.3+
   *
   * @recommendation
   * - Use latest stable PHP version
   * - PHP 8.3: Latest stable with performance improvements
   * - PHP 8.4: Latest with new features (check compatibility)
   * - Avoid PHP 8.1: End of security support soon
   */
  version: PHPVersion;

  /**
   * Octane server.
   *
   * Only applicable when runtime is "octane".
   * Determines which Octane server to use.
   *
   * @type {OctaneServer | undefined}
   * @optional Only for runtime="octane"
   * @default "frankenphp"
   * @example "frankenphp", "swoole", "roadrunner"
   *
   * @comparison
   * FrankenPHP:
   * - Modern and fast
   * - Built on Go
   * - HTTP/2, HTTP/3 support
   * - Early hints support
   * - Best for: Modern apps, APIs
   *
   * Swoole:
   * - Mature and stable
   * - Coroutines support
   * - WebSocket support
   * - Large ecosystem
   * - Best for: Production apps
   *
   * RoadRunner:
   * - Written in Go
   * - HTTP/2 support
   * - Job queue support
   * - Metrics built-in
   * - Best for: Microservices
   *
   * @recommendation
   * - FrankenPHP: Best for new projects (modern, fast)
   * - Swoole: Best for production (mature, stable)
   * - RoadRunner: Best for microservices
   */
  octaneServer?: OctaneServer;

  /**
   * FPM process manager.
   *
   * Only applicable when runtime is "fpm".
   * Determines how PHP-FPM manages worker processes.
   *
   * @type {FPMProcessManager | undefined}
   * @optional Only for runtime="fpm"
   * @default "dynamic"
   * @example "dynamic", "static", "ondemand"
   *
   * @process_managers
   * Dynamic:
   * - Spawns workers based on demand
   * - Min/max worker limits
   * - Balances performance and resources
   * - Best for: Most use cases
   *
   * Static:
   * - Fixed number of workers
   * - Always running
   * - Predictable resource usage
   * - Best for: High-traffic sites
   *
   * OnDemand:
   * - Spawns workers only when needed
   * - Kills idle workers
   * - Minimal resource usage
   * - Best for: Low-traffic sites
   *
   * @recommendation
   * - Dynamic: Best for most applications
   * - Static: Best for high-traffic production
   * - OnDemand: Best for development/low-traffic
   */
  fpmProcessManager?: FPMProcessManager;

  /**
   * Number of FPM workers.
   *
   * Only applicable when runtime is "fpm".
   * Determines the number of PHP-FPM worker processes.
   *
   * @type {number | undefined}
   * @optional Only for runtime="fpm"
   * @default 10 (dynamic), 20 (static)
   * @minimum 1
   *
   * @calculation
   * - Dynamic: max_children = (RAM - other) / (avg_process_size)
   * - Static: pm.max_children = number of workers
   * - OnDemand: pm.max_children = max workers
   *
   * @example
   * ```typescript
   * // For 2GB RAM, 50MB per process
   * fpmWorkers: 30  // (2000 - 500) / 50 = 30
   * ```
   *
   * @recommendation
   * - Calculate based on available memory
   * - Monitor actual memory usage
   * - Start conservative, increase if needed
   * - Typical: 10-50 workers per container
   */
  fpmWorkers?: number;

  /**
   * Enable OPcache.
   *
   * OPcache stores precompiled PHP bytecode in memory.
   * Significantly improves PHP performance.
   *
   * @type {boolean | undefined}
   * @optional true
   * @default true (production), false (development)
   *
   * @benefits
   * - 2-3x faster PHP execution
   * - Reduced CPU usage
   * - Lower memory per request
   * - Faster response times
   *
   * @trade_offs
   * - Pros: Much faster PHP execution
   * - Cons: Code changes require cache clear
   *
   * @example
   * ```typescript
   * opcacheEnabled: true  // Enable OPcache
   * ```
   *
   * @recommendation
   * - Always enable in production
   * - Disable in development (or use file watcher)
   * - Clear cache after deployments
   *
   * @note
   * - Requires opcache PHP extension
   * - Included in official PHP images
   * - Configure opcache.memory_consumption
   */
  opcacheEnabled?: boolean;

  /**
   * OPcache memory limit (MB).
   *
   * Only applicable when opcacheEnabled is true.
   * Determines how much memory OPcache can use.
   *
   * @type {number | undefined}
   * @optional Only when opcacheEnabled=true
   * @default 128 (local), 256 (production)
   * @unit Megabytes (MB)
   *
   * @calculation
   * - Small app: 64-128 MB
   * - Medium app: 128-256 MB
   * - Large app: 256-512 MB
   * - Depends on: Number of PHP files, file sizes
   *
   * @example
   * ```typescript
   * opcacheMemory: 256  // 256 MB for OPcache
   * ```
   *
   * @recommendation
   * - Start with 128 MB
   * - Monitor opcache_get_status()
   * - Increase if cache is full
   * - Typical: 128-256 MB
   *
   * @monitoring
   * - Check opcache hit rate (should be >95%)
   * - Monitor memory usage
   * - Watch for cache full warnings
   */
  opcacheMemory?: number;
}
