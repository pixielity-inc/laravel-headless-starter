/**
 * ==============================================================================
 * Storage Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for object storage (MinIO or S3).
 * Used for file uploads, media storage, and asset management.
 *
 * @interface StorageConfig
 * @module interfaces
 * ==============================================================================
 */

import * as pulumi from '@pulumi/pulumi';

/**
 * Object storage configuration interface.
 *
 * Supports both MinIO (S3-compatible, self-hosted) and cloud S3 services.
 * Provides unified interface for local development and production deployment.
 *
 * @example
 * ```typescript
 * // MinIO (local development)
 * const minioStorage: StorageConfig = {
 *   type: "minio",
 *   endpoint: "http://minio:9000",
 *   bucket: "laravel",
 *   accessKey: "minioadmin",
 *   secretKey: pulumi.secret("minioadmin"),
 *   replicas: 1,
 *   storageSize: "20Gi"
 * };
 *
 * // AWS S3 (production)
 * const s3Storage: StorageConfig = {
 *   type: "s3",
 *   bucket: "laravel-production-assets",
 *   region: "us-east-1",
 *   accessKey: pulumi.secret("AKIAIOSFODNN7EXAMPLE"),
 *   secretKey: pulumi.secret("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")
 * };
 * ```
 */
export interface StorageConfig {
  /**
   * Storage type selection.
   *
   * Determines which object storage backend to use:
   * - "minio": Self-hosted S3-compatible storage (local/dev)
   * - "s3": Cloud object storage (AWS S3, GCS, Azure Blob)
   *
   * @type {"minio" | "s3"}
   * @default "minio" (local), "s3" (production)
   * @recommendation
   * - Local/Dev: Use "minio" for easy setup and testing
   * - Production: Use "s3" with managed cloud storage
   *
   * @note
   * - Both types use S3-compatible API
   * - Laravel S3 driver works with both
   * - No code changes needed when switching types
   */
  type: 'minio' | 's3';

  /**
   * MinIO server endpoint URL.
   *
   * Only required when type is "minio".
   * Full URL including protocol and port.
   *
   * @type {string | undefined}
   * @optional Only for type="minio"
   * @default "http://minio:9000" (in-cluster)
   * @example
   * - In-cluster: "http://minio:9000"
   * - External: "https://minio.example.com:9000"
   * - With custom domain: "https://storage.example.com"
   *
   * @note
   * - Use http:// for local development
   * - Use https:// for production deployments
   * - Include port if not using standard ports (80/443)
   */
  endpoint?: string;

  /**
   * S3 bucket name for storing files.
   *
   * Bucket must exist before deployment or be created automatically.
   * Used for all file uploads, media, and assets.
   *
   * @type {string}
   * @required true
   * @example "laravel", "laravel-production-assets", "app-uploads"
   * @naming
   * - Use lowercase letters, numbers, and hyphens only
   * - Must be globally unique (for AWS S3)
   * - 3-63 characters long
   * - Cannot start or end with hyphen
   *
   * @recommendation
   * - Include environment in name: "laravel-prod", "laravel-staging"
   * - Use descriptive names: "app-user-uploads", "app-public-assets"
   * - Consider bucket versioning for production
   */
  bucket: string;

  /**
   * AWS region for S3 bucket.
   *
   * Only required when type is "s3".
   * Determines where the bucket is physically located.
   *
   * @type {string | undefined}
   * @optional Only for type="s3"
   * @default "us-east-1"
   * @example
   * - AWS: "us-east-1", "eu-west-1", "ap-southeast-1"
   * - GCS: "us-central1", "europe-west1"
   * - Azure: "eastus", "westeurope"
   *
   * @recommendation
   * - Choose region closest to your users
   * - Consider data residency requirements
   * - Match region with your compute resources
   * - Check pricing differences between regions
   */
  region?: string;

  /**
   * S3/MinIO access key ID for authentication.
   *
   * Used for API authentication to object storage.
   * Can be plaintext (local) or encrypted secret (production).
   *
   * @type {string | pulumi.Output<string>}
   * @required true
   * @default "minioadmin" (MinIO local)
   * @example
   * - MinIO: "minioadmin"
   * - AWS: "AKIAIOSFODNN7EXAMPLE"
   * - GCS: Service account email
   *
   * @security
   * - Use encrypted secrets in production
   * - Rotate keys regularly (every 90 days)
   * - Use IAM roles when possible (AWS)
   * - Grant minimum required permissions
   */
  accessKey: string | pulumi.Output<string>;

  /**
   * S3/MinIO secret access key for authentication.
   *
   * Used for API authentication to object storage.
   * Always stored as encrypted secret.
   *
   * @type {pulumi.Output<string>}
   * @required true
   * @security
   * - Always stored as encrypted secret in Pulumi state
   * - Never commit plaintext secrets to version control
   * - Use strong secrets (40+ characters for AWS)
   * - Rotate secrets regularly (every 90 days)
   * - Consider using AWS Secrets Manager or similar
   * - Grant minimum required S3 permissions
   */
  secretKey: pulumi.Output<string>;

  /**
   * Number of MinIO server replicas.
   *
   * Only applicable when type is "minio".
   * For distributed MinIO deployment with erasure coding.
   *
   * @type {number | undefined}
   * @optional Only for type="minio"
   * @default 1 (local), 4 (production)
   * @minimum 1 (standalone), 4 (distributed)
   * @recommendation
   * - Local/Dev: 1 replica (standalone mode)
   * - Production: 4+ replicas (distributed mode with erasure coding)
   * - Use multiples of 4 for optimal erasure coding
   *
   * @note
   * - Distributed mode requires 4+ servers
   * - Erasure coding provides data redundancy
   * - More replicas = better fault tolerance
   * - Each replica needs dedicated storage
   */
  replicas?: number;

  /**
   * Persistent storage size per MinIO instance.
   *
   * Only applicable when type is "minio".
   * Each MinIO replica gets its own PersistentVolumeClaim.
   *
   * @type {string | undefined}
   * @optional Only for type="minio"
   * @format Kubernetes storage format (e.g., "10Gi", "100Gi", "1Ti")
   * @default "20Gi" (local), "100Gi" (production)
   * @recommendation
   * - Calculate based on: (expected files × average size × 2)
   * - Add 50% buffer for growth
   * - Monitor usage and expand before reaching 80%
   * - Consider lifecycle policies for old files
   *
   * @example
   * - Small app: "20Gi" (few uploads)
   * - Medium app: "100Gi" (moderate uploads)
   * - Large app: "500Gi" (heavy uploads)
   * - Enterprise: "2Ti" (massive storage needs)
   *
   * @note
   * - Cannot be decreased after creation
   * - Can be expanded dynamically
   * - Consider using cloud storage for large datasets
   */
  storageSize?: string;
}
