#!/bin/bash
set -e

echo "Starting full stack deployment..."

echo "=========================================="
echo "Deploying Client..."
echo "=========================================="
./client/deploy.sh

echo ""
echo "=========================================="
echo "Deploying Server..."
echo "=========================================="
./server/deploy.sh

echo ""
echo "=========================================="
echo "Full stack deployment completed successfully!"
echo "=========================================="
