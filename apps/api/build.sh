#!/bin/bash
set -e

echo "🔨 Building workspace packages..."

# Navigate to root directory
cd "$(dirname "$0")/../.."

# Build packages in correct order
echo "📦 Building @repo/db..."
cd packages/db
pnpm db:generate
pnpm build
cd ../..

echo "📦 Building @repo/types..."
cd packages/types
pnpm build
cd ../..

echo "📦 Building @repo/utils (if exists)..."
if [ -d "packages/utils" ]; then
  cd packages/utils
  pnpm build || echo "⚠️  @repo/utils build skipped (no build script)"
  cd ../..
fi

echo "📦 Building API..."
cd apps/api
pnpm build

echo "✅ Build complete!"

