# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

ARG VERSION=dev
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Create logs dir owned by non-root user.
# CRITICAL: this RUN step must appear BEFORE the VOLUME declaration.
# Docker discards writes made in RUN steps that occur after a VOLUME directive.
RUN mkdir -p /app/logs && chown node:node /app/logs

VOLUME /app/logs

LABEL org.opencontainers.image.title="solace-semp-mcp"
LABEL org.opencontainers.image.description="MCP server for Solace PubSub+ SEMP API"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.source="https://github.com/Tanendra77/solace-semp-mcp"
LABEL org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production \
    MCP_TRANSPORT=sse

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

USER node
CMD ["node", "dist/index.js"]
