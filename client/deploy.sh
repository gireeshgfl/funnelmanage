#!/bin/bash
set -e

echo "Starting deployment process..."

# Ensure we are in the script's directory
cd "$(dirname "$0")"

echo "Building application..."
npm run build

echo "Creating deploy_bundle directory..."
mkdir -p deploy_bundle

echo "Compressing application files..."
tar -czf funnel_next.tar.gz .next public package.json middleware.js next.config.js config.js

echo "Moving application archive to deploy_bundle..."
mv funnel_next.tar.gz deploy_bundle/

echo "Compressing node_modules..."
tar -czf funnel_nodemodules.tar.gz node_modules

echo "Moving node_modules archive to deploy_bundle..."
mv funnel_nodemodules.tar.gz deploy_bundle/

echo "Deploying to remote server..."
cd deploy_bundle
scp funnel_next.tar.gz ubuntu:~/funnelmanagement/client/
scp funnel_nodemodules.tar.gz ubuntu:~/funnelmanagement/client/

echo "Deployment files transferred successfully."
