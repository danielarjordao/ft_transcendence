# Uses the same lightweight Node.js version
FROM node:20-alpine

# Sets the working directory
WORKDIR /app

# Copies the package files first
COPY package*.json ./

# Installs React/Vite dependencies
RUN npm install

# Copies the rest of the frontend code
COPY . .

# Exposes the default Vite port
EXPOSE 5173

# "--host" is required in Docker so your browser can access Vite from your machine
CMD ["npm", "run", "dev", "--", "--host"]
