#!/bin/bash
set -e

echo "Starting server deployment process..."

# Ensure we are in the script's directory
cd "$(dirname "$0")"

echo "Building server package..."
python3 -m build

echo "Deploying to remote server..."
# Check if dist directory exists (it should after build)
if [ -d "dist" ]; then
    cd dist
    scp funnel_server-1.0.0-py3-none-any.whl funnel_server-1.0.0.tar.gz ubuntu:/home/ubuntu/funnelmanagement/server/
else
    echo "Error: dist directory not found!"
    exit 1
fi

echo "Server deployment files transferred successfully."
