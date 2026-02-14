/**
 * ==============================================================================
 * MySQL Component
 * ==============================================================================
 * Creates MySQL database deployment in Kubernetes.
 * Supports both in-cluster StatefulSet and external managed services.
 *
 * @module components/mysql
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import { Config } from '@/config';
import { generateLabels, createSecret } from '@/utils';

/**
 * Creates MySQL database resources.
 *
 * @param config Pulumi configuration object
 * @param namespace Kubernetes namespace
 * @returns MySQL resources
 */
export function createMySQL(
  config: Config,
  namespace: string
): {
  service?: k8s.core.v1.Service;
  statefulSet?: k8s.apps.v1.StatefulSet;
  secret: k8s.core.v1.Secret;
} {
  const mysqlConfig = config.getMySQLConfig();
  const labels = generateLabels('mysql', 'database', config.getStack());

  // Create secret for MySQL credentials
  const secret = createSecret(
    'mysql-secret',
    namespace,
    {
      'mysql-root-password': mysqlConfig.password,
      'mysql-password': mysqlConfig.password,
      'mysql-database': mysqlConfig.database,
      'mysql-user': mysqlConfig.username,
    },
    labels
  );

  // If not enabled, return only secret (for external MySQL)
  if (!mysqlConfig.enabled) {
    return { secret };
  }

  // Create StatefulSet for MySQL
  const statefulSet = new k8s.apps.v1.StatefulSet('mysql', {
    metadata: {
      name: 'mysql',
      namespace,
      labels,
    },
    spec: {
      serviceName: 'mysql',
      replicas: mysqlConfig.replicas,
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
              name: 'mysql',
              image: `mysql:${mysqlConfig.version}`,
              ports: [
                {
                  name: 'mysql',
                  containerPort: 3306,
                },
              ],
              env: [
                {
                  name: 'MYSQL_ROOT_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: secret.metadata.name,
                      key: 'mysql-root-password',
                    },
                  },
                },
                {
                  name: 'MYSQL_DATABASE',
                  valueFrom: {
                    secretKeyRef: {
                      name: secret.metadata.name,
                      key: 'mysql-database',
                    },
                  },
                },
                {
                  name: 'MYSQL_USER',
                  valueFrom: {
                    secretKeyRef: {
                      name: secret.metadata.name,
                      key: 'mysql-user',
                    },
                  },
                },
                {
                  name: 'MYSQL_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: secret.metadata.name,
                      key: 'mysql-password',
                    },
                  },
                },
              ],
              volumeMounts: [
                {
                  name: 'mysql-data',
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
            name: 'mysql-data',
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: mysqlConfig.storageSize,
              },
            },
          },
        },
      ],
    },
  });

  // Create Service for MySQL
  const service = new k8s.core.v1.Service('mysql-service', {
    metadata: {
      name: 'mysql',
      namespace,
      labels,
    },
    spec: {
      type: 'ClusterIP',
      clusterIP: 'None', // Headless service for StatefulSet
      selector: labels,
      ports: [
        {
          name: 'mysql',
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
