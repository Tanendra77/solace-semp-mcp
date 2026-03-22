# Docker Guide — solace-semp-mcp

This document covers building, running, and publishing the `solace-semp-mcp` Docker image.

---

## Prerequisites

- Docker Desktop 4.27+ (or Docker Engine 25.0+) — required for `--no-healthcheck` flag in stdio mode
- Node.js 20+ on the host (only needed for local development, not for Docker)
- A Docker Hub account (only needed for publishing)

---

## Image Architecture

The image uses a **two-stage multi-stage build** on `node:20-alpine`:

| Stage | Base | Purpose |
|-------|------|---------|
| `builder` | `node:20-alpine` | Installs all deps (`npm ci`), compiles TypeScript |
| `runtime` | `node:20-alpine` | Production deps only (`npm ci --omit=dev`), compiled `dist/` copied from builder |

The runtime image has no TypeScript compiler, no devDependencies, and no source files — only the compiled JavaScript and production node_modules.

**Non-root user**: the container runs as the built-in `node` user (UID 1000), not root.

**Default transport**: the image sets `MCP_TRANSPORT=sse` — opposite of the local default (`stdio`). Override with `-e MCP_TRANSPORT=stdio` to switch.

---

## Building Locally

```bash
# Standard build (VERSION label defaults to "dev")
docker build -t solace-semp-mcp:dev .

# Build with a specific version label
docker build --build-arg VERSION=1.0.0 -t solace-semp-mcp:1.0.0 .
```

Expected output ends with `FINISHED` or `Successfully tagged`. Both build stages must complete.

Check image size:
```bash
docker images solace-semp-mcp:dev
```
Expected: ~200–260 MB. Above 300 MB likely means the multi-stage build didn't work correctly.

---

## Running the Container

### SSE mode (default)

```bash
docker run -d --name semp-mcp -p 3000:3000 \
  -e SEMP_BROKER_MY_BROKER_URL=http://your-solace-host:8080 \
  -e SEMP_BROKER_MY_BROKER_USERNAME=admin \
  -e SEMP_BROKER_MY_BROKER_PASSWORD=admin \
  -e SEMP_BROKER_MY_BROKER_LABEL="My Broker" \
  solace-semp-mcp:dev
```

Verify the server is up:
```bash
curl http://localhost:3000/health
# → {"status":"ok","brokers":1}
```

Check container health (waits up to 40 seconds for first `healthy`):
```bash
docker inspect --format='{{.State.Health.Status}}' semp-mcp
# → healthy
```

Stop and remove:
```bash
docker rm -f semp-mcp
```

### stdio mode (for Claude Desktop / Claude Code)

```bash
docker run -i --rm --no-healthcheck \
  -e MCP_TRANSPORT=stdio \
  solace-semp-mcp:dev
```

> **Note**: `--no-healthcheck` requires Docker Engine 25.0+ / Docker Desktop 4.27+. On older versions use `--health-cmd=none` instead.

The `--no-healthcheck` flag is required because in stdio mode the Express HTTP server never starts, so the built-in health check would immediately mark the container unhealthy.

### Passing brokers via a file (volume mount)

```bash
docker run -d -p 3000:3000 \
  -v ./brokers.json:/app/brokers.json:ro \
  solace-semp-mcp:dev
```

The target path **must** be `/app/brokers.json` — the server resolves this path relative to `process.cwd()` which is `/app`. Any other target path is silently ignored (the server starts with zero brokers).

The `:ro` flag makes the mount read-only inside the container.

---

## Docker Compose

Docker Compose is the recommended way to run the server for local testing or persistent SSE deployment.

### Setup

```bash
# Copy the example env file
cp .env.example .env

# Edit .env to add your broker credentials (or leave empty for a no-broker test run).
# Note: MCP_TRANSPORT in .env is ignored by compose — the compose file enforces SSE mode
# via an environment: block that takes precedence over env_file. This ensures the health
# check always works correctly.
docker compose up -d
```

### Verify

```bash
docker compose ps
# → solace-semp-mcp   running (healthy)

curl http://localhost:3000/health
# → {"status":"ok","brokers":0}

docker compose exec solace-semp-mcp ls /app/logs
# → info-DDMMYYYY.log  (Winston writes a log file on startup)
```

### Stop

```bash
docker compose down
# Logs volume is preserved. To also remove it:
docker compose down -v
```

### Loading brokers from a file

Open `docker-compose.yml` and uncomment:
```yaml
volumes:
  - ./brokers.json:/app/brokers.json:ro
```
The target path must be `/app/brokers.json` (see above).

### Before Publishing

Replace the `<DOCKER_HUB_USERNAME>` placeholder in `docker-compose.yml`:
```yaml
image: yourusername/solace-semp-mcp:1.0.0
```

---

## Logs

Winston writes to both stdout (always) and `/app/logs/` (daily rotating file). In Docker, stdout is the standard channel (picked up by `docker logs`). The named volume `logs` persists log files across container restarts.

```bash
# Live logs (stdout)
docker compose logs -f

# Log files on disk
docker compose exec solace-semp-mcp ls /app/logs
```

---

## Environment Variables

All variables are passed at runtime via `-e` flags or the `.env` file. No secrets are baked into the image.

| Variable | Default | Purpose |
|----------|---------|---------|
| `MCP_TRANSPORT` | `sse` (in image) | `sse` or `stdio` |
| `PORT` | `3000` | HTTP port (SSE mode only) |
| `MCP_API_KEY` | — | Bearer token to protect SSE endpoints |
| `MCP_RATE_LIMIT_RPS` | `10` | Requests per second per IP (SSE mode) |
| `MCP_MAX_SESSIONS` | `100` | Max concurrent SSE connections (SSE mode) |
| `TRUST_PROXY` | — | Set to `1` when behind Nginx/Traefik so rate-limiting uses real client IP |
| `CORS_ORIGIN` | — | Allowed CORS origins (`*` or comma-separated) |
| `SEMP_TIMEOUT_MS` | `10000` | Upstream SEMP HTTP timeout (ms) |
| `SEMP_PASSTHROUGH_MODE` | `advanced` | `disabled`, `monitor_only`, or `advanced` |
| `MESSAGE_PAYLOAD_PREVIEW_BYTES` | `2048` | Max bytes shown in queue message previews |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, `debug` |
| `SEMP_BROKER_{NAME}_URL` | — | Broker URL (env-based config) |
| `SEMP_BROKER_{NAME}_USERNAME` | — | Broker username |
| `SEMP_BROKER_{NAME}_PASSWORD` | — | Broker password |
| `SEMP_BROKER_{NAME}_LABEL` | — | Human-readable broker label |

Replace `{NAME}` with any uppercase identifier (e.g., `PROD`, `DEV`). Multiple brokers are supported by repeating the block with different names.

---

## CI/CD — Auto-publish to Docker Hub

The GitHub Actions workflow at `.github/workflows/docker-publish.yml` triggers on `v*.*.*` tag pushes.

### One-time setup

Add these secrets to your GitHub repository (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | A Docker Hub access token (create at hub.docker.com → Account Settings → Security → Access Tokens — use a token, not your password) |

### Publishing a release

```bash
git tag v1.0.0
git push --tags
```

The workflow will:
1. Build for `linux/amd64` and `linux/arm64`
2. Push to Docker Hub with tags: `1.0.0`, `1.0`, `1`, and `latest`
3. Set the `org.opencontainers.image.version` OCI label to the tag name

Monitor progress in the **Actions** tab of your GitHub repository.

### Tag pattern

| Tag pushed | Docker Hub tags created |
|-----------|------------------------|
| `v1.2.3` | `1.2.3`, `1.2`, `1`, `latest` |
| `v2.0.0` | `2.0.0`, `2.0`, `2`, `latest` |

---

## Security Notes

### What is excluded from the image

The `.dockerignore` ensures these never enter any image layer:

| Path | Reason |
|------|--------|
| `brokers.json` | Contains broker credentials |
| `.env*` | May contain API keys or secrets |
| `.git/` | Full commit history — not needed at runtime |
| `node_modules/` | Rebuilt from lockfile inside the image |
| `tests/` | Not needed at runtime |

### Runtime hardening

- Runs as the built-in `node` user (non-root, UID 1000)
- `NODE_ENV=production` — Express produces less verbose error output, reducing information leakage
- Production dependencies only (`npm ci --omit=dev`) — attack surface reduced
- Healthcheck uses Node's built-in `http` module (no wget/curl required in Alpine)

### Secrets at runtime

Never pass secrets via `docker build --build-arg` — build args are visible in `docker history`. Always use runtime `-e` flags or `env_file` with docker compose.

### Network exposure

The default `docker compose` port mapping (`3000:3000`) binds on all interfaces. If the container is behind a reverse proxy on the same host, restrict to localhost:
```yaml
ports:
  - "127.0.0.1:3000:3000"
```

### GitHub Actions permissions

The workflow uses `permissions: contents: read` only. Docker Hub authentication uses a repository secret (`DOCKERHUB_TOKEN`), not `GITHUB_TOKEN`, so no additional GitHub token permissions are needed.

---

## Troubleshooting

**Container exits immediately in stdio mode**
→ Pass `-i` flag to keep stdin open: `docker run -i --rm -e MCP_TRANSPORT=stdio ...`

**Health check stays in `starting` for more than 40 seconds**
→ Check logs: `docker logs semp-mcp`. The HTTP server only starts in SSE mode. If you switched to stdio mode, pass `--no-healthcheck`.

**`--no-healthcheck` flag not recognised**
→ You need Docker Engine 25.0+ / Docker Desktop 4.27+. Use `--health-cmd=none` on older versions.

**`brokers.json` volume mount not working**
→ The target path must be exactly `/app/brokers.json`. Any other path (e.g., `/app/config/brokers.json`) is silently ignored.

**Build fails with TypeScript errors**
→ Fix the TypeScript error in `src/` first (`npm run build` locally), then rebuild the image.

**Image larger than 300 MB**
→ The multi-stage build may have failed. Verify both `AS builder` and `AS runtime` stages are in the Dockerfile and that `dist/` is listed in `.dockerignore` (so the runtime stage uses the compiled output from the builder, not a stale local `dist/`).

**`docker compose up` fails with `.env not found`**
→ Run `cp .env.example .env` first. The compose file requires `.env` to exist even if it contains only defaults.
