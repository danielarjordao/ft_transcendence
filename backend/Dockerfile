# Uses a lightweight Node.js version
FROM node:20-bookworm-slim

# Sets the working directory inside the container
WORKDIR /app

# Copies dependency files first so npm install can be cached separately
COPY package*.json ./

# Installs dependencies before copying the rest of the project
RUN npm install

# Copies Prisma schema after dependencies so Prisma changes do not force reinstalling packages
COPY prisma ./prisma/
RUN npx prisma generate

# Copies the rest of your source code into the container
COPY . .

# Exposes the default NestJS port
EXPOSE 3000

# Starts the server with hot-reload (API updates automatically when you save changes)
CMD ["npm", "run", "start:dev"]
