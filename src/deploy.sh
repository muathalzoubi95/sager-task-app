#!/bin/bash

# Deployment script for drone tracking application
set -e

echo "🚀 Starting deployment build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running type checks..."
npm run check

# Build for production
echo "🏗️  Building application for production..."
npm run build

# Verify build output
echo "✅ Verifying build output..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Server build failed - dist/index.js not found"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "❌ Frontend build failed - dist/public/ not found"
    exit 1
fi

echo "🎉 Deployment build completed successfully!"
echo "📁 Built files:"
echo "   - Frontend: $(du -sh dist/public/ 2>/dev/null | cut -f1) in dist/public/"
echo "   - Server: $(du -sh dist/index.js 2>/dev/null | cut -f1) at dist/index.js"
echo ""
echo "🌐 Ready for deployment!"
echo "   • Run command: npm start"
echo "   • Port: 5000"
echo "   • Environment: production"