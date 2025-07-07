# Youth Justice Service Finder - Production Dockerfile
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production && \
    cd frontend && npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Default command
CMD ["npm", "start"]