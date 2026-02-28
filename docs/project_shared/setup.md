# Environment Setup & Initialization Guide

This document details the exact steps and commands used to initialize the `ft_transcendence` monorepo. If you need to recreate the project or understand how the foundation was built, follow this guide.

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
# Install Prisma as a development dependency
npm install prisma --save-dev

# Initialize Prisma (creates the prisma/schema.prisma and .env files)
npx prisma init

```

## 3. Frontend Initialization (React + Vite)

The frontend is built with React and TypeScript, bootstrapped via Vite for faster performance.

**Commands executed in the root folder:**

```bash
# Generate the React + TypeScript boilerplate
npm create vite@latest frontend -- --template react-ts

```

Excelente ideia! Documentar esse ajuste da versão nova do Tailwind vai poupar muita dor de cabeça para o Lucas quando ele for mexer no código. Manter a documentação viva é a melhor prática possível.

Abra o seu arquivo `docs/general_planning/environment_setup.md` e substitua a seção **3. Frontend Initialization** e o **Next Steps** por este texto atualizado:

```markdown
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

**Configuration changes made:**

1. Updated `vite.config.ts` to include the `tailwindcss()` plugin.
2. Cleared the default `src/index.css` and added only: `@import "tailwindcss";`

## Next Steps (Pending)

- [ ] Configure Docker and `docker-compose.yml` in the root directory.
- [ ] Connect Prisma to the local PostgreSQL database via Docker.

# 1. Atualize a lista de pacotes do sistema
sudo apt update

# 2. Instale o Docker e o plugin do Docker Compose
sudo apt install docker.io docker-compose-v2 -y

# 3. Dê permissão para o seu usuário rodar o Docker (evita ter que usar 'sudo' toda hora)
sudo usermod -aG docker $USER
