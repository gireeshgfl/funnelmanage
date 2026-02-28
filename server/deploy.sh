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
    
    echo "Executing remote commands..."
    # NOTE: Ensure 'api-funnel' and 'nameko-funnel' are correct service names and 'ubuntu' user has sudo rights
    ssh -t ubuntu "cd ~/funnelmanagement/server && \
    source venv/bin/activate && \
    echo 'Installing new server package...' && \
    pip install funnel_server-1.0.0-py3-none-any.whl --force-reinstall && \
    echo 'Restarting services...' && \
    sudo systemctl restart api-funnel && \
    sudo systemctl restart nameko-funnel"
else
    echo "Error: dist directory not found!"
    exit 1
fi

echo "Server deployed and service restarted."
