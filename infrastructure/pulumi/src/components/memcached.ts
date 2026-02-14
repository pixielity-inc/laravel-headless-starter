/**
 * ==============================================================================
 * Memcached Component
 * ==============================================================================
 * Creates Memcached cache deployment in Kubernetes.
 *
 * @module components/memcached
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import { Config } from '@/config';
import { generateLabels } from '@/utils';

/**
 * Creates Memcached cache resources.
 *
 * @param config Pulumi configuration object
 * @param namespace Kubernetes namespace
 * @returns Memcached resources
 */
export function createMemcached(
  config: Config,
  namespace: string
): {
  service?: k8s.core.v1.Service;
  deployment?: k8s.apps.v1.Deployment;
} {
  const memcachedConfig = config.getMemcachedConfig();

  // If not enabled, return empty
  if (!memcachedConfig.enabled) {
    return {};
  }

  const labels = generateLabels('memcached', 'cache', config.getStack());

  // Create Deployment for Memcached
  const deployment = new k8s.apps.v1.Deployment('memcached', {
    metadata: {
      name: 'memcached',
      namespace,
      labels,
    },
    spec: {
      replicas: memcachedConfig.replicas,
      selector: {
        matchLabels: labels,
      },
      template: {
        metadata: {
          labels,
        },
        spec: {
          containers: [
            {
              name: 'memcached',
              image: `memcached:${memcachedConfig.version}`,
              ports: [
                {
                  name: 'memcached',
                  containerPort: 11211,
                },
              ],
              args: [
                '-m',
                '64', // 64MB memory limit
                '-c',
                '1024', // Max 1024 connections
                '-t',
                '4', // 4 threads
              ],
              livenessProbe: {
                tcpSocket: {
                  port: 11211,
                },
                initialDelaySeconds: 10,
                periodSeconds: 10,
              },
              readinessProbe: {
                tcpSocket: {
                  port: 11211,
                },
                initialDelaySeconds: 5,
                periodSeconds: 5,
              },
              resources: {
                requests: {
                  memory: '64Mi',
                  cpu: '100m',
                },
                limits: {
                  memory: '128Mi',
                  cpu: '250m',
                },
              },
            },
          ],
        },
      },
    },
  });

  // Create Service for Memcached
  const service = new k8s.core.v1.Service('memcached-service', {
    metadata: {
      name: 'memcached',
      namespace,
      labels,
    },
    spec: {
      type: 'ClusterIP',
      selector: labels,
      ports: [
        {
          name: 'memcached',
          port: 11211,
          targetPort: 11211,
        },
      ],
    },
  });

  return {
    service,
    deployment,
  };
}
