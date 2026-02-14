# Environment Configuration Files

This directory contains environment configuration templates for different deployment scenarios.

## Available Environments

### `.env.local` - Local Development
For local development on your machine. Includes:
- SQLite database for simplicity
- File-based caching and sessions
- Email logging (no actual sending)
- Debug mode enabled
- Octane with file watching

**Setup:**
```bash
cp env/.env.local .env
php artisan key:generate
php artisan migrate
composer dev
```

### `.env.production` - Production Deployment
For production servers. Optimized for:
- MySQL/PostgreSQL database
- Redis for caching and queues
- Real email sending (SMTP/SES)
- Debug mode disabled
- Enhanced security settings
- Optimized Octane configuration

**Setup:**
```bash
cp env/.env.production .env
# Edit .env with your production credentials
php artisan key:generate
php artisan migrate --force
composer octane:prod
```

### `.env.testing` - Automated Testing
For running PHPUnit/Pest tests. Features:
- In-memory SQLite database
- Array-based cache and sessions
- Mocked email sending
- Fast bcrypt rounds
- Minimal logging

**Note:** Laravel automatically uses `.env.testing` when running tests.

## Security Best Practices

1. **Never commit actual credentials** - These files are templates only
2. **Use environment-specific secrets** - Different keys for each environment
3. **Rotate credentials regularly** - Especially in production
4. **Use secret management tools** - AWS Secrets Manager, HashiCorp Vault, etc.
5. **Restrict file permissions** - `chmod 600 .env` on production servers
6. **Use strong passwords** - For database, Redis, and other services

## Environment Variables Priority

Laravel loads environment variables in this order:
1. System environment variables
2. `.env` file in project root
3. `.env.testing` (when running tests)

## Adding New Variables

When adding new environment variables:
1. Add to all three template files with appropriate defaults
2. Document the variable with comments
3. Update this README if it's a significant change
4. Never commit sensitive values

## Deployment Checklist

Before deploying to production:
- [ ] Copy `.env.production` to `.env`
- [ ] Set `APP_KEY` (run `php artisan key:generate`)
- [ ] Configure database credentials
- [ ] Set up Redis connection
- [ ] Configure mail service
- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Configure AWS credentials (if using S3/SES)
- [ ] Set proper `APP_URL`
- [ ] Enable HTTPS (`OCTANE_HTTPS=true`)
- [ ] Run `composer optimize`
