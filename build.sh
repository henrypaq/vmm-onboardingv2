#!/bin/bash

# Set timeout for build process (15 minutes)
set -e

echo "Starting build process..."

# Clean install dependencies
echo "Installing dependencies..."
npm ci

# Run build
echo "Building application..."
npm run build

echo "Build completed successfully"
