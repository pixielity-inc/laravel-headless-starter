/**
 * ==============================================================================
 * ArgoCD Component
 * ==============================================================================
 * Creates Kubernetes resources for ArgoCD - GitOps continuous delivery tool.
 * Provides declarative, Git-based deployment and management of applications.
 *
 * This component creates:
 * - Namespace: Dedicated namespace for ArgoCD
 * - Helm Release: ArgoCD installation via Helm chart
 * - Service: LoadBalancer/Ingress for UI access
 * - Initial admin credentials
 *
 * @module components/argocd
 * ==============================================================================
 */

import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { generateLabels, generateAnnotations } from '@/utils';

/**
 * ArgoCD configuration interface
 */
export interface ArgoCDConfig {
  enabled: boolean;
  version?: string;
  host?: string;
  adminPassword?: pulumi.Output<string>;
  enableIngress?: boolean;
  ingressClassName?: string;
  enableSSO?: boolean;
  replicas?: number;
}

/**
 * Return type for ArgoCD resources
 */
export interface ArgoCDResources {
  namespace?: k8s.core.v1.Namespace;
  release?: k8s.helm.v3.Release;
  ingress?: k8s.networking.v1.Ingress;
}

/**
 * Creates ArgoCD GitOps deployment
 *
 * @param config - ArgoCD configuration
 * @param labels - Common labels to apply
 * @returns ArgoCD resources
 */
export function createArgoCD(
  config: ArgoCDConfig,
  labels: Record<string, string>
): ArgoCDResources {
  if (!config.enabled) {
    return {};
  }

  const argocdLabels = {
    ...labels,
    'app.kubernetes.io/name': 'argocd',
    'app.kubernetes.io/component': 'gitops',
  };

  // -------------------------------------------------------------------------
  // Namespace: ArgoCD
  // -------------------------------------------------------------------------

  const namespace = new k8s.core.v1.Namespace('argocd-namespace', {
    metadata: {
      name: 'argocd',
      labels: argocdLabels,
      annotations: generateAnnotations(),
    },
  });

  // -------------------------------------------------------------------------
  // Helm Release: ArgoCD
  // -------------------------------------------------------------------------

  const helmValues: any = {
    global: {
      domain: config.host || 'argocd.k8s.orb.local',
    },
    configs: {
      params: {
        'server.insecure': true, // For local development
      },
    },
    server: {
      replicas: config.replicas || 1,
      service: {
        type: 'LoadBalancer', // For OrbStack *.k8s.orb.local access
      },
      ingress: {
        enabled: config.enableIngress ?? true,
        ingressClassName: config.ingressClassName || 'nginx',
        hosts: [config.host || 'argocd.k8s.orb.local'],
        tls: false, // Disable TLS for local development
        annotations: {
          'nginx.ingress.kubernetes.io/force-ssl-redirect': 'false',
          'nginx.ingress.kubernetes.io/backend-protocol': 'HTTP',
        },
      },
      extraArgs: [
        '--insecure', // Disable TLS for local development
      ],
    },
    controller: {
      replicas: 1,
    },
    repoServer: {
      replicas: config.replicas || 1,
    },
    applicationSet: {
      replicas: config.replicas || 1,
    },
    redis: {
      enabled: true,
    },
    dex: {
      enabled: config.enableSSO ?? false,
    },
    notifications: {
      enabled: true,
    },
  };

  // Set admin password if provided
  if (config.adminPassword) {
    helmValues.configs = {
      ...helmValues.configs,
      secret: {
        argocdServerAdminPassword: config.adminPassword,
      },
    };
  }

  const release = new k8s.helm.v3.Release(
    'argocd',
    {
      chart: 'argo-cd',
      version: config.version || '7.7.11', // Latest stable version
      namespace: namespace.metadata.name,
      repositoryOpts: {
        repo: 'https://argoproj.github.io/argo-helm',
      },
      values: helmValues,
      skipAwait: false,
      timeout: 600, // 10 minutes timeout
      cleanupOnFail: true,
    },
    {
      dependsOn: [namespace],
    }
  );

  // -------------------------------------------------------------------------
  // Ingress: ArgoCD UI (if not using Helm ingress)
  // -------------------------------------------------------------------------

  let ingress: k8s.networking.v1.Ingress | undefined;

  if (!config.enableIngress) {
    ingress = new k8s.networking.v1.Ingress(
      'argocd-ingress',
      {
        metadata: {
          name: 'argocd-server',
          namespace: namespace.metadata.name,
          labels: argocdLabels,
          annotations: {
            ...generateAnnotations(),
            'nginx.ingress.kubernetes.io/force-ssl-redirect': 'false',
            'nginx.ingress.kubernetes.io/backend-protocol': 'HTTP',
          },
        },
        spec: {
          ingressClassName: config.ingressClassName || 'nginx',
          rules: [
            {
              host: config.host || 'argocd.k8s.orb.local',
              http: {
                paths: [
                  {
                    path: '/',
                    pathType: 'Prefix',
                    backend: {
                      service: {
                        name: 'argocd-server',
                        port: {
                          number: 80,
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        dependsOn: [release],
      }
    );
  }

  return {
    namespace,
    release,
    ingress,
  };
}

/**
 * Gets the default ArgoCD configuration from Pulumi config
 *
 * @param config - Pulumi config instance
 * @returns ArgoCD configuration
 */
export function getArgoCDConfig(config: pulumi.Config): ArgoCDConfig {
  return {
    enabled: config.getBoolean('argocd:enabled') ?? false,
    version: config.get('argocd:version') || '7.7.11',
    host: config.get('argocd:host') || 'argocd.k8s.orb.local',
    adminPassword: config.getSecret('argocd:adminPassword'),
    enableIngress: config.getBoolean('argocd:enableIngress') ?? true,
    ingressClassName: config.get('argocd:ingressClassName') || 'nginx',
    enableSSO: config.getBoolean('argocd:enableSSO') ?? false,
    replicas: config.getNumber('argocd:replicas') || 1,
  };
}
