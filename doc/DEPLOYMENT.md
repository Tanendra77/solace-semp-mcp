# Deployment

## Overview

This server can be deployed in two practical ways:

- as a local `stdio` process launched directly by an MCP client
- as a long-running HTTP service in `sse` mode

Use `stdio` for local desktop integrations. Use `sse` for shared or remote environments.

## Build

```bash
npm install
npm run build
```

The deployable runtime artifact is [dist](./dist).

## Configuration

Provide broker configuration with either:

- a root-level `brokers.json`
- environment variables like `SEMP_BROKER_<NAME>_URL`, `SEMP_BROKER_<NAME>_USERNAME`, `SEMP_BROKER_<NAME>_PASSWORD`

Recommended runtime variables:

- `MCP_TRANSPORT`
- `PORT`
- `MCP_API_KEY`
- `MCP_RATE_LIMIT_RPS`
- `SEMP_TIMEOUT_MS`
- `SEMP_PASSTHROUGH_MODE`
- `LOG_LEVEL`

## Local Deployment

### stdio

```bash
node dist/index.js
```

Or:

```bash
MCP_TRANSPORT=stdio node dist/index.js
```

### sse

```bash
MCP_TRANSPORT=sse PORT=3000 node dist/index.js
```

Health check:

```bash
curl http://localhost:3000/health
```

## Windows Service Or Background Process

For a simple Windows-hosted deployment:

1. Build the project
2. Set environment variables in the host environment
3. Start `node dist/index.js`
4. Run it under your preferred supervisor or service wrapper

Examples of supervisors:

- NSSM
- PM2
- Windows Task Scheduler for simple restart behavior

## Linux Service

For a Linux host, use a process manager such as `systemd` or PM2.

Example `systemd` unit:

```ini
[Unit]
Description=solace-semp-mcp
After=network.target

[Service]
WorkingDirectory=/opt/solace-semp-mcp
Environment=MCP_TRANSPORT=sse
Environment=PORT=3000
Environment=LOG_LEVEL=info
ExecStart=/usr/bin/node /opt/solace-semp-mcp/dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Container Deployment

This repo does not currently include a `Dockerfile`, but it is straightforward to containerize:

1. Install dependencies
2. Build the project
3. Copy `dist/`, `package.json`, and production dependencies
4. Start with `node dist/index.js`

If you want container deployment to be first-class, add:

- a `Dockerfile`
- `.dockerignore`
- runtime env documentation
- healthcheck configuration

## Reverse Proxy

When exposing `sse` mode behind Nginx, Traefik, or another proxy:

- preserve streaming behavior for SSE
- forward `Authorization` headers if `MCP_API_KEY` is enabled
- avoid aggressive buffering
- keep idle timeouts high enough for long-lived SSE connections

## Security Guidance

- Prefer private network access to Solace brokers
- Use `MCP_API_KEY` for SSE mode
- Keep `SEMP_PASSTHROUGH_MODE=monitor_only` unless full write access is required
- Do not commit `brokers.json` with real credentials
- Rotate credentials if they are exposed in logs or shell history

## Deployment Checklist

- Dependencies installed
- Project built
- Broker configuration present
- Correct transport selected
- Health endpoint reachable in SSE mode
- Logs writable
- `npm test` and `npm run build` passed before deployment

## Known Runtime Notes

- `stdio` is the safest default for local MCP client integration
- SSE mode should be validated carefully if you expect multiple concurrent MCP clients
