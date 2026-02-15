# 🚀 Laravel Kubernetes Infrastructure - Deployment Summary

## Current Status

### ✅ Completed
1. **Pulumi Infrastructure Code** - All components implemented
   - Laravel app, worker, and Reverb deployments
   - PostgreSQL, Redis, RabbitMQ, MinIO, Meilisearch
   - Prometheus, Grafana for observability
   - Ingress controller configuration

2. **Fixed Issues**
   - Redis secret creation (always create secret)
   - Database environment variables added to all Laravel pods
   - Secret key references corrected (postgres-password, redis-password)
   - Removed unused k8s import
   - Conditional exports for optional services

### ⚠️ Known Issues

1. **Pulumi Config Encryption Mismatch**
   - The `Pulumi.dev.yaml` file has encrypted secrets with an old encryption salt
   - When stack was recreated, the encryption salt changed
   - Secrets in config file can't be decrypted properly
   
   **Solution**: Re-encrypt all secrets with fresh stack:
   ```bash
   cd infrastructure/pulumi
   export PULUMI_CONFIG_PASSPHRASE=123456
   
   # Remove old stack and state
   pulumi stack rm dev --yes --force
   rm -rf state
   mkdir state
   
   # Create fresh stack
   pulumi stack init dev
   
   # Set all config values
   pulumi config set kubernetes:context orbstack
   pulumi config set laravel:appUrl "http://laravel.k8s.orb.local"
   pulumi config set ingress:host "laravel.k8s.orb.local"
   pulumi config set --secret laravel:appKey "base64:$(openssl rand -base64 32)"
   pulumi config set --secret postgres:password "postgres123"
   pulumi config set --secret redis:password "redis123"
   pulumi config set --secret rabbitmq:password "rabbitmq123"
   pulumi config set --secret minio:secretKey "minioadmin"
   pulumi config set --secret meilisearch:masterKey "$(openssl rand -base64 32)"
   
   # Deploy
   pulumi up --yes
   ```

2. **Meilisearch Master Key**
   - Requires at least 16 bytes (32 characters in base64)
   - Current key in config is too short
   - Use the generated key from error message or generate new one

## 🎯 ArgoCD Setup

ArgoCD is NOT currently included in the Pulumi infrastructure. Here's how to add it:

### Option 1: Manual Installation (Quick)

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access ArgoCD UI (OrbStack)
# ArgoCD will be available at: http://argocd-server.argocd.svc.cluster.local
# Or port-forward:
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Login: admin / <password from above>
# Access at: https://localhost:8080
```

### Option 2: Add to Pulumi Infrastructure (Recommended)

Create `infrastructure/pulumi/src/components/argocd.ts`:

```typescript
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export function createArgoCD(namespace: string) {
  // Create ArgoCD namespace
  const argocdNs = new k8s.core.v1.Namespace('argocd', {
    metadata: {
      name: 'argocd',
    },
  });

  // Install ArgoCD using Helm
  const argocd = new k8s.helm.v3.Release('argocd', {
    chart: 'argo-cd',
    version: '5.51.6',
    namespace: argocdNs.metadata.name,
    repositoryOpts: {
      repo: 'https://argoproj.github.io/argo-helm',
    },
    values: {
      server: {
        service: {
          type: 'LoadBalancer', // For OrbStack *.k8s.orb.local access
        },
        ingress: {
          enabled: true,
          ingressClassName: 'nginx',
          hosts: ['argocd.k8s.orb.local'],
        },
      },
    },
  });

  return { namespace: argocdNs, release: argocd };
}
```

Then add to `infrastructure/pulumi/src/index.ts`:

```typescript
import { createArgoCD } from './components/argocd';

// After observability section
const argocd = createArgoCD(namespace);
```

### How ArgoCD Works

1. **GitOps Workflow**:
   - ArgoCD monitors your Git repository
   - Automatically syncs Kubernetes manifests to cluster
   - Provides UI to visualize and manage deployments

2. **Application Setup**:
   ```yaml
   apiVersion: argoproj.io/v1alpha1
   kind: Application
   metadata:
     name: laravel-app
     namespace: argocd
   spec:
     project: default
     source:
       repoURL: https://github.com/your-org/laravel-template
       targetRevision: HEAD
       path: k8s/manifests
     destination:
       server: https://kubernetes.default.svc
       namespace: laravel-dev
     syncPolicy:
       automated:
         prune: true
         selfHeal: true
   ```

3. **Access ArgoCD**:
   - **OrbStack**: `http://argocd-server.k8s.orb.local`
   - **Port Forward**: `kubectl port-forward svc/argocd-server -n argocd 8080:443`
   - **Username**: `admin`
   - **Password**: Get from secret or reset:
     ```bash
     kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
     ```

4. **CLI Access**:
   ```bash
   # Install ArgoCD CLI
   brew install argocd
   
   # Login
   argocd login argocd-server.k8s.orb.local --username admin --password <password>
   
   # List apps
   argocd app list
   
   # Sync app
   argocd app sync laravel-app
   ```

## 📋 Next Steps

1. **Fix Pulumi Config** - Re-encrypt secrets with fresh stack
2. **Add ArgoCD Component** - Integrate into Pulumi infrastructure
3. **Create ArgoCD Applications** - Define apps for Laravel services
4. **Set up CI/CD** - GitHub Actions to update manifests
5. **Configure Monitoring** - Connect Prometheus to ArgoCD metrics

## 🔧 Quick Commands

```bash
# Check all pods
kubectl get pods -A

# Check Laravel namespace
kubectl get all -n laravel-dev

# Check logs
kubectl logs -n laravel-dev -l app.kubernetes.io/name=laravel --tail=50

# Restart deployment
kubectl rollout restart deployment/laravel-web -n laravel-dev

# Access services (OrbStack)
# - Laravel: http://laravel.k8s.orb.local
# - Mailpit: http://mailpit.k8s.orb.local:8025
# - RabbitMQ: http://rabbitmq.k8s.orb.local:15672
# - MinIO: http://minio.k8s.orb.local:9001
# - Grafana: http://grafana.k8s.orb.local
# - Prometheus: http://prometheus.k8s.orb.local
```

## 📚 Resources

- [Pulumi Kubernetes](https://www.pulumi.com/docs/clouds/kubernetes/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [OrbStack Kubernetes](https://docs.orbstack.dev/kubernetes/)
- [Laravel Octane](https://laravel.com/docs/octane)
