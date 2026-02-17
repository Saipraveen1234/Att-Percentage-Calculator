# Use Node.js LTS (Long Term Support) version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy Prisma schema and config
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the API port
EXPOSE 3001

# Run database migrations and start the server
CMD npx prisma migrate deploy && npm start
