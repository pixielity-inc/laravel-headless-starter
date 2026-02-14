/**
 * ==============================================================================
 * Beanstalkd Component
 * ==============================================================================
 * Creates Beanstalkd queue deployment in Kubernetes.
 *
 * @module components/beanstalkd
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import { Config } from '@/config';
import { generateLabels } from '@/utils';

/**
 * Creates Beanstalkd queue resources.
 *
 * @param config Pulumi configuration object
 * @param namespace Kubernetes namespace
 * @returns Beanstalkd resources
 */
export function createBeanstalkd(
  config: Config,
  namespace: string
): {
  service?: k8s.core.v1.Service;
  deployment?: k8s.apps.v1.Deployment;
} {
  const beanstalkdConfig = config.getBeanstalkdConfig();

  // If not enabled, return empty
  if (!beanstalkdConfig.enabled) {
    return {};
  }

  const labels = generateLabels('beanstalkd', 'queue', config.getStack());

  // Create Deployment for Beanstalkd
  const deployment = new k8s.apps.v1.Deployment('beanstalkd', {
    metadata: {
      name: 'beanstalkd',
      namespace,
      labels,
    },
    spec: {
      replicas: beanstalkdConfig.replicas,
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
              name: 'beanstalkd',
              image: `schickling/beanstalkd:${beanstalkdConfig.version}`,
              ports: [
                {
                  name: 'beanstalkd',
                  containerPort: 11300,
                },
              ],
              livenessProbe: {
                tcpSocket: {
                  port: 11300,
                },
                initialDelaySeconds: 10,
                periodSeconds: 10,
              },
              readinessProbe: {
                tcpSocket: {
                  port: 11300,
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

  // Create Service for Beanstalkd
  const service = new k8s.core.v1.Service('beanstalkd-service', {
    metadata: {
      name: 'beanstalkd',
      namespace,
      labels,
    },
    spec: {
      type: 'ClusterIP',
      selector: labels,
      ports: [
        {
          name: 'beanstalkd',
          port: 11300,
          targetPort: 11300,
        },
      ],
    },
  });

  return {
    service,
    deployment,
  };
}
