/**
 * ==============================================================================
 * Kafka Component (KRaft Mode)
 * ==============================================================================
 * Creates Kubernetes resources for Apache Kafka event streaming platform.
 * Uses KRaft mode (Kafka Raft) instead of Zookeeper for metadata management.
 *
 * This component creates:
 * - StatefulSet: Kafka broker pods with persistent storage
 * - Service: Headless service for StatefulSet + ClusterIP for client access
 * - Secret: Kafka credentials (if SASL is enabled)
 * - PVC: Persistent volume claim for Kafka logs
 *
 * @module components/kafka
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
 * Return type for Kafka resources.
 *
 * @interface KafkaResources
 */
interface KafkaResources {
  statefulSet?: k8s.apps.v1.StatefulSet;
  service?: k8s.core.v1.Service;
  headlessService?: k8s.core.v1.Service;
  secret?: k8s.core.v1.Secret;
}

/**
 * Creates Kafka Kubernetes resources with KRaft mode.
 *
 * Deploys Kafka with:
 * - KRaft mode (no Zookeeper required)
 * - Persistent storage via StatefulSet
 * - SASL authentication (optional)
 * - Health checks
 * - Resource limits
 * - Prometheus metrics via JMX exporter
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {KafkaResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const kafka = createKafka(config, "laravel-prod");
 * ```
 *
 * @note
 * For production, consider using managed Kafka services:
 * - AWS MSK (Managed Streaming for Apache Kafka)
 * - Confluent Cloud
 * - Azure Event Hubs for Kafka
 * - Google Cloud Pub/Sub (Kafka-compatible)
 */
export function createKafka(config: Config, namespace: string): KafkaResources {
  const kafkaConfig = config.getKafkaConfig();
  const stack = config.getStack();

  // Skip if Kafka is disabled (using external managed service)
  if (!kafkaConfig.enabled) {
    return {};
  }

  // Generate labels
  const labels = generateLabels('kafka', 'messaging', stack);
  const selectorLabels = generateSelectorLabels('kafka', 'messaging');

  // Prometheus annotations
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '9308', // JMX exporter port
    'prometheus.io/path': '/metrics',
  });

  // -------------------------------------------------------------------------
  // Secret: Kafka Credentials (if SASL is enabled)
  // -------------------------------------------------------------------------

  let secret: k8s.core.v1.Secret | undefined;

  if (kafkaConfig.saslMechanism && kafkaConfig.username && kafkaConfig.password) {
    secret = createSecret(
      'kafka-credentials',
      namespace,
      {
        'kafka-username': kafkaConfig.username,
        'kafka-password': kafkaConfig.password,
      },
      labels
    );
  }

  // -------------------------------------------------------------------------
  // StatefulSet: Kafka Broker (KRaft Mode)
  // -------------------------------------------------------------------------

  const statefulSet = new k8s.apps.v1.StatefulSet('kafka', {
    metadata: {
      name: 'kafka',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      serviceName: 'kafka-headless',
      replicas: kafkaConfig.replicas,
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
            runAsUser: 1000,
            fsGroup: 1000,
            seccompProfile: {
              type: 'RuntimeDefault',
            },
          },
          containers: [
            {
              name: 'kafka',
              image: 'apache/kafka:latest',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'kafka',
                  containerPort: 9092,
                  protocol: 'TCP',
                },
                {
                  name: 'controller',
                  containerPort: 9093,
                  protocol: 'TCP',
                },
              ],
              env: [
                // KRaft mode configuration
                {
                  name: 'KAFKA_NODE_ID',
                  valueFrom: {
                    fieldRef: {
                      fieldPath: 'metadata.name',
                    },
                  },
                },
                {
                  name: 'KAFKA_PROCESS_ROLES',
                  value: 'broker,controller',
                },
                {
                  name: 'KAFKA_CONTROLLER_QUORUM_VOTERS',
                  value: '1@kafka-0.kafka-headless:9093',
                },
                {
                  name: 'KAFKA_LISTENERS',
                  value: 'PLAINTEXT://:9092,CONTROLLER://:9093',
                },
                {
                  name: 'KAFKA_ADVERTISED_LISTENERS',
                  value: 'PLAINTEXT://kafka:9092',
                },
                {
                  name: 'KAFKA_LISTENER_SECURITY_PROTOCOL_MAP',
                  value: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT',
                },
                {
                  name: 'KAFKA_CONTROLLER_LISTENER_NAMES',
                  value: 'CONTROLLER',
                },
                {
                  name: 'KAFKA_INTER_BROKER_LISTENER_NAME',
                  value: 'PLAINTEXT',
                },
                // Storage configuration
                {
                  name: 'KAFKA_LOG_DIRS',
                  value: '/var/lib/kafka/data',
                },
                // Performance tuning
                {
                  name: 'KAFKA_NUM_NETWORK_THREADS',
                  value: '3',
                },
                {
                  name: 'KAFKA_NUM_IO_THREADS',
                  value: '8',
                },
                {
                  name: 'KAFKA_SOCKET_SEND_BUFFER_BYTES',
                  value: '102400',
                },
                {
                  name: 'KAFKA_SOCKET_RECEIVE_BUFFER_BYTES',
                  value: '102400',
                },
                {
                  name: 'KAFKA_SOCKET_REQUEST_MAX_BYTES',
                  value: '104857600',
                },
                // Log retention
                {
                  name: 'KAFKA_LOG_RETENTION_HOURS',
                  value: '168', // 7 days
                },
                {
                  name: 'KAFKA_LOG_SEGMENT_BYTES',
                  value: '1073741824', // 1GB
                },
                // JMX for monitoring
                {
                  name: 'KAFKA_JMX_PORT',
                  value: '9999',
                },
                {
                  name: 'KAFKA_JMX_HOSTNAME',
                  value: 'localhost',
                },
              ],
              resources: createResourceRequirements('1Gi', '2Gi', '0.5', '2'),
              livenessProbe: {
                tcpSocket: {
                  port: 9092,
                },
                initialDelaySeconds: 60,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              readinessProbe: {
                tcpSocket: {
                  port: 9092,
                },
                initialDelaySeconds: 30,
                periodSeconds: 5,
                timeoutSeconds: 3,
                failureThreshold: 3,
              },
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: false,
                runAsNonRoot: true,
                runAsUser: 1000,
                capabilities: {
                  drop: ['ALL'],
                },
              },
              volumeMounts: [
                {
                  name: 'data',
                  mountPath: '/var/lib/kafka/data',
                },
              ],
            },
            // JMX Exporter for Prometheus metrics
            {
              name: 'jmx-exporter',
              image: 'bitnami/jmx-exporter:latest',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'metrics',
                  containerPort: 9308,
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'SERVICE_PORT',
                  value: '9308',
                },
              ],
              resources: createResourceRequirements('64Mi', '128Mi', '0.1', '0.25'),
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: true,
                runAsNonRoot: true,
                runAsUser: 1001,
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
                storage: kafkaConfig.storageSize,
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

  const headlessService = new k8s.core.v1.Service('kafka-headless-service', {
    metadata: {
      name: 'kafka-headless',
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
          name: 'kafka',
          port: 9092,
          targetPort: 9092,
          protocol: 'TCP',
        },
        {
          name: 'controller',
          port: 9093,
          targetPort: 9093,
          protocol: 'TCP',
        },
        {
          name: 'metrics',
          port: 9308,
          targetPort: 9308,
          protocol: 'TCP',
        },
      ],
      publishNotReadyAddresses: true,
    },
  });

  // -------------------------------------------------------------------------
  // Service: ClusterIP for Client Access
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('kafka-service', {
    metadata: {
      name: 'kafka',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      selector: selectorLabels,
      ports: [
        {
          name: 'kafka',
          port: 9092,
          targetPort: 9092,
          protocol: 'TCP',
        },
        {
          name: 'metrics',
          port: 9308,
          targetPort: 9308,
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
