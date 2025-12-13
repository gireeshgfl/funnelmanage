# Funnel Management Client

The frontend application for the Funnel Management System, built with [Next.js](https://nextjs.org/) and React.

## 📋 Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Project was tested with active LTS versions)
- npm, yarn, pnpm, or bun

## 🛠 Installation

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
# or
yarn install
# or
pnpm install
```

## ⚙️ Configuration

Create a `.env.local` file in the root of the `client` directory to store environment variables. You can refer to `.env.example` if it exists, or consult the project lead for required keys.

## 🚀 Development

To start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The application will launch on port **3001** (configured in package.json):
[http://localhost:3001](http://localhost:3001)

## 📦 Build for Production

To build the application for production usage:

```bash
npm run build
```

Then start the production server:

```bash
npm start
```

## 📂 Project Structure

- `/components`: Reusable UI components.
- `/pages`: Next.js pages and routes (if using Pages Router).
- `/app`: Next.js App Router (if using App Router).
- `/public`: Static assets.
- `/lib` or `/utils`: Utility functions and helpers.
