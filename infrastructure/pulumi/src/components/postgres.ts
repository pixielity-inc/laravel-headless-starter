/**
 * ==============================================================================
 * PostgreSQL Component
 * ==============================================================================
 * Creates Kubernetes resources for PostgreSQL relational database.
 * Used as the primary database for Laravel application data.
 *
 * This component creates:
 * - StatefulSet: PostgreSQL server pods with persistent storage
 * - Service: Headless service for StatefulSet DNS
 * - Secret: Database credentials
 * - PVC: Persistent volume claim for data storage
 *
 * @module components/postgres
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import {
  createSecret,
  generateLabels,
  generateAnnotations,
  generateSelectorLabels,
  createResourceRequirements,
} from '@/utils';
import { Config } from '@/config';

/**
 * Return type for PostgreSQL resources.
 *
 * @interface PostgresResources
 */
interface PostgresResources {
  statefulSet?: k8s.apps.v1.StatefulSet;
  service?: k8s.core.v1.Service;
  secret?: k8s.core.v1.Secret;
}

/**
 * Creates PostgreSQL Kubernetes resources.
 *
 * Deploys PostgreSQL with:
 * - Persistent storage via StatefulSet
 * - Password authentication
 * - Health checks
 * - Resource limits
 * - Prometheus metrics via postgres-exporter sidecar
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {PostgresResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const postgres = createPostgres(config, "laravel-prod");
 * ```
 *
 * @note
 * For production, consider using managed PostgreSQL services:
 * - AWS RDS for PostgreSQL
 * - Google Cloud SQL for PostgreSQL
 * - Azure Database for PostgreSQL
 */
export function createPostgres(config: Config, namespace: string): PostgresResources {
  const postgresConfig = config.getPostgresConfig();
  const stack = config.getStack();

  // Skip if PostgreSQL is disabled (using external managed service)
  if (!postgresConfig.enabled) {
    return {};
  }

  // Generate labels
  const labels = generateLabels('postgres', 'database', stack);
  const selectorLabels = generateSelectorLabels('postgres', 'database');

  // Prometheus annotations
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '9187', // Postgres exporter port
    'prometheus.io/path': '/metrics',
  });

  // -------------------------------------------------------------------------
  // Secret: PostgreSQL Credentials
  // -------------------------------------------------------------------------

  const secret = createSecret(
    'postgres-credentials',
    namespace,
    {
      'postgres-password': postgresConfig.password,
      'postgres-user': postgresConfig.username,
      'postgres-db': postgresConfig.database,
    },
    labels
  );

  // -------------------------------------------------------------------------
  // StatefulSet: PostgreSQL Server
  // -------------------------------------------------------------------------

  const statefulSet = new k8s.apps.v1.StatefulSet('postgres', {
    metadata: {
      name: 'postgres',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      serviceName: 'postgres',
      replicas: postgresConfig.replicas,
      selector: {
        matchLabels: selectorLabels,
      },
      template: {
        metadata: {
          labels,
          annotations: prometheusAnnotations,
        },
        spec: {
          securityContext: {
            runAsNonRoot: true,
            runAsUser: 999, // Postgres user
            fsGroup: 999,
            seccompProfile: {
              type: 'RuntimeDefault',
            },
          },
          containers: [
            {
              name: 'postgres',
              image: 'postgres:16-alpine',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'postgres',
                  containerPort: 5432,
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'POSTGRES_DB',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'postgres-credentials',
                      key: 'postgres-db',
                    },
                  },
                },
                {
                  name: 'POSTGRES_USER',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'postgres-credentials',
                      key: 'postgres-user',
                    },
                  },
                },
                {
                  name: 'POSTGRES_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'postgres-credentials',
                      key: 'postgres-password',
                    },
                  },
                },
                {
                  name: 'PGDATA',
                  value: '/var/lib/postgresql/data/pgdata',
                },
              ],
              resources: createResourceRequirements('256Mi', '512Mi', '0.25', '1'),
              livenessProbe: {
                exec: {
                  command: ['sh', '-c', 'pg_isready -U $POSTGRES_USER -d $POSTGRES_DB'],
                },
                initialDelaySeconds: 30,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              readinessProbe: {
                exec: {
                  command: ['sh', '-c', 'pg_isready -U $POSTGRES_USER -d $POSTGRES_DB'],
                },
                initialDelaySeconds: 5,
                periodSeconds: 5,
                timeoutSeconds: 3,
                failureThreshold: 3,
              },
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: false,
                runAsNonRoot: true,
                runAsUser: 999,
                capabilities: {
                  drop: ['ALL'],
                },
              },
              volumeMounts: [
                {
                  name: 'data',
                  mountPath: '/var/lib/postgresql/data',
                },
              ],
            },
            // Postgres Exporter for Prometheus metrics
            {
              name: 'postgres-exporter',
              image: 'prometheuscommunity/postgres-exporter:latest',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'metrics',
                  containerPort: 9187,
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'DATA_SOURCE_USER',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'postgres-credentials',
                      key: 'postgres-user',
                    },
                  },
                },
                {
                  name: 'DATA_SOURCE_PASS',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'postgres-credentials',
                      key: 'postgres-password',
                    },
                  },
                },
                {
                  name: 'DATA_SOURCE_URI',
                  value: 'localhost:5432/postgres?sslmode=disable',
                },
              ],
              resources: createResourceRequirements('32Mi', '64Mi', '0.05', '0.1'),
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: true,
                runAsNonRoot: true,
                runAsUser: 65534,
                capabilities: {
                  drop: ['ALL'],
                },
              },
            },
          ],
          restartPolicy: 'Always',
          dnsPolicy: 'ClusterFirst',
          terminationGracePeriodSeconds: 30,
        },
      },
      volumeClaimTemplates: [
        {
          metadata: {
            name: 'data',
            labels,
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: postgresConfig.storageSize,
              },
            },
          },
        },
      ],
    },
  });

  // -------------------------------------------------------------------------
  // Service: Headless Service for StatefulSet
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('postgres-service', {
    metadata: {
      name: 'postgres',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      clusterIP: 'None', // Headless service for StatefulSet
      selector: selectorLabels,
      ports: [
        {
          name: 'postgres',
          port: 5432,
          targetPort: 5432,
          protocol: 'TCP',
        },
        {
          name: 'metrics',
          port: 9187,
          targetPort: 9187,
          protocol: 'TCP',
        },
      ],
      publishNotReadyAddresses: true,
    },
  });

  return {
    statefulSet,
    service,
    secret,
  };
}
