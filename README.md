# Funnel Management System

Welcome to the Funnel Management System project. This is a full-stack application designed to manage funnels, leveraging a modern React-based frontend and a robust Python microservices backend.

## 🏗 Architecture Overview

The project is structured as a monorepo containing:

- **Client (`/client`)**: A [Next.js](https://nextjs.org/) web application serving as the frontend user interface.
- **Server (`/server`)**: A backend system built with [Python](https://www.python.org/) and [Nameko](https://nameko.readthedocs.io/), utilizing a microservices architecture.

## 🚀 Quick Start

To get started with development, you will need to set up both the client and server environments. Please refer to the specific README files in each directory for detailed instructions:

- [**Frontend Documentation**](./client/README.md): Setup instructions for the Next.js client.
- [**Backend Documentation**](./server/README.md): Setup instructions for the Python/Nameko microservices.

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Language**: JavaScript/TypeScript
- **Styling**: CSS Modules / Tailwind (check client config)

### Backend
- **Framework**: Nameko (Microservices), FastAPI/Flask (API Gateway)
- **Language**: Python 3.x
- **Database**: MongoDB, Redis
- **Message Broker**: RabbitMQ
