#!/bin/bash

# Laravel Octane Production Startup Script
# This script ensures proper initialization before starting Octane

set -e

echo "🚀 Starting Laravel Octane with FrankenPHP..."

# Run optimizations
echo "⚡ Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Ensure storage is writable
echo "📁 Setting permissions..."
chmod -R 775 storage bootstrap/cache

# Start Octane
echo "🔥 Starting Octane server..."
php artisan octane:start \
    --server=frankenphp \
    --host=0.0.0.0 \
    --port="${OCTANE_PORT:-8000}" \
    --workers="${OCTANE_WORKERS:-auto}" \
    --max-requests="${OCTANE_MAX_REQUESTS:-500}"
