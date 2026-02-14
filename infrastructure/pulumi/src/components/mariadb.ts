/**
 * ==============================================================================
 * MariaDB Component
 * ==============================================================================
 * Creates MariaDB database deployment in Kubernetes.
 * Supports both in-cluster StatefulSet and external managed services.
 *
 * @module components/mariadb
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import { Config } from '@/config';
import { generateLabels, createSecret } from '@/utils';

/**
 * Creates MariaDB database resources.
 *
 * @param config Pulumi configuration object
 * @param namespace Kubernetes namespace
 * @returns MariaDB resources
 */
export function createMariaDB(
  config: Config,
  namespace: string
): {
  service?: k8s.core.v1.Service;
  statefulSet?: k8s.apps.v1.StatefulSet;
  secret: k8s.core.v1.Secret;
} {
  const mariadbConfig = config.getMariaDBConfig();
  const labels = generateLabels('mariadb', 'database', config.getStack());

  // Create secret for MariaDB credentials
  const secret = createSecret(
    'mariadb-secret',
    namespace,
    {
      'mariadb-root-password': mariadbConfig.password,
      'mariadb-password': mariadbConfig.password,
      'mariadb-database': mariadbConfig.database,
      'mariadb-user': mariadbConfig.username,
    },
    labels
  );

  // If not enabled, return only secret (for external MariaDB)
  if (!mariadbConfig.enabled) {
    return { secret };
  }

  // Create StatefulSet for MariaDB
  const statefulSet = new k8s.apps.v1.StatefulSet('mariadb', {
    metadata: {
      name: 'mariadb',
      namespace,
      labels,
    },
    spec: {
      serviceName: 'mariadb',
      replicas: mariadbConfig.replicas,
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
              name: 'mariadb',
              image: `mariadb:${mariadbConfig.version}`,
              ports: [
                {
                  name: 'mariadb',
                  containerPort: 3306,
                },
              ],
              env: [
                {
                  name: 'MARIADB_ROOT_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: secret.metadata.name,
                      key: 'mariadb-root-password',
                    },
                  },
                },
                {
                  name: 'MARIADB_DATABASE',
                  valueFrom: {
                    secretKeyRef: {
                      name: secret.metadata.name,
                      key: 'mariadb-database',
                    },
                  },
                },
                {
                  name: 'MARIADB_USER',
                  valueFrom: {
                    secretKeyRef: {
                      name: secret.metadata.name,
                      key: 'mariadb-user',
                    },
                  },
                },
                {
                  name: 'MARIADB_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: secret.metadata.name,
                      key: 'mariadb-password',
                    },
                  },
                },
              ],
              volumeMounts: [
                {
                  name: 'mariadb-data',
                  mountPath: '/var/lib/mysql',
                },
              ],
              livenessProbe: {
                exec: {
                  command: ['mysqladmin', 'ping', '-h', 'localhost'],
                },
                initialDelaySeconds: 30,
                periodSeconds: 10,
                timeoutSeconds: 5,
              },
              readinessProbe: {
                exec: {
                  command: ['mysqladmin', 'ping', '-h', 'localhost'],
                },
                initialDelaySeconds: 5,
                periodSeconds: 5,
                timeoutSeconds: 1,
              },
              resources: {
                requests: {
                  memory: '256Mi',
                  cpu: '250m',
                },
                limits: {
                  memory: '1Gi',
                  cpu: '1000m',
                },
              },
            },
          ],
        },
      },
      volumeClaimTemplates: [
        {
          metadata: {
            name: 'mariadb-data',
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: mariadbConfig.storageSize,
              },
            },
          },
        },
      ],
    },
  });

  // Create Service for MariaDB
  const service = new k8s.core.v1.Service('mariadb-service', {
    metadata: {
      name: 'mariadb',
      namespace,
      labels,
    },
    spec: {
      type: 'ClusterIP',
      clusterIP: 'None', // Headless service for StatefulSet
      selector: labels,
      ports: [
        {
          name: 'mariadb',
          port: 3306,
          targetPort: 3306,
        },
      ],
    },
  });

  return {
    service,
    statefulSet,
    secret,
  };
}
