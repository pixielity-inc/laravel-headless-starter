/**
 * ==============================================================================
 * Observability Stack Component
 * ==============================================================================
 * Creates Kubernetes resources for comprehensive monitoring and observability.
 * Includes Prometheus, Grafana, Loki, Tempo, and Alertmanager.
 *
 * This component creates:
 * - Prometheus: Metrics collection and alerting
 * - Grafana: Metrics visualization and dashboards
 * - Loki: Log aggregation and querying
 * - Tempo: Distributed tracing (optional)
 * - Alertmanager: Alert routing and notification (optional)
 *
 * @module components/observability
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';
import { Config } from '@/config';
import {
  generateLabels,
  generateSelectorLabels,
  generateAnnotations,
  createResourceRequirements,
} from '@/utils';

/**
 * Return type for Observability resources.
 *
 * @interface ObservabilityResources
 */
interface ObservabilityResources {
  prometheusDeployment?: k8s.apps.v1.Deployment;
  prometheusService?: k8s.core.v1.Service;
  grafanaDeployment?: k8s.apps.v1.Deployment;
  grafanaService?: k8s.core.v1.Service;
  lokiDeployment?: k8s.apps.v1.Deployment;
  lokiService?: k8s.core.v1.Service;
  tempoDeployment?: k8s.apps.v1.Deployment;
  tempoService?: k8s.core.v1.Service;
  alertmanagerDeployment?: k8s.apps.v1.Deployment;
  alertmanagerService?: k8s.core.v1.Service;
}

/**
 * Creates Observability stack Kubernetes resources.
 *
 * Deploys a complete observability stack with:
 * - Prometheus for metrics collection
 * - Grafana for visualization
 * - Loki for log aggregation (optional)
 * - Tempo for distributed tracing (optional)
 * - Alertmanager for alert management (optional)
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {ObservabilityResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const observability = createObservability(config, "laravel-prod");
 * ```
 *
 * @note
 * For production, consider using managed observability services:
 * - AWS CloudWatch + Managed Prometheus + Managed Grafana
 * - Google Cloud Operations (formerly Stackdriver)
 * - Azure Monitor
 * - Datadog, New Relic, or other SaaS solutions
 */
export function createObservability(config: Config, namespace: string): ObservabilityResources {
  const observabilityConfig = config.getObservabilityConfig();
  const stack = config.getStack();

  const resources: ObservabilityResources = {};

  // =========================================================================
  // Prometheus: Metrics Collection
  // =========================================================================

  if (observabilityConfig.prometheus) {
    const prometheusLabels = generateLabels('prometheus', 'monitoring', stack);
    const prometheusSelector = generateSelectorLabels('prometheus', 'monitoring');

    resources.prometheusDeployment = new k8s.apps.v1.Deployment('prometheus', {
      metadata: {
        name: 'prometheus',
        namespace,
        labels: prometheusLabels,
        annotations: generateAnnotations(),
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: prometheusSelector,
        },
        template: {
          metadata: {
            labels: prometheusLabels,
          },
          spec: {
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 65534,
              fsGroup: 65534,
            },
            containers: [
              {
                name: 'prometheus',
                image: 'prom/prometheus:latest',
                args: [
                  '--config.file=/etc/prometheus/prometheus.yml',
                  '--storage.tsdb.path=/prometheus',
                  '--storage.tsdb.retention.time=15d',
                  '--web.console.libraries=/usr/share/prometheus/console_libraries',
                  '--web.console.templates=/usr/share/prometheus/consoles',
                ],
                ports: [
                  {
                    name: 'http',
                    containerPort: 9090,
                  },
                ],
                resources: createResourceRequirements('512Mi', '2Gi', '0.5', '2'),
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/prometheus',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
          },
        },
      },
    });

    resources.prometheusService = new k8s.core.v1.Service('prometheus-service', {
      metadata: {
        name: 'prometheus',
        namespace,
        labels: prometheusLabels,
      },
      spec: {
        type: 'ClusterIP',
        selector: prometheusSelector,
        ports: [
          {
            name: 'http',
            port: 9090,
            targetPort: 9090,
          },
        ],
      },
    });
  }

  // =========================================================================
  // Grafana: Visualization
  // =========================================================================

  if (observabilityConfig.grafana) {
    const grafanaLabels = generateLabels('grafana', 'monitoring', stack);
    const grafanaSelector = generateSelectorLabels('grafana', 'monitoring');

    resources.grafanaDeployment = new k8s.apps.v1.Deployment('grafana', {
      metadata: {
        name: 'grafana',
        namespace,
        labels: grafanaLabels,
        annotations: generateAnnotations(),
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: grafanaSelector,
        },
        template: {
          metadata: {
            labels: grafanaLabels,
          },
          spec: {
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 472,
              fsGroup: 472,
            },
            containers: [
              {
                name: 'grafana',
                image: 'grafana/grafana:latest',
                ports: [
                  {
                    name: 'http',
                    containerPort: 3000,
                  },
                ],
                env: [
                  {
                    name: 'GF_SECURITY_ADMIN_PASSWORD',
                    value: 'admin', // Change in production!
                  },
                  {
                    name: 'GF_INSTALL_PLUGINS',
                    value: 'grafana-piechart-panel',
                  },
                ],
                resources: createResourceRequirements('256Mi', '512Mi', '0.25', '1'),
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/var/lib/grafana',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
          },
        },
      },
    });

    resources.grafanaService = new k8s.core.v1.Service('grafana-service', {
      metadata: {
        name: 'grafana',
        namespace,
        labels: grafanaLabels,
      },
      spec: {
        type: 'ClusterIP',
        selector: grafanaSelector,
        ports: [
          {
            name: 'http',
            port: 3000,
            targetPort: 3000,
          },
        ],
      },
    });
  }

  // =========================================================================
  // Loki: Log Aggregation
  // =========================================================================

  if (observabilityConfig.loki) {
    const lokiLabels = generateLabels('loki', 'monitoring', stack);
    const lokiSelector = generateSelectorLabels('loki', 'monitoring');

    resources.lokiDeployment = new k8s.apps.v1.Deployment('loki', {
      metadata: {
        name: 'loki',
        namespace,
        labels: lokiLabels,
        annotations: generateAnnotations(),
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: lokiSelector,
        },
        template: {
          metadata: {
            labels: lokiLabels,
          },
          spec: {
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 10001,
              fsGroup: 10001,
            },
            containers: [
              {
                name: 'loki',
                image: 'grafana/loki:latest',
                args: ['-config.file=/etc/loki/local-config.yaml'],
                ports: [
                  {
                    name: 'http',
                    containerPort: 3100,
                  },
                ],
                resources: createResourceRequirements('512Mi', '1Gi', '0.5', '1'),
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/loki',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
          },
        },
      },
    });

    resources.lokiService = new k8s.core.v1.Service('loki-service', {
      metadata: {
        name: 'loki',
        namespace,
        labels: lokiLabels,
      },
      spec: {
        type: 'ClusterIP',
        selector: lokiSelector,
        ports: [
          {
            name: 'http',
            port: 3100,
            targetPort: 3100,
          },
        ],
      },
    });
  }

  // =========================================================================
  // Tempo: Distributed Tracing
  // =========================================================================

  if (observabilityConfig.tempo) {
    const tempoLabels = generateLabels('tempo', 'monitoring', stack);
    const tempoSelector = generateSelectorLabels('tempo', 'monitoring');

    resources.tempoDeployment = new k8s.apps.v1.Deployment('tempo', {
      metadata: {
        name: 'tempo',
        namespace,
        labels: tempoLabels,
        annotations: generateAnnotations(),
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: tempoSelector,
        },
        template: {
          metadata: {
            labels: tempoLabels,
          },
          spec: {
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 10001,
              fsGroup: 10001,
            },
            containers: [
              {
                name: 'tempo',
                image: 'grafana/tempo:latest',
                args: ['-config.file=/etc/tempo.yaml'],
                ports: [
                  {
                    name: 'http',
                    containerPort: 3200,
                  },
                  {
                    name: 'otlp-grpc',
                    containerPort: 4317,
                  },
                ],
                resources: createResourceRequirements('256Mi', '512Mi', '0.25', '0.5'),
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/var/tempo',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
          },
        },
      },
    });

    resources.tempoService = new k8s.core.v1.Service('tempo-service', {
      metadata: {
        name: 'tempo',
        namespace,
        labels: tempoLabels,
      },
      spec: {
        type: 'ClusterIP',
        selector: tempoSelector,
        ports: [
          {
            name: 'http',
            port: 3200,
            targetPort: 3200,
          },
          {
            name: 'otlp-grpc',
            port: 4317,
            targetPort: 4317,
          },
        ],
      },
    });
  }

  // =========================================================================
  // Alertmanager: Alert Management
  // =========================================================================

  if (observabilityConfig.alertmanager) {
    const alertmanagerLabels = generateLabels('alertmanager', 'monitoring', stack);
    const alertmanagerSelector = generateSelectorLabels('alertmanager', 'monitoring');

    resources.alertmanagerDeployment = new k8s.apps.v1.Deployment('alertmanager', {
      metadata: {
        name: 'alertmanager',
        namespace,
        labels: alertmanagerLabels,
        annotations: generateAnnotations(),
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: alertmanagerSelector,
        },
        template: {
          metadata: {
            labels: alertmanagerLabels,
          },
          spec: {
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 65534,
              fsGroup: 65534,
            },
            containers: [
              {
                name: 'alertmanager',
                image: 'prom/alertmanager:latest',
                args: [
                  '--config.file=/etc/alertmanager/config.yml',
                  '--storage.path=/alertmanager',
                ],
                ports: [
                  {
                    name: 'http',
                    containerPort: 9093,
                  },
                ],
                resources: createResourceRequirements('128Mi', '256Mi', '0.1', '0.5'),
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/alertmanager',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
          },
        },
      },
    });

    resources.alertmanagerService = new k8s.core.v1.Service('alertmanager-service', {
      metadata: {
        name: 'alertmanager',
        namespace,
        labels: alertmanagerLabels,
      },
      spec: {
        type: 'ClusterIP',
        selector: alertmanagerSelector,
        ports: [
          {
            name: 'http',
            port: 9093,
            targetPort: 9093,
          },
        ],
      },
    });
  }

  return resources;
}
