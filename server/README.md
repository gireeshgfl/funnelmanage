# Funnel Management Server

The backend system for the Funnel Management application, built with a microservices architecture using [Nameko](https://nameko.readthedocs.io/) and Python.

## 📋 Prerequisites

Ensure you have the following installed and running:
- **Python**: 3.x
- **RabbitMQ**: (Message Broker) - Required for Nameko / Celery
- **Redis**: (Caching/Storage) - Required for various services
- **MongoDB**: (Primary Database)

## 🛠 Installation

1. Navigate to the server directory:
    ```bash
    cd server
    ```

2. Create and activate a virtual environment (recommended):
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Install the project in editable mode:
    ```bash
    pip install -e .
    ```

## ⚙️ Configuration

Create a `.env` file in the `server` directory. This file should contain all necessary environment variables such as database URIs, secret keys, and service endpoints.

**Note**: Refer to the `.env.example` file (if available) or the project configuration docs (`config.yaml`) to see which variables are required.

## 🚀 Running the Services

The server consists of two main parts: the API Gateway and the Nameko Microservices.

### 1. API Gateway
To run the API Gateway (FastAPI/Flask):

```bash
funnel-api
```
*Check `setup.py` entry points for the exact command if changed.*

### 2. Nameko Services
To run the microservices:

```bash
funnel-nameko
```
*Check `setup.py` entry points for the exact command if changed.*

Alternatively, you can run individual services using the standard Nameko command:
```bash
nameko run <service_module>
```

## 📂 Project Structure

- `/api_gateway`: Contains the HTTP API layer (Routers, Controllers).
- `/nameko_services`: Contains the backend microservices.
- `requirements.txt`: Python dependencies.
- `setup.py`: Package installation script.
