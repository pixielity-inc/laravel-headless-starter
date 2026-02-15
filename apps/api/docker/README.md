# Docker Services for Laravel Headless Starter

This directory contains modular Docker Compose configurations for various services. Mix and match services based on your application needs.

## Quick Start

### Option 1: Full Stack (Easiest)
```bash
# Start everything with one command
docker-compose -f docker/docker-compose.full.yml up -d

# Access management UIs:
# - App: http://localhost:8000
# - pgAdmin: http://localhost:5050 (admin@admin.com / admin)
# - MinIO Console: http://localhost:9001 (minioadmin / minioadmin)
# - Mailpit: http://localhost:8025
```

### Option 2: Modular (Recommended for Production)
```bash
# Basic app only
cd docker && docker-compose up -d

# App with specific services
cd docker && docker-compose -f docker-compose.yml \
  -f services/compose.redis.yml \
  -f services/compose.postgres.yml \
  -f services/compose.workers.yml up -d
```

## Management UIs

All database and storage services include web-based management interfaces:

| Service | Management UI | URL | Credentials |
|---------|--------------|-----|-------------|
| PostgreSQL | pgAdmin | http://localhost:5050 | admin@admin.com / admin |
| MySQL | phpMyAdmin | http://localhost:8081 | Uses DB credentials |
| Elasticsearch | ElasticVue | http://localhost:8080 | No auth required |
| MinIO | MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| RabbitMQ | Management UI | http://localhost:15672 | guest / guest |
| Mailpit | Web UI | http://localhost:8025 | No auth required |

## Available Services

### Core Services

#### `docker-compose.yml` - Laravel Application
- **Port**: 8000
- **Description**: Main Laravel application with Octane + FrankenPHP
- **Always required**: Yes

#### `docker-compose.full.yml` - Complete Stack
- **Description**: All services pre-configured for development
- **Use case**: Quick start, development, testing
- **Includes**: App, PostgreSQL, Redis, MinIO, Meilisearch, Mailpit, Reverb, Workers

### Database Services

#### `services/compose.postgres.yml` - PostgreSQL + pgAdmin
- **Ports**: 5432 (PostgreSQL), 5050 (pgAdmin)
- **Description**: Production-grade relational database with web UI
- **Use case**: Primary database for production
- **Management**: http://localhost:5050

#### `services/compose.mysql.yml` - MySQL + phpMyAdmin
- **Ports**: 3306 (MySQL), 8081 (phpMyAdmin)
- **Description**: Alternative relational database with web UI
- **Use case**: If you prefer MySQL over PostgreSQL
- **Management**: http://localhost:8081

#### `services/compose.mongodb.yml` - MongoDB
- **Port**: 27017
- **Description**: NoSQL document database
- **Use case**: Document storage, flexible schemas

### Caching & Sessions

#### `services/compose.redis.yml` - Redis
- **Port**: 6379
- **Description**: In-memory data store
- **Use case**: Caching, sessions, queues
- **Recommended**: Yes for production

### Search Engines

#### `services/compose.meilisearch.yml` - Meilisearch
- **Port**: 7700
- **Description**: Fast, typo-tolerant search
- **Use case**: Full-text search, autocomplete
- **Best for**: Small to medium datasets, simple search

#### `services/compose.elasticsearch.yml` - Elasticsearch + ElasticVue
- **Ports**: 9200 (Elasticsearch), 8080 (ElasticVue)
- **Description**: Advanced search and analytics with web UI
- **Use case**: Complex queries, large datasets, analytics
- **Management**: http://localhost:8080

### Storage

#### `services/compose.minio.yml` - MinIO
- **Ports**: 9000 (API), 9001 (Console)
- **Description**: S3-compatible object storage
- **Use case**: File uploads, media storage
- **Console**: http://localhost:9001

### Message Brokers

#### `services/compose.kafka.yml` - Apache Kafka (KRaft)
- **Port**: 9092
- **Description**: Event streaming platform
- **Use case**: Event sourcing, real-time data pipelines
- **Best for**: High-throughput event streaming

#### `services/compose.rabbitmq.yml` - RabbitMQ
- **Ports**: 5672 (AMQP), 15672 (Management)
- **Description**: Message broker with web UI
- **Use case**: Task queues, pub/sub messaging
- **Management**: http://localhost:15672 (guest/guest)

### Real-time & WebSockets

#### `services/compose.reverb.yml` - Laravel Reverb
- **Port**: 8080
- **Description**: Laravel's official WebSocket server
- **Use case**: Real-time notifications, chat, live updates
- **Native Laravel**: Built specifically for Laravel applications

### Development Tools

#### `services/compose.mailpit.yml` - Mailpit
- **Ports**: 1025 (SMTP), 8025 (Web UI)
- **Description**: Email testing tool
- **Use case**: Test emails without sending
- **Web UI**: http://localhost:8025

### Background Processing

#### `services/compose.workers.yml` - Queue Workers & Scheduler
- **Description**: Background job processing and cron scheduler
- **Services**:
  - `queue-worker`: Processes queued jobs (2 workers by default)
  - `scheduler`: Runs Laravel scheduled tasks every minute
- **Use case**: Background jobs, scheduled tasks, async processing
- **Recommended**: Yes for production

## Common Configurations

### Development Setup
```bash
cd docker
docker-compose -f docker-compose.yml \
  -f services/compose.redis.yml \
  -f services/compose.postgres.yml \
  -f services/compose.mailpit.yml \
  -f services/compose.workers.yml up -d
```

### Production-like Setup
```bash
cd docker
docker-compose -f docker-compose.yml \
  -f services/compose.redis.yml \
  -f services/compose.postgres.yml \
  -f services/compose.minio.yml \
  -f services/compose.meilisearch.yml \
  -f services/compose.workers.yml up -d
```

### Full Stack with All Services
```bash
cd docker
docker-compose -f docker-compose.yml \
  -f services/compose.redis.yml \
  -f services/compose.postgres.yml \
  -f services/compose.minio.yml \
  -f services/compose.meilisearch.yml \
  -f services/compose.kafka.yml \
  -f services/compose.mailpit.yml \
  -f services/compose.reverb.yml \
  -f services/compose.workers.yml up -d
```

## Environment Variables

**Simple approach: Use your existing `.env` file with Docker service names!**

### Quick Setup

```bash
# 1. Copy template (if you don't have .env yet)
cp env/.env.local .env

# 2. Update ONLY these host names for Docker:
DB_HOST=postgres          # Change from 127.0.0.1
REDIS_HOST=redis          # Change from 127.0.0.1
MAIL_HOST=mailpit         # Change from 127.0.0.1 (if using Mailpit)
REVERB_HOST=reverb        # Change from localhost (if using Reverb)

# 3. Start Docker
docker-compose -f docker/docker-compose.full.yml up -d
```

### Docker Service Names (Hosts)

When using Docker, change these hosts in your `.env`:

| Service | Local Host | Docker Host |
|---------|-----------|-------------|
| PostgreSQL | `127.0.0.1` | `postgres` |
| MySQL | `127.0.0.1` | `mysql` |
| Redis | `127.0.0.1` | `redis` |
| MinIO | `127.0.0.1` | `minio` |
| Meilisearch | `127.0.0.1` | `meilisearch` |
| Mailpit | `127.0.0.1` | `mailpit` |
| Reverb | `localhost` | `reverb` |

### Complete Docker Configuration Reference

See `env/.env.docker.example` for all Docker-specific values. Key changes:

```env
# Database
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=redis_password
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Mail (Mailpit)
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025

# Reverb
BROADCAST_CONNECTION=reverb
REVERB_HOST=reverb
REVERB_PORT=8080

# MinIO (optional)
FILESYSTEM_DISK=s3
AWS_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_USE_PATH_STYLE_ENDPOINT=true

# Meilisearch (optional)
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_KEY=masterKey
```

### Switching Between Local and Docker

**Going from Local to Docker:**
```bash
# Change hosts to Docker service names
sed -i '' 's/DB_HOST=127.0.0.1/DB_HOST=postgres/' .env
sed -i '' 's/REDIS_HOST=127.0.0.1/REDIS_HOST=redis/' .env
```

**Going from Docker to Local:**
```bash
# Change hosts back to localhost
sed -i '' 's/DB_HOST=postgres/DB_HOST=127.0.0.1/' .env
sed -i '' 's/REDIS_HOST=redis/REDIS_HOST=127.0.0.1/' .env
```

## Management Commands

```bash
# Start services
cd docker && docker-compose -f docker-compose.yml -f services/compose.redis.yml up -d

# Stop services
cd docker && docker-compose -f docker-compose.yml -f services/compose.redis.yml down

# View logs
cd docker && docker-compose -f docker-compose.yml -f services/compose.redis.yml logs -f

# View logs for specific service
cd docker && docker-compose logs -f redis

# Restart a service
cd docker && docker-compose restart redis

# Remove volumes (WARNING: deletes data)
cd docker && docker-compose -f docker-compose.yml -f services/compose.redis.yml down -v

# Scale queue workers
cd docker && docker-compose -f services/compose.workers.yml up -d --scale queue-worker=4
```

## Service Selection Guide

| Need | Recommended Service |
|------|-------------------|
| Database | PostgreSQL or MySQL |
| Caching | Redis |
| File Storage | MinIO |
| Simple Search | Meilisearch |
| Advanced Search | Elasticsearch |
| Event Streaming | Kafka |
| Task Queues | RabbitMQ or Redis |
| WebSockets | Laravel Reverb |
| Email Testing | Mailpit |
| NoSQL | MongoDB |
| Queue Workers | compose.workers.yml |
| Scheduler | compose.workers.yml |

## Performance Tips

1. **Limit services**: Only run services you actually need
2. **Resource limits**: Add memory/CPU limits in production
3. **Persistent volumes**: Use named volumes for data persistence
4. **Networks**: Services communicate via the `laravel` network
5. **Health checks**: All services include health checks for reliability
6. **Scale workers**: Adjust `QUEUE_WORKERS` based on load

## Troubleshooting

### Port conflicts
If a port is already in use, change it via environment variables:
```env
REDIS_PORT=6380
DB_PORT=5433
PGADMIN_PORT=5051
```

### Permission issues
```bash
chmod -R 775 ../storage
```

### Reset everything
```bash
cd docker
docker-compose -f docker-compose.full.yml down -v
docker-compose -f docker-compose.full.yml up -d
```

### Can't access management UIs
Make sure the services are running:
```bash
cd docker && docker-compose ps
```

### Database connection issues
Ensure the database service is healthy:
```bash
cd docker && docker-compose logs postgres
```

## Production Considerations

1. **Use secrets management** for passwords (Docker secrets, Vault, etc.)
2. **Enable authentication** on all services
3. **Use SSL/TLS** for external connections
4. **Set resource limits** to prevent resource exhaustion
5. **Regular backups** of database volumes
6. **Monitor** service health and performance
7. **Disable debug mode** (`APP_DEBUG=false`)
8. **Use strong passwords** for all services
9. **Restrict network access** using firewall rules
10. **Keep images updated** regularly

## Directory Structure

```
docker/
├── docker-compose.yml          # Base Laravel app
├── docker-compose.full.yml     # Complete stack (all services)
├── Dockerfile                  # Laravel app image
├── services/                   # Modular service files
│   ├── compose.postgres.yml
│   ├── compose.mysql.yml
│   ├── compose.redis.yml
│   ├── compose.minio.yml
│   ├── compose.meilisearch.yml
│   ├── compose.elasticsearch.yml
│   ├── compose.kafka.yml
│   ├── compose.rabbitmq.yml
│   ├── compose.mongodb.yml
│   ├── compose.mailpit.yml
│   ├── compose.reverb.yml
│   └── compose.workers.yml
└── README.md                   # This file
```
