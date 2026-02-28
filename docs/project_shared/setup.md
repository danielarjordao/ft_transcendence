# Environment Setup & Initialization Guide

This document details the exact steps and commands used to initialize the `ft_transcendence` monorepo. If you need to recreate the project, understand how the foundation was built, or set it up on a new machine, follow this guide.

## 1. Project Root & Documentation

We established a monorepo structure to keep both Frontend and Backend together.

- Created the `docs/` folder with subdirectories for `general_planning`, `team_space`, and `technical_specs` to keep files organized.

## 2. Backend Initialization (NestJS + Prisma)

The backend is built with NestJS and uses Prisma as the ORM.

**Commands executed in the root folder:**

```bash
# Generate the NestJS boilerplate (skipping git to keep the root git clean)
npx @nestjs/cli new backend --skip-git --package-manager npm

```

**Commands executed inside the `/backend` folder:**

```bash
# Install Prisma v5 (v7 causes issues with Alpine Linux without extra adapters)
npm install prisma@5 @prisma/client@5

# Initialize Prisma (creates the prisma/schema.prisma and .env files)
npx prisma init

```

*Critical Backend Configurations:*

- **OpenSSL:** Added `RUN apk add --no-cache openssl` to the backend `Dockerfile` to allow Prisma to connect to the database securely from inside the Alpine container.
- **CORS:** Enabled CORS in `backend/src/main.ts` using `app.enableCors()` to allow the frontend to fetch data from the backend API.

## 3. Frontend Initialization (React + Vite + Tailwind CSS)

The frontend is built with React and TypeScript, bootstrapped via Vite. We use Tailwind CSS (v4) for styling.

**Commands executed in the root folder:**

```bash
# Generate the React + TypeScript boilerplate
npm create vite@latest frontend -- --template react-ts

```

**Commands executed inside the `/frontend` folder to setup Tailwind v4:**

```bash
# Install the official Tailwind Vite plugin
npm install -D @tailwindcss/vite

```

*Configuration changes made:*

1. Updated `vite.config.ts` to include the `tailwindcss()` plugin.
2. Cleared the default `src/index.css` and added only: `@import "tailwindcss";`

## 4. Docker Infrastructure & Database Setup

The entire application (Frontend, Backend, and PostgreSQL Database) is containerized using Docker Compose.

**Prerequisites (For Linux/Ubuntu users):**
If you do not have Docker installed, run the following commands:

```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 -y

# Grant your user permission to run Docker without sudo
sudo usermod -aG docker $USER
# Note: You must log out and log back in (or run 'newgrp docker') for the permission to take effect.

```

**How to run the project:**
We use a `Makefile` in the root directory for standard 42 commands.

```bash
# To build and start all containers (Frontend, Backend, Database)
make up

# To stop and remove all containers cleanly
make down

```

**Testing the Infrastructure:**
Once the containers are running, you can test the end-to-end connection:

1. **Frontend:** Access `http://localhost:5173`
2. **Backend API:** Access `http://localhost:3000`
3. **Database Connection:** Run `docker exec -it transcendence_backend npx prisma db push` to sync the schema, then access `http://localhost:3000/db-test` to verify PostgreSQL connectivity.
