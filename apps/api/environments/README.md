# Environment Configuration Files

This directory contains environment configuration templates for different deployment scenarios.

## Quick Start

**Standard Laravel approach - ONE active `.env` file:**

```bash
# Local development
cp environments/.env.local .env
bin/artisan key:generate

# Docker development  
cp environments/.env.local .env
# Then update DB_HOST=postgres, REDIS_HOST=redis (see .env.docker.example)

# Production
cp environments/.env.production .env
# Then configure with real credentials
```

## Available Environment Files

### `.env` - Active Environment (gitignored)
Your actual environment file. Copy from a template and customize.

### `.env.example` - Universal Template
Works for both local and Docker. Contains all variables with smart defaults and comments showing local vs Docker values.

### `.env.local` - Local Development Template
Pre-configured for local development:
- SQLite database
- File-based caching
- Email logging
- Debug mode enabled

### `.env.production` - Production Template  
Pre-configured for production:
- PostgreSQL/MySQL database
- Redis caching
- Real email service
- Debug mode disabled
- Security optimized

### `.env.testing` - Testing (auto-used by Laravel)
Pre-configured for tests:
- In-memory SQLite
- Array cache/sessions
- Mocked services

### `.env.docker.example` - Docker Quick Reference
Shows ONLY the variables you need to change for Docker (host names). Not a full env file - just a reference guide.

## Docker Setup

**No separate Docker env file needed!** Just update host names in your `.env`:

```bash
# 1. Start with local template
cp environments/.env.local .env

# 2. Change these hosts to Docker service names:
DB_HOST=postgres          # was: 127.0.0.1
REDIS_HOST=redis          # was: 127.0.0.1  
MAIL_HOST=mailpit         # was: 127.0.0.1
REVERB_HOST=reverb        # was: localhost

# 3. Start Docker
docker-compose -f docker/docker-compose.yml up -d
```

See `environments/.env.docker.example` for all Docker-specific values.

## File Structure

```
environments/
├── .env                    # Active (gitignored, you create this)
├── .env.example            # Universal template
├── .env.local              # Local development template
├── .env.production         # Production template
├── .env.testing            # Testing template (auto-used)
├── .env.docker.example     # Docker overrides reference
└── README.md               # This file
```

## Why This Approach?

✅ **No redundancy** - One `.env` file for all environments  
✅ **Standard Laravel** - Follows Laravel conventions  
✅ **Clear templates** - Each template for specific use case  
✅ **Docker-friendly** - Just change host names, everything else same  
✅ **Easy to maintain** - Update one template, not multiple files

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
- [ ] Set `APP_KEY` (run `bin/artisan key:generate`)
- [ ] Configure database credentials
- [ ] Set up Redis connection
- [ ] Configure mail service
- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Configure AWS credentials (if using S3/SES)
- [ ] Set proper `APP_URL`
- [ ] Enable HTTPS (`OCTANE_HTTPS=true`)
- [ ] Run `composer optimize`
