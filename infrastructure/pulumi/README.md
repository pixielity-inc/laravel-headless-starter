# Laravel Kubernetes Infrastructure with Pulumi

Enterprise-grade Kubernetes infrastructure for Laravel applications using Pulumi and TypeScript.

## 🎯 Architecture Overview

This infrastructure implements a **360° production-ready Kubernetes deployment** with:

- **Laravel Octane** (FrankenPHP) for high-performance PHP
- **PostgreSQL** for relational data
- **Redis** for caching, sessions, and queues
- **Kafka** for event streaming
- **RabbitMQ** for message queuing
- **MinIO/S3** for object storage
- **Meilisearch/Elasticsearch** for full-text search
- **Laravel Reverb** for WebSockets
- **Mailpit** for local email testing
- **Full observability** (Prometheus, Grafana, Loki)
- **GitOps deployment** with ArgoCD

## 📁 Project Structure

```
infrastructure/pulumi/
├── src/
│   ├── components/          # Reusable Kubernetes components
│   │   ├── laravel-app.ts   # Laravel web application
│   │   ├── laravel-worker.ts # Queue workers
│   │   ├── laravel-reverb.ts # WebSocket server
│   │   ├── postgres.ts      # PostgreSQL database
│   │   ├── redis.ts         # Redis cache
│   │   ├── kafka.ts         # Kafka event streaming
│   │   ├── rabbitmq.ts      # RabbitMQ message broker
│   │   ├── minio.ts         # MinIO object storage
│   │   ├── meilisearch.ts   # Meilisearch search engine
│   │   ├── mailpit.ts       # Mailpit email testing
│   │   ├── ingress.ts       # Ingress controller
│   │   └── observability.ts # Monitoring stack
│   ├── config/              # Configuration management
│   │   └── index.ts         # Centralized config loader
│   ├── interfaces/          # TypeScript interfaces
│   │   ├── laravel-config.interface.ts
│   │   ├── postgres-config.interface.ts
│   │   ├── redis-config.interface.ts
│   │   ├── kafka-config.interface.ts
│   │   ├── rabbitmq-config.interface.ts
│   │   ├── storage-config.interface.ts
│   │   ├── search-config.interface.ts
│   │   ├── mailpit-config.interface.ts
│   │   ├── ingress-config.interface.ts
│   │   ├── observability-config.interface.ts
│   │   ├── feature-flags.interface.ts
│   │   └── index.ts         # Interface exports
│   ├── constants/           # Application constants
│   │   ├── label-keys.ts    # Kubernetes label keys
│   │   └── index.ts         # Constants exports
│   ├── utils/               # Utility functions
│   │   ├── labels.ts        # Label generators
│   │   ├── resources.ts     # Resource helpers
│   │   └── secrets.ts       # Secret management
│   └── index.ts             # Main entry point
├── Pulumi.yaml              # Project definition
├── Pulumi.dev.yaml          # Local development config
├── Pulumi.staging.yaml      # Staging environment config
├── Pulumi.production.yaml   # Production environment config
├── package.json             # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
├── README.md                # This file
└── INTERFACES.md            # Interface documentation
```

## 🚀 Quick Start

### Prerequisites

1. **OrbStack or Docker Desktop** with Kubernetes enabled
2. **Pulumi CLI** installed: `brew install pulumi` or `curl -fsSL https://get.pulumi.com | sh`
3. **kubectl** installed: `brew install kubectl`
4. **Node.js 18+** installed

### Installation

```bash
# Navigate to infrastructure directory
cd infrastructure/pulumi

# Install dependencies
npm install

# Login to Pulumi (use local backend for development)
pulumi login --local

# Select development stack
pulumi stack select dev --create

# Preview infrastructure
pulumi preview

# Deploy infrastructure
pulumi up
```

### Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n laravel-dev

# Check services
kubectl get svc -n laravel-dev

# Access Laravel application
kubectl port-forward svc/laravel-web 8000:8000 -n laravel-dev

# Access Mailpit UI
kubectl port-forward svc/mailpit 8025:8025 -n laravel-dev

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n laravel-dev
```

## 🏗️ Architecture Components

### Laravel Application Layer

#### Web Pods (`laravel-web`)
- **Purpose**: Handle HTTP requests via Laravel Octane
- **Replicas**: 1 (local), 3-20 (production with HPA)
- **Resources**: 512Mi-2Gi memory, 0.5-2 CPU
- **Features**: Health checks, readiness probes, graceful shutdown

#### Worker Pods (`laravel-worker`)
- **Purpose**: Process background jobs from Redis/RabbitMQ/Kafka
- **Replicas**: 1 (local), 2-50 (production with KEDA)
- **Resources**: 256Mi-1Gi memory, 0.25-1 CPU
- **Features**: Auto-scaling based on queue depth

#### Reverb Pods (`laravel-reverb`)
- **Purpose**: WebSocket server for real-time features
- **Replicas**: 1 (local), 2-10 (production with HPA)
- **Resources**: 256Mi-1Gi memory, 0.25-1 CPU
- **Features**: Sticky sessions, horizontal scaling

### Data Layer

#### PostgreSQL
- **Local**: StatefulSet with PVC
- **Production**: Managed RDS/Cloud SQL (recommended)
- **Features**: Automated backups, replication, monitoring

#### Redis
- **Local**: Single pod deployment
- **Production**: Managed ElastiCache/MemoryStore (recommended)
- **Usage**: Cache, sessions, queues, rate limiting

#### Kafka
- **Local**: Single broker with KRaft mode
- **Production**: Managed MSK/Confluent Cloud (recommended)
- **Usage**: Event streaming, async microservices

#### RabbitMQ
- **Local**: Single node
- **Production**: Managed Amazon MQ (recommended)
- **Usage**: Traditional queuing, retry logic

### Storage Layer

#### MinIO (Local) / S3 (Production)
- **Purpose**: Object storage for uploads, media
- **Local**: StatefulSet with PVC
- **Production**: AWS S3, GCS, or Azure Blob
- **Features**: S3-compatible API, versioning

### Search Layer

#### Meilisearch (Recommended)
- **Purpose**: Fast, typo-tolerant search
- **Replicas**: 1 (local), 3 (production)
- **Features**: Instant search, faceting, filtering

#### Elasticsearch (Alternative)
- **Purpose**: Advanced search and analytics
- **Use case**: Large datasets, complex queries
- **Features**: Full-text search, aggregations

### Development Tools

#### Mailpit (Local Only)
- **Purpose**: Email testing without sending
- **Ports**: 1025 (SMTP), 8025 (Web UI)
- **Features**: Email capture, API access

### Observability Stack

#### Prometheus
- **Purpose**: Metrics collection and alerting
- **Scrapes**: All pods with Prometheus annotations
- **Retention**: 15 days (local), 30 days (production)

#### Grafana
- **Purpose**: Metrics visualization
- **Dashboards**: Pre-configured for Laravel, Kubernetes
- **Access**: Port-forward or Ingress

#### Loki (Production)
- **Purpose**: Log aggregation
- **Integration**: Promtail for log collection
- **Retention**: 7 days (configurable)

## 🔧 Configuration

### Environment-Specific Configuration

Configuration is managed through Pulumi stack files:

- `Pulumi.dev.yaml` - Local development (OrbStack)
- `Pulumi.staging.yaml` - Staging environment
- `Pulumi.production.yaml` - Production environment

### Key Configuration Options

```yaml
# Application scaling
laravel:webReplicas: 3
laravel:workerReplicas: 5

# Resource limits
laravel:webMemoryLimit: 2Gi
laravel:webCpuLimit: "2"

# Database connection
postgres:host: production-db.rds.amazonaws.com
postgres:password:
  secure: <encrypted>

# Feature flags
features:hpa: true
features:pdb: true
features:networkPolicies: true
```

### Secrets Management

```bash
# Set a secret value
pulumi config set --secret postgres:password mySecurePassword

# Set from file
pulumi config set --secret appKey --path .env

# View configuration (secrets are encrypted)
pulumi config
```

## 📊 Scaling Strategy

### Horizontal Pod Autoscaling (HPA)

**Web Pods:**
- Metric: CPU utilization > 70%
- Min replicas: 3
- Max replicas: 20
- Scale up: 30 seconds
- Scale down: 5 minutes

**Worker Pods (with KEDA):**
- Metric: Queue depth
- Min replicas: 2
- Max replicas: 50
- Scale based on: Redis queue length, Kafka lag

### Vertical Scaling

Resource requests and limits are tuned per environment:

| Environment | Web Memory | Web CPU | Worker Memory | Worker CPU |
|-------------|------------|---------|---------------|------------|
| Local       | 512Mi      | 0.5     | 256Mi         | 0.25       |
| Staging     | 1Gi        | 1       | 512Mi         | 0.5        |
| Production  | 2Gi        | 2       | 1Gi           | 1          |

## 🔐 Security

### Pod Security

- **Security Context**: Non-root user, read-only root filesystem
- **Network Policies**: Restrict pod-to-pod communication
- **Pod Security Standards**: Restricted profile in production
- **Secrets**: Encrypted at rest, mounted as volumes

### Network Security

- **Ingress**: TLS termination with cert-manager
- **Internal Services**: ClusterIP only (not exposed)
- **Network Policies**: Deny all by default, allow specific

### RBAC

- **Service Accounts**: Dedicated per component
- **Roles**: Least privilege principle
- **Pod Security Policies**: Enforced in production

## 🚢 Deployment Strategies

### GitOps with ArgoCD (Production)

```yaml
# ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: laravel-production
spec:
  source:
    repoURL: https://github.com/pixielity-inc/laravel-headless-starter
    targetRevision: main
    path: infrastructure/pulumi
  destination:
    server: https://kubernetes.default.svc
    namespace: laravel-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t laravel:${{ github.sha }} .
      - name: Push to registry
        run: docker push laravel:${{ github.sha }}
      - name: Update Pulumi config
        run: pulumi config set laravel:imageTag ${{ github.sha }}
      - name: Deploy with Pulumi
        run: pulumi up --yes
```

## 📈 Monitoring & Observability

### Metrics

- **Application**: Laravel Octane metrics, queue depth, job processing time
- **Infrastructure**: CPU, memory, disk, network
- **Business**: Request rate, error rate, response time

### Logging

- **Structured Logs**: JSON format with context
- **Centralized**: Loki aggregation
- **Retention**: 7 days (configurable)

### Tracing (Future)

- **OpenTelemetry**: Distributed tracing
- **Tempo**: Trace storage and visualization

### Alerts

- **Critical**: Pod crashes, high error rate, database down
- **Warning**: High CPU/memory, slow responses
- **Info**: Deployments, scaling events

## 🔄 Backup & Disaster Recovery

### Database Backups

- **Frequency**: Daily at 2 AM
- **Retention**: 30 days
- **Storage**: S3 with versioning
- **Testing**: Monthly restore tests

### Application State

- **Stateless Design**: No local state in pods
- **External Storage**: All files in S3/MinIO
- **Configuration**: GitOps (infrastructure as code)

## 🧪 Testing

### Local Testing

```bash
# Deploy to local cluster
pulumi stack select dev
pulumi up

# Run integration tests
kubectl run test --rm -it --image=laravel:latest -- php artisan test

# Load testing
kubectl run k6 --rm -it --image=grafana/k6 -- run /scripts/load-test.js
```

### Staging Testing

```bash
# Deploy to staging
pulumi stack select staging
pulumi up

# Run smoke tests
./scripts/smoke-test.sh staging
```

## 📚 Additional Resources

- [Pulumi Kubernetes Documentation](https://www.pulumi.com/docs/clouds/kubernetes/)
- [Laravel Octane Documentation](https://laravel.com/docs/octane)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [GitOps with ArgoCD](https://argo-cd.readthedocs.io/)

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
