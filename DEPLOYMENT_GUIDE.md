# detailed Deployment Guide

This document provides a step-by-step technical breakdown of the deployment process. Use this if the automated scripts fail or if you need to configure a new server from scratch.

## 1. Client Deployment (Next.js)

### Build Process
The client deployment script (`client/deploy.sh`) performs the following:
1.  **Build**: Runs `npm run build` to generate the production optimized `.next` folder.
2.  **Bundle**: Creates a tarball `funnel_next.tar.gz` containing:
    -   `.next/` (Build output)
    -   `public/` (Static assets)
    -   `package.json`, `middleware.js`, `next.config.js`, `config.js`
3.  **Dependencies**: Archives `node_modules` separately into `funnel_nodemodules.tar.gz` to speed up transfers (optional if modules usually don't change).

### Manual Deployment Steps
If you need to deploy manually:

1.  **Build Local**:
    ```bash
    cd client
    npm install
    npm run build
    ```
2.  **Copy Files**: Use SCP to transfer files to the server.
    ```bash
    scp -r .next public package.json ubuntu@<remote-ip>:~/funnelmanagement/client/
    ```
3.  **Install/Prune Remote**:
    ```bash
    ssh ubuntu@<remote-ip>
    cd funnelmanagement/client
    npm install --production
    ```
4.  **Restart via PM2**:
    ```bash
    pm2 restart funnel-client
    ```

## 2. Server Deployment (Python/Nameko)

### Build Process
The server deployment script (`server/deploy.sh`) uses Python's `build` module:
1.  **Clean Build**: It's good practice to clear `dist/` before building.
2.  **Wheel Creation**: `python3 -m build` creates a standard `.whl` file in `dist/`.

### Manual Deployment Steps

1.  **Build Wheel**:
    ```bash
    cd server
    python3 -m build
    ```
2.  **Transfer Wheel**:
    ```bash
    scp dist/*.whl ubuntu@<remote-ip>:~/funnelmanagement/server/
    ```
3.  **Install Remote**:
    ```bash
    ssh ubuntu@<remote-ip>
    cd funnelmanagement/server
    source venv/bin/activate
    pip install funnel_server-1.0.0-py3-none-any.whl --force-reinstall
    ```
4.  **Restart Services**:
    ```bash
    sudo systemctl restart api-funnel
    sudo systemctl restart nameko-funnel
    ```

## 3. Server Configuration Reference

### Systemd Services
### Systemd Services
To keep the application running in the background and starting on boot, you should configure Systemd services for both the API Gateway and the Nameko Microservices.

**Services to create:**
1.  **Unique Service Names**: Create files like `api-funnel.service` and `nameko-funnel.service` in `/etc/systemd/system/`.
2.  **Configuration Requirements**:
    -   **User**: Set `User=ubuntu` (or your service user) to ensure file permissions are correct.
    -   **WorkingDirectory**: Point to the server root (e.g., `/home/ubuntu/funnelmanagement/server`).
    -   **ExecStart**: Command to run the service using the virtual environment python (e.g., `.../venv/bin/funnel-api`).
    -   **Environment**: For Nameko, set `PYTHONUNBUFFERED=1` to see logs in real-time.
    -   **Restart**: Set `Restart=always` to ensure high availability.
    -   **After**: Ensure services start after `network.target`, `rabbitmq-server.service`, and `redis.service`.

Once created, enable and start them:
```bash
sudo systemctl enable api-funnel nameko-funnel
sudo systemctl start api-funnel nameko-funnel
```


### Nginx Configuration (Client Proxy)
Typical Nginx block to serve the Next.js app on port 80/443.

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
