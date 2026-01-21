# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Copy source code
COPY . .

# Install dependencies
RUN rm -rf node_modules && npm install && npm install -D @rollup/rollup-linux-arm64-musl


# Generate Prisma Client
RUN npm run prisma:generate

# Build the server application
RUN npm run build:server

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server/index.js"]
