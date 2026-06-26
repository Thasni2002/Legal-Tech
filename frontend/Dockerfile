# =============================================================
# LegalTech Frontend — Production Dockerfile
# =============================================================
# Two-stage build:
#   Stage 1 (builder): Installs deps, builds Next.js static output
#   Stage 2 (serve):   Nginx serves the static files
#
# NEXT_PUBLIC_API_URL is injected at build time via --build-arg.
# =============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Accept the API URL as a build argument (baked into the static JS bundle)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Install dependencies first (separate layer for better caching)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Copy source code and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────
FROM nginx:1.27-alpine AS serve

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from Stage 1 (Next.js static export → 'out/')
COPY --from=builder /app/out /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
