# Backend Dockerfile
FROM node:22.16.0-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S zenith -u 1001

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./backend/
COPY packages/database/package*.json ./packages/database/
COPY packages/agents/package*.json ./packages/agents/

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY apps/backend ./backend
COPY packages ./packages

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build TypeScript
RUN cd backend && npm run build

# Change ownership to non-root user
RUN chown -R zenith:nodejs /app

# Development stage
FROM base AS development
USER zenith
EXPOSE 3001
CMD ["dumb-init", "npm", "run", "dev", "--prefix", "backend"]

# Production stage
FROM base AS production

# Remove development dependencies and unnecessary files
RUN npm prune --production && \
    rm -rf backend/src && \
    rm -rf packages/*/src && \
    npm cache clean --force

# Switch to non-root user
USER zenith

# Expose port
EXPOSE 3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application with dumb-init
CMD ["dumb-init", "npm", "start", "--prefix", "backend"]