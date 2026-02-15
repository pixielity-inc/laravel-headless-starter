# Laravel Headless Starter

A modern, headless Laravel 12 starter template for building robust APIs. Perfect for decoupled applications, mobile backends, and microservices.

## Features

- 🚀 Laravel 12 with PHP 8.2+
- ⚡ Laravel Octane with FrankenPHP for blazing-fast performance
- 🧪 Pest 4 for testing
- 🎨 Laravel Pint for code formatting
- 🔧 Laravel Boost for enhanced development
- 📦 SQLite database (easily switchable)
- 🐳 Docker support with FrankenPHP
- 🔥 HTTP/2 and HTTP/3 ready
- 📁 Organized project structure (docs/, docker/, environments/)

## Quick Start

```bash
# Use this template on GitHub (click "Use this template" button)
# Or clone your new repository
git clone https://github.com/YOUR_USERNAME/your-project-name.git
cd your-project-name

# Setup environment (symlink is already created)
bin/artisan key:generate

# Install dependencies and setup
composer setup

# Start development server with Octane (recommended)
composer dev

# Or with queue worker and logs
composer dev:full

# Or use traditional Laravel server
composer dev:traditional
```

## Running with Docker

```bash
# Build and start with Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# Your API will be available at http://localhost:8000
```

## Available Commands

### Development
```bash
composer dev                 # Start Octane with file watching (recommended)
composer dev:full            # Octane + queue worker + log viewer
composer dev:traditional     # Traditional Laravel server (bin/artisan serve)
composer test                # Run Pest tests
vendor/bin/pint              # Format code with Laravel Pint
```

### Production
```bash
composer octane:prod         # Start Octane in production mode (with caching)
composer optimize            # Cache configs, routes, views, and events
composer optimize:clear      # Clear all caches
```

### Octane Management
```bash
composer octane:reload       # Reload Octane workers (zero-downtime)
composer octane:stop         # Stop Octane server
bin/artisan octane:status    # Check Octane status
```

## Performance

With Octane + FrankenPHP, expect:
- 10-20x faster response times vs traditional PHP-FPM
- HTTP/2 and HTTP/3 support out of the box
- Efficient memory usage with worker recycling
- Zero-downtime deployments with `octane:reload`

See [docs/OCTANE.md](docs/OCTANE.md) for detailed configuration and tuning guide.

## Environment Configuration

Environment files are organized in the `environments/` directory:

- **`environments/.env`** - Active environment (symlinked to root `.env`)
- **`environments/.env.local`** - Local development template
- **`environments/.env.production`** - Production deployment template
- **`environments/.env.testing`** - Automated testing configuration
- **`environments/.env.example`** - Example template for new developers

### Switching Environments

```bash
# For local development (default)
ln -sf environments/.env.local .env

# For production
ln -sf environments/.env.production .env
bin/artisan key:generate
composer optimize

# For testing (automatic when running tests)
# Laravel uses environments/.env.testing automatically
```

See [environments/README.md](environments/README.md) for detailed environment configuration guide.

## Testing

```bash
composer test
```

## Code Formatting

```bash
vendor/bin/pint
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

- `main` branch - Stable releases
- `develop` branch - Active development

## License

Open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
