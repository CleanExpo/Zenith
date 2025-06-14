# Multi-stage build for backend
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/agents/package.json ./packages/agents/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build the application
RUN npm run build --workspace=@zenith/backend

# Production image, copy all the files and run the application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 zenith

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/agents/dist ./packages/agents/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy Prisma schema and generated client
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

USER zenith

EXPOSE 3001

ENV PORT=3001

# Start the application
CMD ["node", "dist/server.js"]