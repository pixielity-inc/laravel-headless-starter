/**
 * ==============================================================================
 * Search Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for search engines.
 * Supports both Meilisearch (fast, typo-tolerant) and Elasticsearch (advanced).
 *
 * @interface SearchConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';
import { SearchEngine } from '@/types';

/**
 * Search engine configuration interface.
 *
 * Supports two search engines:
 * - Meilisearch: Fast, typo-tolerant, easy to use (recommended for most apps)
 * - Elasticsearch: Advanced search, analytics, large-scale (enterprise)
 *
 * @example
 * ```typescript
 * // Meilisearch configuration
 * const meilisearchConfig: SearchConfig = {
 *   type: "meilisearch",
 *   host: "http://meilisearch:7700",
 *   masterKey: pulumi.secret("masterKey"),
 *   replicas: 1
 * };
 *
 * // Elasticsearch configuration
 * const elasticsearchConfig: SearchConfig = {
 *   type: "elasticsearch",
 *   host: "https://elasticsearch.example.com",
 *   username: "elastic",
 *   password: pulumi.secret("elastic-password"),
 *   replicas: 3
 * };
 * ```
 */
export interface SearchConfig {
  /**
   * Search engine type selection.
   *
   * Determines which search engine to deploy:
   * - "meilisearch": Fast, typo-tolerant, easy to use (recommended for most apps)
   * - "elasticsearch": Advanced search, analytics, large-scale (enterprise)
   *
   * @type {SearchEngine}
   * @default "meilisearch"
   * @recommendation
   * - Small to medium apps: Use "meilisearch" for simplicity and speed
   * - Large apps with complex queries: Use "elasticsearch"
   * - Analytics and aggregations: Use "elasticsearch"
   * - Simple full-text search: Use "meilisearch"
   *
   * @comparison
   * Meilisearch:
   * - Faster setup and configuration
   * - Better out-of-the-box relevance
   * - Lower resource requirements
   * - Instant search optimized
   *
   * Elasticsearch:
   * - More powerful query DSL
   * - Better for large datasets (100M+ documents)
   * - Advanced analytics and aggregations
   * - Mature ecosystem and plugins
   */
  type: SearchEngine;

  /**
   * Search engine endpoint URL.
   *
   * Full URL including protocol and port for accessing the search engine.
   *
   * @type {string}
   * @required true
   * @example
   * - Meilisearch in-cluster: "http://meilisearch:7700"
   * - Meilisearch external: "https://meilisearch.example.com"
   * - Elasticsearch in-cluster: "http://elasticsearch:9200"
   * - Elasticsearch external: "https://elasticsearch.example.com"
   * - Elastic Cloud: "https://my-deployment.es.us-east-1.aws.found.io:9243"
   *
   * @note
   * - Use http:// for local development
   * - Use https:// for production deployments
   * - Include port if not using standard ports (80/443)
   */
  host: string;

  /**
   * Meilisearch master key for authentication.
   *
   * Only required when type is "meilisearch".
   * Used for all API requests to Meilisearch.
   *
   * @type {pulumi.Output<string> | undefined}
   * @optional Only for type="meilisearch"
   * @security
   * - Stored as encrypted secret in Pulumi state
   * - Required for production deployments
   * - Use strong keys (32+ characters)
   * - Rotate keys regularly
   * - Never commit plaintext keys to version control
   *
   * @example
   * ```typescript
   * // Set via Pulumi CLI
   * pulumi config set --secret meilisearch:masterKey "MySecureMeilisearchKey123"
   *
   * // Or in code
   * masterKey: pulumi.secret("MySecureMeilisearchKey123")
   * ```
   */
  masterKey?: pulumi.Output<string>;

  /**
   * Elasticsearch username for authentication.
   *
   * Only required when type is "elasticsearch".
   * Used for HTTP basic authentication.
   *
   * @type {string | undefined}
   * @optional Only for type="elasticsearch"
   * @default "elastic" (built-in superuser)
   * @example "elastic", "kibana_system", "app_search_user"
   * @security
   * - Create dedicated users for applications
   * - Grant minimum required permissions
   * - Avoid using "elastic" superuser in production
   * - Use role-based access control (RBAC)
   */
  username?: string;

  /**
   * Elasticsearch password for authentication.
   *
   * Only required when type is "elasticsearch".
   * Used for HTTP basic authentication.
   *
   * @type {pulumi.Output<string> | undefined}
   * @optional Only for type="elasticsearch"
   * @security
   * - Stored as encrypted secret in Pulumi state
   * - Use strong passwords (16+ characters)
   * - Rotate passwords regularly (every 90 days)
   * - Never commit plaintext passwords to version control
   * - Consider using Elasticsearch API keys instead
   *
   * @example
   * ```typescript
   * // Set via Pulumi CLI
   * pulumi config set --secret elasticsearch:password "MySecureElasticP@ssw0rd123"
   *
   * // Or in code
   * password: pulumi.secret("MySecureElasticP@ssw0rd123")
   * ```
   */
  password?: pulumi.Output<string>;

  /**
   * Number of search engine replicas.
   *
   * For in-cluster deployment:
   * - 1 replica: Single instance (local/dev)
   * - 3+ replicas: High availability with data replication (production)
   *
   * For managed services:
   * - This value is informational only
   * - Actual replication is managed by the cloud provider
   *
   * @type {number}
   * @default 1 (local), 3 (production)
   * @minimum 1
   * @recommendation
   * - Local/Dev: 1 replica (saves resources)
   * - Production in-cluster: 3 replicas (HA and fault tolerance)
   * - Production managed: 3+ replicas (configured in provider)
   *
   * @note
   * - More replicas = better search performance (load distribution)
   * - Elasticsearch: Replicas are for shards, not nodes
   * - Meilisearch: Replicas provide read scaling
   * - Consider index size when planning replicas
   */
  replicas: number;
}
