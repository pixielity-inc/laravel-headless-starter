# 🚀 Laravel Headless Starter - PHP Monorepo

A modern, production-ready Laravel monorepo with Kubernetes infrastructure, built with Turborepo for optimal developer experience and scalability.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Infrastructure](#infrastructure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

This is a **360° production-ready Laravel monorepo** featuring:

- **🏗️ Monorepo Architecture** - Turborepo for efficient task orchestration
- **⚡ High Performance** - Laravel Octane with FrankenPHP
- **☸️ Kubernetes Ready** - Complete infrastructure as code with Pulumi
- **🧪 Testing First** - Pest 4 for elegant testing
- **🎨 Code Quality** - Laravel Pint for consistent formatting
- **🔄 GitOps** - ArgoCD for automated deployments
- **📊 Observability** - Prometheus, Grafana, and Loki
- **🐳 Docker Support** - Multi-stage builds optimized for production

## 🏛️ Architecture

### Monorepo Structure

```
laravel-monorepo/
├── apps/                    # Applications
│   └── api/                # Laravel API application
├── packages/               # Shared packages (future)
├── infrastructure/         # Kubernetes & deployment
│   ├── pulumi/            # Infrastructure as code
│   └── docs/              # Infrastructure documentation
├── turbo.json             # Turborepo configuration
├── pnpm-workspace.yaml    # PNPM workspace config
└── package.json           # Root package scripts
```

### Technology Stack

**Backend:**
- Laravel 12 with PHP 8.2+
- Laravel Octane (FrankenPHP)
- PostgreSQL / MySQL / SQLite
- Redis for caching and queues
- RabbitMQ for message queuing
- Kafka for event streaming

**Infrastructure:**
- Kubernetes (OrbStack/Docker Desktop/EKS/GKE/AKS)
- Pulumi for infrastructure as code
- ArgoCD for GitOps deployments
- Prometheus & Grafana for monitoring
- MinIO/S3 for object storage
- Meilisearch for full-text search

**Development:**
- Turborepo for monorepo management
- PNPM for package management
- Pest 4 for testing
- Laravel Pint for code formatting
- Docker for containerization

## 🚀 Quick Start

### Prerequisites

- **PHP 8.2+** with extensions: `curl`, `mbstring`, `xml`, `zip`, `sqlite3`
- **Composer 2.x**
- **Node.js 18+**
- **PNPM 9+** (install: `npm install -g pnpm`)
- **Docker** (optional, for containerized development)
- **Kubernetes** (optional, for infrastructure deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/pixielity-inc/laravel-headless-starter.git
cd laravel-headless-starter

# Install dependencies (runs composer install automatically)
pnpm install

# Generate application key
cd apps/api
bin/artisan key:generate

# Run migrations
bin/artisan migrate

# Start development server
cd ../..
pnpm dev
```

Your API will be available at `http://localhost:8000`

### Docker Quick Start

```bash
# Build and start all services
cd apps/api
docker-compose -f docker/docker-compose.yml up -d

# Check logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

## 📁 Project Structure

### Root Level

```
.
├── apps/                   # Applications directory
│   └── api/               # Laravel API application
│       ├── app/           # Application code
│       ├── config/        # Configuration files
│       ├── database/      # Migrations, seeders, factories
│       ├── routes/        # API routes
│       ├── tests/         # Pest tests
│       ├── docker/        # Docker configurations
│       ├── docs/          # Application documentation
│       └── environments/           # Environment templates
├── packages/              # Shared packages (future use)
├── infrastructure/        # Infrastructure as code
│   ├── pulumi/           # Kubernetes infrastructure
│   │   ├── src/          # Pulumi TypeScript code
│   │   └── Pulumi.*.yaml # Stack configurations
│   └── docs/             # Infrastructure guides
├── turbo.json            # Turborepo task pipeline
├── pnpm-workspace.yaml   # PNPM workspace definition
└── package.json          # Root scripts and dependencies
```

### Apps Directory

Each app in `apps/` is an independent Laravel application with its own:
- Dependencies (`composer.json`, `package.json`)
- Configuration
- Tests
- Docker setup
- Documentation

### Packages Directory

Shared packages that can be used across multiple apps:
- Common utilities
- Shared models
- API clients
- UI components (future)

## 💻 Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all apps in development mode
pnpm dev:api               # Start API app only

# Building
pnpm build                 # Build all apps
pnpm build:api             # Build API app only

# Testing
pnpm test                  # Run all tests
pnpm test:unit             # Run unit tests only
pnpm test:feature          # Run feature tests only
pnpm test:coverage         # Run tests with coverage

# Code Quality
pnpm lint                  # Lint all code
pnpm lint:fix              # Fix linting issues
pnpm format                # Format code with Pint
pnpm format:check          # Check code formatting
pnpm typecheck             # Run type checking

# Maintenance
pnpm cleanup               # Deep clean (removes all dependencies)
pnpm clean                 # Clean build artifacts
pnpm setup                 # Setup all apps (install dependencies)
```

### Turborepo Task Pipeline

Tasks are orchestrated by Turborepo for optimal performance:

- **Caching**: Build outputs are cached for faster rebuilds
- **Parallelization**: Independent tasks run in parallel
- **Dependencies**: Tasks respect dependency order
- **Incremental**: Only affected packages are rebuilt

See `turbo.json` for complete pipeline configuration.

### Working with the API App

```bash
# Navigate to API app
cd apps/api

# Run Artisan commands
bin/artisan migrate
bin/artisan db:seed
bin/artisan make:controller UserController

# Run tests
bin/artisan test
# or
vendor/bin/pest

# Format code
vendor/bin/pint

# Start Octane server
bin/artisan octane:start --watch
```

### Environment Configuration

Environment files are organized in `apps/api/environments/`:

```bash
# Development (default)
ln -sf environments/.env.example .env

# Docker
ln -sf environments/.env.docker .env

# Production
ln -sf environments/.env.production .env
```

See `apps/api/environments/.env.example` for all available configuration options.

## ☸️ Infrastructure

### Kubernetes Deployment

Complete Kubernetes infrastructure with Pulumi:

```bash
# Navigate to infrastructure
cd infrastructure/pulumi

# Install dependencies
npm install

# Login to Pulumi
pulumi login --local

# Select stack
pulumi stack select dev

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

### Infrastructure Components

- **Laravel Application** - Web, Worker, and Reverb pods
- **Databases** - PostgreSQL, Redis
- **Message Queues** - RabbitMQ, Kafka
- **Storage** - MinIO (S3-compatible)
- **Search** - Meilisearch
- **Monitoring** - Prometheus, Grafana, Loki
- **GitOps** - ArgoCD for automated deployments
- **Ingress** - NGINX Ingress Controller

See [infrastructure/README.md](infrastructure/README.md) for detailed documentation.

### Local Kubernetes (OrbStack)

```bash
# Start OrbStack Kubernetes
# Infrastructure will be available at *.k8s.orb.local

# Deploy
cd infrastructure/pulumi
pulumi up

# Access services
# - Laravel: http://laravel.k8s.orb.local
# - Mailpit: http://mailpit.k8s.orb.local:8025
# - RabbitMQ: http://rabbitmq.k8s.orb.local:15672
# - Grafana: http://grafana.k8s.orb.local
```

### Managing Kubernetes with K9s

```bash
# Install K9s
brew install k9s

# Launch K9s
k9s -n laravel-dev

# See infrastructure/docs/K9S_GUIDE.md for detailed usage
```

## 🧪 Testing

### Running Tests

```bash
# All tests
pnpm test

# Specific test suite
pnpm test:unit
pnpm test:feature

# With coverage
pnpm test:coverage

# Watch mode (in apps/api)
cd apps/api
bin/artisan test --watch
```

### Writing Tests

Tests are written with Pest 4:

```php
<?php

use App\Models\User;

test('user can be created', function () {
    $user = User::factory()->create();
    
    expect($user)
        ->toBeInstanceOf(User::class)
        ->email->toBeString();
});

test('user can login', function () {
    $user = User::factory()->create();
    
    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);
    
    $response->assertOk();
});
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build production image
cd apps/api
docker build -f docker/Dockerfile -t laravel-api:latest .

# Run container
docker run -p 8000:8000 laravel-api:latest
```

### Kubernetes Deployment

```bash
# Deploy with Pulumi
cd infrastructure/pulumi
pulumi up --yes

# Or with ArgoCD (GitOps)
kubectl apply -f infrastructure/argocd/application.yaml
```

### CI/CD Pipeline

GitHub Actions workflow for automated deployments:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup PNPM
        uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test
      - name: Build
        run: pnpm build
      - name: Deploy
        run: pnpm deploy
```

## 📊 Monitoring

### Application Metrics

- **Laravel Octane** - Request rate, response time, memory usage
- **Queue Workers** - Job processing time, failure rate
- **Database** - Query performance, connection pool

### Infrastructure Metrics

- **Kubernetes** - Pod health, resource usage, scaling events
- **Services** - Redis, PostgreSQL, RabbitMQ metrics
- **Network** - Ingress traffic, service mesh

### Accessing Dashboards

```bash
# Grafana (local)
kubectl port-forward svc/grafana 3000:3000 -n laravel-dev
# Open: http://localhost:3000

# Prometheus (local)
kubectl port-forward svc/prometheus 9090:9090 -n laravel-dev
# Open: http://localhost:9090
```

## 🔧 Troubleshooting

### Common Issues

**Composer install fails:**
```bash
# Clear composer cache
composer clear-cache
composer install
```

**Turbo not found:**
```bash
# Install turbo globally
pnpm install -g turbo

# Or use npx
npx turbo run dev
```

**Pods not starting:**
```bash
# Check pod logs
kubectl logs -n laravel-dev -l app=laravel-web

# Describe pod
kubectl describe pod -n laravel-dev <pod-name>

# Use K9s for easier debugging
k9s -n laravel-dev
```

**Port already in use:**
```bash
# Find process using port
lsof -ti:8000

# Kill process
kill -9 $(lsof -ti:8000)
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](apps/api/CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Format code: `pnpm format`
6. Commit changes: `git commit -m '✨ Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Commit Convention

We use conventional commits with emojis:

- ✨ `:sparkles:` - New feature
- 🐛 `:bug:` - Bug fix
- 📝 `:memo:` - Documentation
- 🎨 `:art:` - Code style/formatting
- ♻️ `:recycle:` - Refactoring
- ⚡ `:zap:` - Performance improvement
- 🔧 `:wrench:` - Configuration
- 🚀 `:rocket:` - Deployment

## 📚 Documentation

- [API Documentation](apps/api/README.md)
- [Infrastructure Guide](infrastructure/README.md)
- [K9s Guide](infrastructure/docs/K9S_GUIDE.md)
- [Deployment Summary](infrastructure/docs/DEPLOYMENT_SUMMARY.md)
- [Laravel Octane Guide](apps/api/docs/OCTANE.md)
- [Environment Configuration](apps/api/environments/README.md)

## 📄 License

This project is open-sourced software licensed under the [MIT license](LICENSE).

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The PHP framework
- [Turborepo](https://turbo.build) - Monorepo build system
- [Pulumi](https://pulumi.com) - Infrastructure as code
- [ArgoCD](https://argo-cd.readthedocs.io) - GitOps continuous delivery
- [K9s](https://k9scli.io) - Kubernetes CLI

---

**Built with ❤️ by Pixielity Inc.**
