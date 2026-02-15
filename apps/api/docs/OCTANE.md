# Laravel Octane Configuration Guide

This template uses Laravel Octane with FrankenPHP for high-performance API serving.

## Why FrankenPHP?

- Native PHP 8.4 support with modern features
- Built-in HTTP/2 and HTTP/3 support
- Excellent performance without complex setup
- Easy Docker deployment
- Active Laravel community support

## Production Configuration

### Environment Variables

```env
OCTANE_SERVER=frankenphp
OCTANE_HTTPS=false
OCTANE_WORKERS=auto          # Or set specific number (e.g., 4)
OCTANE_MAX_REQUESTS=500      # Restart worker after N requests
OCTANE_TASK_WORKERS=0        # Background task workers
OCTANE_WATCH=false           # Disable in production
```

### Worker Configuration

- **Development**: Use `auto` or 1-2 workers
- **Production**: Set based on CPU cores (typically CPU cores × 2)
- **High Traffic**: Monitor and adjust based on load

### Memory Management

The configuration includes:
- Garbage collection at 100MB threshold
- Worker restart after 500 requests (prevents memory leaks)
- Database connection cleanup after each operation
- Temporary container instance flushing

## Starting Octane

### Development

```bash
# With file watching (auto-reload)
php artisan octane:start --watch

# Specific workers
php artisan octane:start --workers=2 --watch
```

### Production

```bash
# Using the startup script (recommended)
composer octane:prod

# Or manually with custom settings
php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=8000
```

### Docker

```bash
docker-compose up -d
```

## Performance Tips

1. **Enable OPcache** in production (included in Dockerfile)
2. **Cache configurations** before starting:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
3. **Use Redis** for cache/sessions in production
4. **Monitor memory** and adjust `OCTANE_MAX_REQUESTS` if needed
5. **Database connections**: Enabled `DisconnectFromDatabases` listener

## Monitoring

```bash
# Check Octane status
php artisan octane:status

# Reload workers (zero-downtime)
php artisan octane:reload

# Stop Octane
php artisan octane:stop
```

## Common Issues

### Memory Leaks
- Increase `OCTANE_MAX_REQUESTS` to restart workers more frequently
- Enable `CollectGarbage` listener (already enabled)

### Database Connections
- `DisconnectFromDatabases` is enabled to prevent stale connections
- Use connection pooling for high-traffic scenarios

### File Uploads
- `FlushUploadedFiles` is enabled to clean up after requests
- Ensure `storage/app` has proper permissions

## Benchmarking

Test your API performance:

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/endpoint

# Using wrk
wrk -t4 -c100 -d30s http://localhost:8000/api/endpoint
```

## Scaling

For horizontal scaling:
1. Use a load balancer (nginx, HAProxy)
2. Deploy multiple Octane instances
3. Share sessions via Redis/database
4. Use centralized cache (Redis)

## Security

- Set `OCTANE_HTTPS=true` behind HTTPS proxy
- Use environment-specific `.env` files
- Never expose Octane directly; use reverse proxy
- Implement rate limiting (Laravel's built-in)
