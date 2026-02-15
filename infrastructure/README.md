# ☸️ Laravel Kubernetes Infrastructure

Enterprise-grade Kubernetes infrastructure for Laravel applications using Pulumi, TypeScript, and GitOps principles.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Components](#components)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Scaling](#scaling)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This infrastructure provides a **complete, production-ready Kubernetes deployment** for Laravel applications with:

### Features

- ⚡ **High Performance** - Laravel Octane with FrankenPHP
- 🔄 **Auto-scaling** - HPA for web pods, KEDA for workers
- 📊 **Full Observability** - Prometheus, Grafana, Loki
- 🔐 **Security First** - Network policies, RBAC, secrets management
- 🚀 **GitOps Ready** - ArgoCD for automated deployments
- 🐳 **Multi-environment** - Dev, staging, production configs
- 💾 **Data Persistence** - StatefulSets with PVCs
- 🔍 **Full-text Search** - Meilisearch or Elasticsearch
- 📧 **Email Testing** - Mailpit for local development
- 🎯 **Zero Downtime** - Rolling updates, health checks

### Supported Platforms

- **Local**: OrbStack, Docker Desktop, Minikube
- **Cloud**: AWS EKS, Google GKE, Azure AKS
- **On-premise**: Any Kubernetes 1.24+

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Ingress Layer                         │
│  (NGINX Ingress Controller + TLS with cert-manager)         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│  Laravel Web   │   │ Laravel Worker │   │ Laravel Reverb │
│  (Octane/PHP)  │   │  (Queue Jobs)  │   │  (WebSockets)  │
│   HPA: 1-20    │   │  KEDA: 1-50    │   │   HPA: 1-10    │
└────────────────┘   └────────────────┘   └────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│   PostgreSQL   │   │     Redis      │   │    RabbitMQ    │
│  (StatefulSet) │   │  (Cache/Queue) │   │  (Message Bus) │
└────────────────┘   └────────────────┘   └────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│  MinIO/S3      │   │  Meilisearch   │   │     Kafka      │
│  (Storage)     │   │   (Search)     │   │  (Streaming)   │
└────────────────┘   └────────────────┘   └────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│   Prometheus   │   │    Grafana     │   │      Loki      │
│   (Metrics)    │   │  (Dashboards)  │   │     (Logs)     │
└────────────────┘   └────────────────┘   └────────────────┘
```

### Directory Structure

```
infrastructure/
├── pulumi/                     # Infrastructure as code
│   ├── src/
│   │   ├── components/        # Kubernetes components
│   │   │   ├── laravel-app.ts      # Laravel web pods
│   │   │   ├── laravel-worker.ts   # Queue worker pods
│   │   │   ├── laravel-reverb.ts   # WebSocket server
│   │   │   ├── postgres.ts         # PostgreSQL database
│   │   │   ├── redis.ts            # Redis cache
│   │   │   ├── rabbitmq.ts         # RabbitMQ broker
│   │   │   ├── kafka.ts            # Kafka streaming
│   │   │   ├── minio.ts            # MinIO storage
│   │   │   ├── meilisearch.ts      # Search engine
│   │   │   ├── mailpit.ts          # Email testing
│   │   │   ├── ingress.ts          # Ingress controller
│   │   │   ├── argocd.ts           # GitOps deployment
│   │   │   ├── observability.ts    # Monitoring stack
│   │   │   └── index.ts            # Component exports
│   │   ├── config/            # Configuration management
│   │   │   └── index.ts            # Config loader
│   │   ├── interfaces/        # TypeScript interfaces
│   │   │   ├── laravel-config.interface.ts
│   │   │   ├── postgres-config.interface.ts
│   │   │   ├── redis-config.interface.ts
│   │   │   ├── feature-flags.interface.ts
│   │   │   └── index.ts
│   │   ├── constants/         # Application constants
│   │   │   ├── label-keys.ts       # Kubernetes labels
│   │   │   └── index.ts
│   │   ├── utils/             # Utility functions
│   │   │   ├── labels.ts           # Label generators
│   │   │   ├── resources.ts        # Resource helpers
│   │   │   └── secrets.ts          # Secret management
│   │   └── index.ts           # Main entry point
│   ├── state/                 # Pulumi state files
│   ├── Pulumi.yaml            # Project definition
│   ├── Pulumi.dev.yaml        # Development config
│   ├── Pulumi.staging.yaml    # Staging config
│   ├── Pulumi.production.yaml # Production config
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── README.md              # Pulumi documentation
├── docs/                      # Documentation
│   ├── K9S_GUIDE.md          # K9s usage guide
│   └── DEPLOYMENT_SUMMARY.md  # Deployment status
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes Cluster**
   - Local: OrbStack, Docker Desktop, or Minikube
   - Cloud: EKS, GKE, or AKS

2. **Required Tools**
   ```bash
   # Pulumi CLI
   brew install pulumi
   # or
   curl -fsSL https://get.pulumi.com | sh
   
   # kubectl
   brew install kubectl
   
   # Node.js 18+
   brew install node
   
   # K9s (optional but recommended)
   brew install k9s
   ```

3. **Kubernetes Context**
   ```bash
   # List available contexts
   kubectl config get-contexts
   
   # Set context (OrbStack example)
   kubectl config use-context orbstack
   ```

### Installation

```bash
# Navigate to infrastructure directory
cd infrastructure/pulumi

# Install dependencies
npm install

# Login to Pulumi (local backend for development)
pulumi login --local

# Create and select development stack
pulumi stack init dev
pulumi stack select dev

# Set configuration
export PULUMI_CONFIG_PASSPHRASE=123456

pulumi config set kubernetes:context orbstack
pulumi config set laravel:appUrl "http://laravel.k8s.orb.local"
pulumi config set ingress:host "laravel.k8s.orb.local"

# Set secrets
pulumi config set --secret laravel:appKey "base64:$(openssl rand -base64 32)"
pulumi config set --secret postgres:password "postgres123"
pulumi config set --secret redis:password "redis123"
pulumi config set --secret rabbitmq:password "rabbitmq123"
pulumi config set --secret minio:secretKey "minioadmin"
pulumi config set --secret meilisearch:masterKey "$(openssl rand -base64 32)"

# Preview infrastructure
pulumi preview

# Deploy infrastructure
pulumi up --yes
```

### Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n laravel-dev

# Check services
kubectl get svc -n laravel-dev

# Check ingress
kubectl get ingress -n laravel-dev

# Use K9s for interactive management
k9s -n laravel-dev
```

### Access Services

**OrbStack (*.k8s.orb.local):**
- Laravel: http://laravel.k8s.orb.local
- Mailpit: http://mailpit.k8s.orb.local:8025
- RabbitMQ: http://rabbitmq.k8s.orb.local:15672
- MinIO: http://minio.k8s.orb.local:9001
- Grafana: http://grafana.k8s.orb.local
- Prometheus: http://prometheus.k8s.orb.local
- ArgoCD: http://argocd.k8s.orb.local

**Port Forwarding (alternative):**
```bash
# Laravel
kubectl port-forward svc/laravel-web 8000:8000 -n laravel-dev

# Mailpit
kubectl port-forward svc/mailpit 8025:8025 -n laravel-dev

# Grafana
kubectl port-forward svc/grafana 3000:3000 -n laravel-dev
```

## 🧩 Components

### Laravel Application Layer

#### Web Pods (`laravel-web`)
- **Purpose**: Handle HTTP requests via Laravel Octane
- **Technology**: FrankenPHP (HTTP/2, HTTP/3 ready)
- **Replicas**: 1 (dev), 3-20 (prod with HPA)
- **Resources**: 512Mi-2Gi memory, 0.5-2 CPU
- **Features**:
  - Health checks (liveness, readiness)
  - Graceful shutdown
  - Auto-scaling based on CPU/memory
  - Rolling updates with zero downtime

#### Worker Pods (`laravel-worker`)
- **Purpose**: Process background jobs
- **Queues**: Redis, RabbitMQ, Kafka
- **Replicas**: 1 (dev), 2-50 (prod with KEDA)
- **Resources**: 256Mi-1Gi memory, 0.25-1 CPU
- **Features**:
  - Auto-scaling based on queue depth
  - Multiple queue support
  - Job retry logic
  - Failed job handling

#### Reverb Pods (`laravel-reverb`)
- **Purpose**: WebSocket server for real-time features
- **Protocol**: WebSocket over HTTP/HTTPS
- **Replicas**: 1 (dev), 2-10 (prod with HPA)
- **Resources**: 256Mi-1Gi memory, 0.25-1 CPU
- **Features**:
  - Sticky sessions for WebSocket connections
  - Horizontal scaling with Redis adapter
  - Presence channels
  - Private channels with authentication

### Data Layer

#### PostgreSQL
- **Type**: Relational database
- **Deployment**: StatefulSet with PVC
- **Storage**: 10Gi (dev), 100Gi+ (prod)
- **Backup**: Automated daily backups
- **HA**: Primary-replica setup (prod)
- **Recommended**: Managed RDS/Cloud SQL for production

#### Redis
- **Type**: In-memory data store
- **Usage**: Cache, sessions, queues, rate limiting
- **Deployment**: Single pod (dev), Sentinel (prod)
- **Persistence**: RDB + AOF
- **Recommended**: Managed ElastiCache/MemoryStore for production

#### RabbitMQ
- **Type**: Message broker
- **Usage**: Traditional queuing, retry logic
- **Deployment**: Single node (dev), cluster (prod)
- **Features**: Dead letter queues, delayed messages
- **Management UI**: Port 15672

#### Kafka
- **Type**: Event streaming platform
- **Usage**: Event sourcing, microservices communication
- **Deployment**: Single broker (dev), cluster (prod)
- **Features**: High throughput, durability
- **Recommended**: Managed MSK/Confluent Cloud for production

### Storage Layer

#### MinIO (Local) / S3 (Production)
- **Type**: Object storage
- **API**: S3-compatible
- **Usage**: File uploads, media storage
- **Deployment**: StatefulSet with PVC (local)
- **Features**: Versioning, lifecycle policies
- **Console**: Port 9001

### Search Layer

#### Meilisearch
- **Type**: Fast, typo-tolerant search engine
- **Usage**: Product search, autocomplete
- **Deployment**: StatefulSet with PVC
- **Features**: Instant search, faceting, filtering
- **API**: RESTful HTTP API

#### Elasticsearch (Alternative)
- **Type**: Full-text search and analytics
- **Usage**: Large datasets, complex queries
- **Deployment**: StatefulSet cluster
- **Features**: Aggregations, geospatial search

### Development Tools

#### Mailpit
- **Type**: Email testing tool
- **Environment**: Local development only
- **Ports**: 1025 (SMTP), 8025 (Web UI)
- **Features**: Email capture, API access, search

### Observability Stack

#### Prometheus
- **Type**: Metrics collection and alerting
- **Scraping**: All pods with annotations
- **Retention**: 15 days (dev), 30 days (prod)
- **Exporters**: Node, kube-state-metrics

#### Grafana
- **Type**: Metrics visualization
- **Dashboards**: Pre-configured for Laravel, Kubernetes
- **Data Sources**: Prometheus, Loki
- **Alerts**: Integrated with Prometheus

#### Loki
- **Type**: Log aggregation
- **Collection**: Promtail agents
- **Retention**: 7 days (configurable)
- **Query**: LogQL language

### GitOps Layer

#### ArgoCD
- **Type**: Continuous delivery tool
- **Method**: GitOps
- **Features**: Auto-sync, self-heal, rollback
- **UI**: Web-based dashboard
- **CLI**: argocd command-line tool

## ⚙️ Configuration

### Environment-Specific Stacks

Configuration is managed through Pulumi stack files:

```bash
# Development (local)
pulumi stack select dev
pulumi config set kubernetes:context orbstack

# Staging
pulumi stack select staging
pulumi config set kubernetes:context staging-cluster

# Production
pulumi stack select production
pulumi config set kubernetes:context production-cluster
```

### Configuration Options

```yaml
# Pulumi.dev.yaml example
config:
  # Kubernetes
  kubernetes:context: orbstack
  
  # Laravel
  laravel:appUrl: http://laravel.k8s.orb.local
  laravel:appKey:
    secure: AAABAxxxxxxx...
  laravel:webReplicas: 1
  laravel:workerReplicas: 1
  laravel:reverbReplicas: 1
  
  # Database
  postgres:host: postgres
  postgres:port: 5432
  postgres:database: laravel
  postgres:username: laravel
  postgres:password:
    secure: AAABAxxxxxxx...
  
  # Redis
  redis:host: redis
  redis:port: 6379
  redis:password:
    secure: AAABAxxxxxxx...
  
  # Feature Flags
  features:hpa: false
  features:pdb: false
  features:networkPolicies: false
  features:observability: true
```

### Secrets Management

```bash
# Set a secret
pulumi config set --secret postgres:password mySecurePassword

# Set from environment variable
export DB_PASSWORD=mySecurePassword
pulumi config set --secret postgres:password $DB_PASSWORD

# Set from file
pulumi config set --secret appKey --path .env

# View configuration (secrets are encrypted)
pulumi config

# Export configuration
pulumi config --show-secrets > config-backup.yaml
```

## 🚢 Deployment

### Local Development

```bash
cd infrastructure/pulumi

# Deploy
pulumi up --yes

# Watch logs
kubectl logs -f -n laravel-dev -l app=laravel-web

# Access application
open http://laravel.k8s.orb.local
```

### Staging/Production

```bash
# Switch to production stack
pulumi stack select production

# Review changes
pulumi preview

# Deploy with approval
pulumi up

# Or deploy without approval (CI/CD)
pulumi up --yes --skip-preview
```

### GitOps with ArgoCD

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Create application
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: laravel-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/pixielity-inc/laravel-headless-starter
    targetRevision: HEAD
    path: infrastructure/pulumi
  destination:
    server: https://kubernetes.default.svc
    namespace: laravel-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Infrastructure
on:
  push:
    branches: [main]
    paths:
      - 'infrastructure/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Pulumi
        uses: pulumi/actions@v4
      
      - name: Install dependencies
        run: |
          cd infrastructure/pulumi
          npm install
      
      - name: Deploy to staging
        run: |
          cd infrastructure/pulumi
          pulumi stack select staging
          pulumi up --yes
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          PULUMI_CONFIG_PASSPHRASE: ${{ secrets.PULUMI_CONFIG_PASSPHRASE }}
```

## 📊 Monitoring

### Accessing Dashboards

```bash
# Grafana
kubectl port-forward svc/grafana 3000:3000 -n laravel-dev
# Open: http://localhost:3000
# Default: admin/admin

# Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n laravel-dev
# Open: http://localhost:9090
```

### Pre-configured Dashboards

- **Laravel Application** - Request rate, response time, error rate
- **Kubernetes Cluster** - Node metrics, pod health
- **PostgreSQL** - Connections, queries, cache hit ratio
- **Redis** - Memory usage, commands/sec, hit rate
- **RabbitMQ** - Queue depth, message rate
- **Ingress** - Traffic, status codes, latency

### Custom Metrics

Add Prometheus annotations to your pods:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: "/metrics"
```

### Alerts

Configure alerts in Prometheus:

```yaml
groups:
  - name: laravel
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
```

## 📈 Scaling

### Horizontal Pod Autoscaling (HPA)

**Web Pods:**
```yaml
minReplicas: 3
maxReplicas: 20
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Worker Pods (KEDA):**
```yaml
minReplicaCount: 2
maxReplicaCount: 50
triggers:
  - type: redis
    metadata:
      listName: laravel:queue:default
      listLength: "10"
```

### Vertical Scaling

Update resource limits:

```bash
# Edit configuration
pulumi config set laravel:webMemoryLimit 4Gi
pulumi config set laravel:webCpuLimit "4"

# Apply changes
pulumi up
```

### Cluster Autoscaling

Enable cluster autoscaler for cloud providers:

```bash
# AWS EKS
eksctl create cluster --enable-cluster-autoscaler

# GKE
gcloud container clusters update CLUSTER_NAME --enable-autoscaling
```

## 🔐 Security

### Network Policies

```yaml
# Allow only necessary traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: laravel-web
spec:
  podSelector:
    matchLabels:
      app: laravel-web
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ingress-nginx
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
```

### RBAC

```yaml
# Service account with minimal permissions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: laravel-app
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: laravel-app
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list"]
```

### Secrets

```bash
# Encrypt secrets at rest
kubectl create secret generic laravel-secrets \
  --from-literal=app-key=$(openssl rand -base64 32) \
  --from-literal=db-password=$(openssl rand -base64 32)

# Use external secrets operator (recommended)
kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/crds/bundle.yaml
```

## 🔧 Troubleshooting

### Common Issues

**Pods not starting:**
```bash
# Check pod status
kubectl get pods -n laravel-dev

# Describe pod
kubectl describe pod <pod-name> -n laravel-dev

# Check logs
kubectl logs <pod-name> -n laravel-dev

# Use K9s for easier debugging
k9s -n laravel-dev
```

**Database connection failed:**
```bash
# Check PostgreSQL pod
kubectl logs -n laravel-dev -l app=postgres

# Test connection from Laravel pod
kubectl exec -it <laravel-pod> -n laravel-dev -- php artisan tinker
>>> DB::connection()->getPdo();
```

**Ingress not working:**
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress -n laravel-dev

# Check service
kubectl get svc -n laravel-dev
```

**High memory usage:**
```bash
# Check resource usage
kubectl top pods -n laravel-dev

# Increase memory limit
pulumi config set laravel:webMemoryLimit 2Gi
pulumi up
```

### Debugging Tools

```bash
# K9s - Interactive Kubernetes CLI
k9s -n laravel-dev

# Stern - Multi-pod log tailing
stern laravel -n laravel-dev

# Kubectx/Kubens - Context/namespace switching
kubens laravel-dev

# Dive - Docker image analysis
dive laravel:latest
```

### Logs

```bash
# All Laravel pods
kubectl logs -n laravel-dev -l app=laravel-web --tail=100 -f

# Specific pod
kubectl logs -n laravel-dev <pod-name> -f

# Previous pod instance
kubectl logs -n laravel-dev <pod-name> --previous

# All containers in pod
kubectl logs -n laravel-dev <pod-name> --all-containers
```

## 📚 Additional Resources

- [Pulumi Documentation](pulumi/README.md)
- [K9s Guide](docs/K9S_GUIDE.md)
- [Deployment Summary](docs/DEPLOYMENT_SUMMARY.md)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Laravel Octane](https://laravel.com/docs/octane)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)

## 🤝 Contributing

See [CONTRIBUTING.md](../apps/api/CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Need help?** Check the [troubleshooting section](#troubleshooting) or open an issue on GitHub.
