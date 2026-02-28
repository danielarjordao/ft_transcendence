# Uses a lightweight Node.js version
FROM node:20-alpine

# Installs OpenSSL required by Prisma
RUN apk add --no-cache openssl

# Sets the working directory inside the container
WORKDIR /app

# Copies ONLY the dependency files first (makes Docker build faster)
COPY package*.json ./
COPY prisma ./prisma/

# Installs dependencies and prepares the Prisma client
RUN npm install
RUN npx prisma generate

# Copies the rest of your source code into the container
COPY . .

# Exposes the default NestJS port
EXPOSE 3000

# Starts the server with hot-reload (API updates automatically when you save changes)
CMD ["npm", "run", "start:dev"]
