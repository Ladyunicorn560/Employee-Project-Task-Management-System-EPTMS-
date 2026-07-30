# syntax=docker/dockerfile:1

# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

LABEL maintainer="EPTMS Architecture Team <admin@eptms.com>"
LABEL description="EPTMS Backend API – Employee Project & Task Management System"

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for any build steps)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling (PID 1)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S eptms && \
    adduser  -u 1001 -S eptms -G eptms

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy application source from builder
COPY --from=builder /app/src       ./src
COPY --from=builder /app/server.js ./server.js

# Create log directory with correct ownership
RUN mkdir -p logs && chown -R eptms:eptms /app

# Switch to non-root user
USER eptms

# Expose API port
EXPOSE 5000

# Health check – verify API responds within 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health | grep -q '"status":200' || exit 1

# Use dumb-init to handle signals, start server
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
