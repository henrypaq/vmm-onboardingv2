#!/bin/bash

# Set timeout for build process (15 minutes)
timeout 900 npm ci && npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully"
    exit 0
else
    echo "Build failed or timed out"
    exit 1
fi
