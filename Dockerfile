# cache-bust: v4.2

# ─── Stage 1: Build React Frontend ───────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first (layer cache for node_modules)
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY frontend/ ./
RUN npm run build

# Verify dist was actually created — fail hard if not
RUN test -f /app/frontend/dist/index.html || (echo "ERROR: Vite build failed — dist/index.html missing" && exit 1)

# ─── Stage 2: Production Backend ─────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Verify frontend files are present before starting
RUN test -f /app/frontend/dist/index.html || (echo "ERROR: frontend/dist/index.html not found in production image" && exit 1)
RUN ls -la /app/frontend/dist/

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nexus -u 1001
USER nexus

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
