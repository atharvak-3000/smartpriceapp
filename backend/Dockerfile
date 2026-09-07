# Build and Production Dockerfile for SmartPrice Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json tsconfig.json ./
RUN npm install

# Copy application source code
COPY src/ ./src/

# Compile TypeScript to JavaScript
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm install --only=production

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory with correct permissions
RUN mkdir -p uploads/products

# Expose default backend port
EXPOSE 5000

# Start server
CMD ["node", "dist/server.js"]
