/**
 * ==============================================================================
 * Secret Management Utilities
 * ==============================================================================
 * Helper functions for creating and managing Kubernetes Secrets.
 * Provides secure secret handling with proper encoding and validation.
 *
 * @module utils/secrets
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

/**
 * Creates a Kubernetes Secret with base64 encoding.
 *
 * @param {string} name - Secret name
 * @param {string} namespace - Namespace to create in
 * @param {Record<string, pulumi.Output<string> | string>} data - Secret data
 * @param {Record<string, string>} labels - Labels to apply
 * @param {string} type - Secret type (default: Opaque)
 * @returns {k8s.core.v1.Secret} Created Secret resource
 *
 * @example
 * ```typescript
 * const secret = createSecret("db-credentials", "default", {
 *   "username": "admin",
 *   "password": pulumi.secret("secure-password")
 * }, labels);
 * ```
 */
export function createSecret(
  name: string,
  namespace: string,
  data: Record<string, pulumi.Output<string> | string>,
  labels: Record<string, string> = {},
  type: string = 'Opaque'
): k8s.core.v1.Secret {
  return new k8s.core.v1.Secret(name, {
    metadata: {
      name,
      namespace,
      labels,
    },
    type,
    stringData: data,
  });
}

/**
 * Creates a TLS Secret for Ingress.
 *
 * @param {string} name - Secret name
 * @param {string} namespace - Namespace to create in
 * @param {string} cert - TLS certificate (PEM format)
 * @param {string} key - TLS private key (PEM format)
 * @param {Record<string, string>} labels - Labels to apply
 * @returns {k8s.core.v1.Secret} Created TLS Secret resource
 *
 * @example
 * ```typescript
 * const tlsSecret = createTLSSecret("tls-cert", "default", certPem, keyPem, labels);
 * ```
 */
export function createTLSSecret(
  name: string,
  namespace: string,
  cert: string,
  key: string,
  labels: Record<string, string> = {}
): k8s.core.v1.Secret {
  return new k8s.core.v1.Secret(name, {
    metadata: {
      name,
      namespace,
      labels,
    },
    type: 'kubernetes.io/tls',
    stringData: {
      'tls.crt': cert,
      'tls.key': key,
    },
  });
}

/**
 * Creates a Docker registry Secret for pulling private images.
 *
 * @param {string} name - Secret name
 * @param {string} namespace - Namespace to create in
 * @param {string} server - Docker registry server
 * @param {string} username - Registry username
 * @param {string} password - Registry password
 * @param {string} email - Registry email
 * @param {Record<string, string>} labels - Labels to apply
 * @returns {k8s.core.v1.Secret} Created Docker registry Secret resource
 *
 * @example
 * ```typescript
 * const registrySecret = createDockerRegistrySecret(
 *   "registry-creds",
 *   "default",
 *   "ghcr.io",
 *   "username",
 *   "token",
 *   "user@example.com",
 *   labels
 * );
 * ```
 */
export function createDockerRegistrySecret(
  name: string,
  namespace: string,
  server: string,
  username: string,
  password: string,
  email: string,
  labels: Record<string, string> = {}
): k8s.core.v1.Secret {
  const dockerConfig = pulumi.interpolate`{
        "auths": {
            "${server}": {
                "username": "${username}",
                "password": "${password}",
                "email": "${email}",
                "auth": "${Buffer.from(`${username}:${password}`).toString('base64')}"
            }
        }
    }`;

  return new k8s.core.v1.Secret(name, {
    metadata: {
      name,
      namespace,
      labels,
    },
    type: 'kubernetes.io/dockerconfigjson',
    stringData: {
      '.dockerconfigjson': dockerConfig,
    },
  });
}

/**
 * Creates environment variables from a Secret.
 *
 * @param {string} secretName - Name of the Secret
 * @param {string[]} keys - Keys to extract from Secret
 * @returns {Array} Array of environment variable configurations
 *
 * @example
 * ```typescript
 * const envVars = createEnvFromSecret("db-credentials", ["username", "password"]);
 * // Use in pod spec:
 * // env: [...envVars, ...otherEnvVars]
 * ```
 */
export function createEnvFromSecret(
  secretName: string,
  keys: string[]
): Array<{
  name: string;
  valueFrom: {
    secretKeyRef: {
      name: string;
      key: string;
    };
  };
}> {
  return keys.map((key) => ({
    name: key.toUpperCase().replace(/-/g, '_'),
    valueFrom: {
      secretKeyRef: {
        name: secretName,
        key,
      },
    },
  }));
}

/**
 * Creates environment variables from a ConfigMap.
 *
 * @param {string} configMapName - Name of the ConfigMap
 * @param {string[]} keys - Keys to extract from ConfigMap
 * @returns {Array} Array of environment variable configurations
 *
 * @example
 * ```typescript
 * const envVars = createEnvFromConfigMap("app-config", ["APP_ENV", "LOG_LEVEL"]);
 * ```
 */
export function createEnvFromConfigMap(
  configMapName: string,
  keys: string[]
): Array<{
  name: string;
  valueFrom: {
    configMapKeyRef: {
      name: string;
      key: string;
    };
  };
}> {
  return keys.map((key) => ({
    name: key,
    valueFrom: {
      configMapKeyRef: {
        name: configMapName,
        key,
      },
    },
  }));
}

/**
 * Generates a random password for use in Secrets.
 *
 * @param {number} length - Password length
 * @returns {string} Random password
 *
 * @example
 * ```typescript
 * const password = generatePassword(32);
 * ```
 *
 * @note This is a simple implementation. For production, consider using
 *       a proper secret management service like AWS Secrets Manager.
 */
export function generatePassword(length: number = 32): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
