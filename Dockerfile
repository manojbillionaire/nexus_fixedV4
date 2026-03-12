# cache-bust: v4.5

FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Install backend deps
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend
COPY backend/ ./

# Copy pre-built frontend dist
COPY frontend/dist ./frontend/dist

# Hard fail if index.html missing — never deploy broken image
RUN ls -la /app/frontend/dist/ && \
    test -f /app/frontend/dist/index.html || \
    (echo "FATAL: /app/frontend/dist/index.html missing" && exit 1)

RUN addgroup -g 1001 -S nodejs && adduser -S nexus -u 1001
USER nexus

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
