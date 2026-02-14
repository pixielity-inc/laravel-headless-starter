/**
 * ==============================================================================
 * RabbitMQ Component
 * ==============================================================================
 * Creates Kubernetes resources for RabbitMQ message broker.
 * Uses StatefulSet for data persistence and includes management UI.
 *
 * This component creates:
 * - StatefulSet: RabbitMQ broker pods with persistent storage
 * - Service: Headless service for StatefulSet + ClusterIP for client access
 * - Secret: RabbitMQ credentials
 * - PVC: Persistent volume claim for message data
 *
 * @module components/rabbitmq
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
 * Return type for RabbitMQ resources.
 *
 * @interface RabbitMQResources
 */
interface RabbitMQResources {
  statefulSet?: k8s.apps.v1.StatefulSet;
  service?: k8s.core.v1.Service;
  headlessService?: k8s.core.v1.Service;
  secret?: k8s.core.v1.Secret;
}

/**
 * Creates RabbitMQ Kubernetes resources.
 *
 * Deploys RabbitMQ with:
 * - Persistent storage via StatefulSet
 * - Management UI for monitoring and administration
 * - Health checks for reliability
 * - Resource limits
 * - Prometheus metrics via rabbitmq-exporter sidecar
 * - Security contexts (non-root)
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {RabbitMQResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const rabbitmq = createRabbitMQ(config, "laravel-prod");
 * ```
 *
 * @note
 * For production, consider using managed RabbitMQ services:
 * - AWS Amazon MQ for RabbitMQ
 * - CloudAMQP
 * - Azure Service Bus (AMQP compatible)
 */
export function createRabbitMQ(config: Config, namespace: string): RabbitMQResources {
  const rabbitmqConfig = config.getRabbitMQConfig();
  const stack = config.getStack();

  // Skip if RabbitMQ is disabled (using external managed service)
  if (!rabbitmqConfig.enabled) {
    return {};
  }

  // Generate labels
  const labels = generateLabels('rabbitmq', 'messaging', stack);
  const selectorLabels = generateSelectorLabels('rabbitmq', 'messaging');

  // Prometheus annotations
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '9419', // rabbitmq-exporter port
    'prometheus.io/path': '/metrics',
  });

  // -------------------------------------------------------------------------
  // Secret: RabbitMQ Credentials
  // -------------------------------------------------------------------------

  const secret = createSecret(
    'rabbitmq-credentials',
    namespace,
    {
      'rabbitmq-username': rabbitmqConfig.username,
      'rabbitmq-password': rabbitmqConfig.password,
    },
    labels
  );

  // -------------------------------------------------------------------------
  // StatefulSet: RabbitMQ Broker
  // -------------------------------------------------------------------------

  const statefulSet = new k8s.apps.v1.StatefulSet('rabbitmq', {
    metadata: {
      name: 'rabbitmq',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      serviceName: 'rabbitmq-headless',
      replicas: rabbitmqConfig.replicas,
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
            runAsUser: 999, // rabbitmq user
            fsGroup: 999,
            seccompProfile: {
              type: 'RuntimeDefault',
            },
          },
          containers: [
            {
              name: 'rabbitmq',
              image: 'rabbitmq:3-management-alpine',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'amqp',
                  containerPort: 5672,
                  protocol: 'TCP',
                },
                {
                  name: 'management',
                  containerPort: 15672,
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'RABBITMQ_DEFAULT_USER',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'rabbitmq-credentials',
                      key: 'rabbitmq-username',
                    },
                  },
                },
                {
                  name: 'RABBITMQ_DEFAULT_PASS',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'rabbitmq-credentials',
                      key: 'rabbitmq-password',
                    },
                  },
                },
                {
                  name: 'RABBITMQ_ERLANG_COOKIE',
                  value: 'rabbitmq-cluster-cookie',
                },
              ],
              resources: createResourceRequirements('512Mi', '1Gi', '0.5', '1'),
              livenessProbe: {
                exec: {
                  command: ['rabbitmq-diagnostics', 'ping'],
                },
                initialDelaySeconds: 60,
                periodSeconds: 30,
                timeoutSeconds: 10,
                failureThreshold: 3,
              },
              readinessProbe: {
                exec: {
                  command: ['rabbitmq-diagnostics', 'ping'],
                },
                initialDelaySeconds: 20,
                periodSeconds: 10,
                timeoutSeconds: 5,
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
                  mountPath: '/var/lib/rabbitmq',
                },
              ],
            },
            // RabbitMQ Exporter for Prometheus metrics
            {
              name: 'rabbitmq-exporter',
              image: 'kbudde/rabbitmq-exporter:latest',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'metrics',
                  containerPort: 9419,
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'RABBIT_URL',
                  value: 'http://localhost:15672',
                },
                {
                  name: 'RABBIT_USER',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'rabbitmq-credentials',
                      key: 'rabbitmq-username',
                    },
                  },
                },
                {
                  name: 'RABBIT_PASSWORD',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'rabbitmq-credentials',
                      key: 'rabbitmq-password',
                    },
                  },
                },
                {
                  name: 'PUBLISH_PORT',
                  value: '9419',
                },
              ],
              resources: createResourceRequirements('64Mi', '128Mi', '0.1', '0.25'),
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: true,
                runAsNonRoot: true,
                runAsUser: 1000,
                capabilities: {
                  drop: ['ALL'],
                },
              },
            },
          ],
          restartPolicy: 'Always',
          dnsPolicy: 'ClusterFirst',
          terminationGracePeriodSeconds: 60,
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
                storage: '10Gi',
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

  const headlessService = new k8s.core.v1.Service('rabbitmq-headless-service', {
    metadata: {
      name: 'rabbitmq-headless',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      clusterIP: 'None', // Headless service
      selector: selectorLabels,
      ports: [
        {
          name: 'amqp',
          port: 5672,
          targetPort: 5672,
          protocol: 'TCP',
        },
        {
          name: 'management',
          port: 15672,
          targetPort: 15672,
          protocol: 'TCP',
        },
        {
          name: 'metrics',
          port: 9419,
          targetPort: 9419,
          protocol: 'TCP',
        },
      ],
      publishNotReadyAddresses: true,
    },
  });

  // -------------------------------------------------------------------------
  // Service: ClusterIP for Client Access
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('rabbitmq-service', {
    metadata: {
      name: 'rabbitmq',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      selector: selectorLabels,
      ports: [
        {
          name: 'amqp',
          port: 5672,
          targetPort: 5672,
          protocol: 'TCP',
        },
        {
          name: 'management',
          port: 15672,
          targetPort: 15672,
          protocol: 'TCP',
        },
        {
          name: 'metrics',
          port: 9419,
          targetPort: 9419,
          protocol: 'TCP',
        },
      ],
      sessionAffinity: 'None',
    },
  });

  return {
    statefulSet,
    service,
    headlessService,
    secret,
  };
}
