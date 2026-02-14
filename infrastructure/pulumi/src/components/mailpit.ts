/**
 * ==============================================================================
 * Mailpit Component
 * ==============================================================================
 * Creates Kubernetes resources for Mailpit email testing tool.
 * Captures emails sent by the application for local development and testing.
 *
 * This component creates:
 * - Deployment: Mailpit server pods
 * - Service: ClusterIP service for SMTP and web UI access
 *
 * @module components/mailpit
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';

import {
  generateLabels,
  generateAnnotations,
  generateSelectorLabels,
  createResourceRequirements,
} from '@/utils';
import { Config } from '@/config';

/**
 * Return type for Mailpit resources.
 *
 * @interface MailpitResources
 */
interface MailpitResources {
  deployment?: k8s.apps.v1.Deployment;
  service?: k8s.core.v1.Service;
}

/**
 * Creates Mailpit Kubernetes resources.
 *
 * Deploys Mailpit with:
 * - SMTP server for email capture
 * - Web UI for viewing emails
 * - Health checks
 * - Minimal resource allocation
 * - Prometheus metrics
 *
 * @param {Config} config - Pulumi configuration object
 * @param {string} namespace - Kubernetes namespace
 * @returns {MailpitResources} Created Kubernetes resources
 *
 * @example
 * ```typescript
 * const config = new Config();
 * const mailpit = createMailpit(config, "laravel-dev");
 * ```
 *
 * @note
 * Mailpit is intended for local development and testing only.
 * For production, use a real email service like:
 * - AWS SES
 * - SendGrid
 * - Mailgun
 * - Postmark
 */
export function createMailpit(config: Config, namespace: string): MailpitResources {
  const mailpitConfig = config.getMailpitConfig();
  const stack = config.getStack();

  // Skip if Mailpit is disabled (using external email service)
  if (!mailpitConfig) {
    return {};
  }

  // Generate labels
  const labels = generateLabels('mailpit', 'email', stack);
  const selectorLabels = generateSelectorLabels('mailpit', 'email');

  // Prometheus annotations
  const prometheusAnnotations = generateAnnotations({
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '8025',
    'prometheus.io/path': '/metrics',
  });

  // -------------------------------------------------------------------------
  // Deployment: Mailpit Server
  // -------------------------------------------------------------------------

  const deployment = new k8s.apps.v1.Deployment('mailpit', {
    metadata: {
      name: 'mailpit',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      replicas: 1, // Single replica for development
      selector: {
        matchLabels: selectorLabels,
      },
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0,
        },
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
              name: 'mailpit',
              image: 'axllent/mailpit:latest',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                {
                  name: 'smtp',
                  containerPort: mailpitConfig.smtpPort,
                  protocol: 'TCP',
                },
                {
                  name: 'http',
                  containerPort: mailpitConfig.uiPort,
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'MP_SMTP_BIND_ADDR',
                  value: `0.0.0.0:${mailpitConfig.smtpPort}`,
                },
                {
                  name: 'MP_UI_BIND_ADDR',
                  value: `0.0.0.0:${mailpitConfig.uiPort}`,
                },
                {
                  name: 'MP_MAX_MESSAGES',
                  value: '500',
                },
                {
                  name: 'MP_DATABASE',
                  value: '/data/mailpit.db',
                },
              ],
              resources: createResourceRequirements('64Mi', '128Mi', '0.1', '0.25'),
              livenessProbe: {
                httpGet: {
                  path: '/api/v1/info',
                  port: mailpitConfig.uiPort,
                  scheme: 'HTTP',
                },
                initialDelaySeconds: 10,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              readinessProbe: {
                httpGet: {
                  path: '/api/v1/info',
                  port: mailpitConfig.uiPort,
                  scheme: 'HTTP',
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
                runAsUser: 1000,
                capabilities: {
                  drop: ['ALL'],
                },
              },
              volumeMounts: [
                {
                  name: 'data',
                  mountPath: '/data',
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'data',
              emptyDir: {}, // Ephemeral storage for development
            },
          ],
          restartPolicy: 'Always',
          dnsPolicy: 'ClusterFirst',
          terminationGracePeriodSeconds: 10,
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // Service: ClusterIP for SMTP and Web UI Access
  // -------------------------------------------------------------------------

  const service = new k8s.core.v1.Service('mailpit-service', {
    metadata: {
      name: 'mailpit',
      namespace,
      labels,
      annotations: generateAnnotations(),
    },
    spec: {
      type: 'ClusterIP',
      selector: selectorLabels,
      ports: [
        {
          name: 'smtp',
          port: mailpitConfig.smtpPort,
          targetPort: mailpitConfig.smtpPort,
          protocol: 'TCP',
        },
        {
          name: 'http',
          port: mailpitConfig.uiPort,
          targetPort: mailpitConfig.uiPort,
          protocol: 'TCP',
        },
      ],
      sessionAffinity: 'None',
    },
  });

  return {
    deployment,
    service,
  };
}
