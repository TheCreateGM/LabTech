# Multi-stage build for frontend (Ionic/Angular)
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build Angular application for production
RUN npm run build -- --configuration production

# Stage 2: Production with Nginx
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/www /usr/share/nginx/html

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
