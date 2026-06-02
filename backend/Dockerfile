# ============================================================
# Dockerfile — Backend Fastify (Production)
# Multi-stage build untuk image sekecil mungkin
# ============================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies dulu (layer caching)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production=false

# Generate Prisma Client
RUN npx prisma generate

# Copy source dan build
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Hapus devDependencies
RUN npm prune --production

# ============================================================
# Stage 2: Production Image
# ============================================================
FROM node:20-alpine AS production

# Security: jalankan sebagai non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fastify -u 1001

WORKDIR /app

# Copy dari builder
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/prisma ./prisma

# Copy file yang diperlukan runtime
COPY --chown=fastify:nodejs package.json ./

# Install dumb-init untuk proper signal handling
RUN apk add --no-cache dumb-init curl

USER fastify

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health/ready || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
