# Deployment Overview

This document outlines the deployment process for the Funnel Management System. The project uses automated shell scripts to build, package, and deploy both the Next.js client and the Python backend to a remote Ubuntu server.

## 📋 Prerequisites

Before deploying, ensure you have:

1.  **SSH Access**: Password-less SSH access to the remote server configured for the user `ubuntu`.
    -   You should be able to run `ssh ubuntu@<remote-ip>` without entering a password.
2.  **Permissions**: The `ubuntu` user on the remote server must have sudo privileges to restart systemd services (`api-funnel`, `nameko-funnel`) and PM2 processes.
3.  **Local Environment**:
    -   **Node.js & npm** (for building the client)
    -   **Python 3 & pip** (for building the server)
    -   **build** package (`pip install build`)

## 🚀 Quick Deployment

To deploy the entire stack (Client + Server) at once, run the master deployment script from the project root:

```bash
./deploy_all.sh
```

This script will sequentially:
1.  Trigger the **Client Deployment**.
2.  Trigger the **Server Deployment**.

## 🔄 Deployment Flow

### Client Deployment
*Script: `./client/deploy.sh`*
1.  Builds the Next.js application (`npm run build`).
2.  Archives the `.next` build folder, `public` assets, and `node_modules`.
3.  Transfers archives to the remote server via SCP.
4.  Extracts files on the server and restarts the PM2 process (`funnel-client`).

### Server Deployment
*Script: `./server/deploy.sh`*
1.  Builds a Python Wheel package (`funnel_server-1.0.0-py3-none-any.whl`).
2.  Transfers the wheel to the remote server via SCP.
3.  Installs the package into the remote virtual environment.
4.  Restarts the systemd services:
    -   `api-funnel` (API Gateway)
    -   `nameko-funnel` (Microservices)

## 📖 Detailed Guide

For a manual step-by-step breakdown and infrastructure setup details, please refer to the **[Detailed Deployment Guide](./DEPLOYMENT_GUIDE.md)**.


