#!/bin/bash

# Deploy script for Gately Help Center
# This script builds and deploys the help center to Cloudflare Pages

echo "🚀 Starting deployment..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
npm run deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment successful!"
echo "🎉 Help center deployed successfully!"
