# solace-semp-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that wraps the Solace PubSub+ SEMP v2 API, exposing 47 broker management tools for AI clients like Claude Code, Claude Desktop, and any MCP-compatible host.

Connect your AI assistant to a Solace broker and ask:

> *"Find all backlogged queues"*
> *"Show me the health of the prod broker"*
> *"List all clients connected to VPN default"*
> *"Delete queue orders-queue from VPN prod"* — dry-run shown first, then confirm

---

## Quick start

**SSE mode** (HTTP server, connect any MCP client):

```bash
docker run -d -p 3000:3000 \
  -e SEMP_BROKER_MY_URL=http://your-solace-host:8080 \
  -e SEMP_BROKER_MY_USERNAME=admin \
  -e SEMP_BROKER_MY_PASSWORD=yourpassword \
  -e SEMP_BROKER_MY_LABEL=MyBroker \
  tanendra/solace-semp-mcp:latest
```

Verify it's running:

```bash
curl http://localhost:3000/health
# {"status":"ok","brokers":1}
```

**Connect to Claude Code** (one command, no container management needed):

```bash
claude mcp add --scope user solace-semp docker -- run -i --rm --no-healthcheck -e MCP_TRANSPORT=stdio -e SEMP_BROKER_MY_URL=http://your-solace-host:8080 -e SEMP_BROKER_MY_USERNAME=admin -e SEMP_BROKER_MY_PASSWORD=yourpassword -e SEMP_BROKER_MY_LABEL=MyBroker tanendra/solace-semp-mcp:latest
```

Claude Code will spin up the container automatically on demand — no pre-running server needed. Requires [Claude Code](https://claude.ai/code) and Docker.

---

## Transports

| Mode | Use case |
|------|----------|
| `sse` (default in image) | HTTP server on port 3000 — for remote MCP clients, team deployments |
| `stdio` | Local MCP clients — Claude Code, Claude Desktop |

**stdio mode:**

```bash
docker run -i --rm \
  -e MCP_TRANSPORT=stdio \
  --no-healthcheck \
  tanendra/solace-semp-mcp:latest
```

---

## Broker configuration

Pass brokers via environment variables at runtime — no secrets are baked into the image.

```bash
# Broker env var pattern:
SEMP_BROKER_{NAME}_URL=http://host:8080
SEMP_BROKER_{NAME}_USERNAME=admin
SEMP_BROKER_{NAME}_PASSWORD=yourpassword
SEMP_BROKER_{NAME}_LABEL=Human-readable name
```

Replace `{NAME}` with any uppercase identifier (e.g., `PROD`, `DEV`). Multiple brokers are supported — add as many blocks as you need, each with a different name:

```bash
docker run -d -p 3000:3000 \
  -e SEMP_BROKER_PROD_URL=http://prod-host:8080 \
  -e SEMP_BROKER_PROD_USERNAME=admin \
  -e SEMP_BROKER_PROD_PASSWORD=prodpassword \
  -e SEMP_BROKER_PROD_LABEL="Production" \
  -e SEMP_BROKER_DEV_URL=http://dev-host:8080 \
  -e SEMP_BROKER_DEV_USERNAME=admin \
  -e SEMP_BROKER_DEV_PASSWORD=devpassword \
  -e SEMP_BROKER_DEV_LABEL="Development" \
  tanendra/solace-semp-mcp:latest
```

Additional brokers can also be registered at runtime from within an AI session using the `add_broker` tool, without restarting the container. Session-registered brokers are not persisted across restarts.

Alternatively, mount a `brokers.json` file:

```bash
docker run -d -p 3000:3000 \
  -v ./brokers.json:/app/brokers.json:ro \
  tanendra/solace-semp-mcp:latest
```

---

## Key environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `MCP_TRANSPORT` | `sse` | `sse` or `stdio` |
| `PORT` | `3000` | HTTP port (SSE mode) |
| `MCP_API_KEY` | — | Bearer token to protect SSE endpoints |
| `MCP_RATE_LIMIT_RPS` | `10` | Requests per second per client IP |
| `MCP_MAX_SESSIONS` | `100` | Max concurrent SSE connections |
| `TRUST_PROXY` | — | Set to `1` when behind Nginx/Traefik |
| `CORS_ORIGIN` | — | Allowed CORS origins (`*` or comma-separated) |
| `SEMP_PASSTHROUGH_MODE` | `advanced` | `disabled`, `monitor_only`, or `advanced` |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, `debug` |

---

## Available tools

| Group | What it covers |
|-------|---------------|
| **Broker** | List, register, remove brokers; version info; health summary |
| **Monitor** | Broker health, HA/redundancy status, VPN stats, config sync |
| **Queues** | List, inspect, browse messages, create, update, delete, purge |
| **Clients** | List connections, subscriptions, disconnect, clear stats |
| **ACL Profiles** | List, get, create, update, delete |
| **Client Usernames** | List, get, create, update, delete |
| **Client Profiles** | List, get, create, update, delete |
| **Diagnostics** | Backlogged queues, idle consumers, message lag detection |
| **Passthrough** | Raw SEMP escape hatch with mode controls |

---

## Safety model

All write and delete operations are **dry-run by default**. The server describes exactly what would happen and which SEMP endpoint would be called before anything is executed. Pass `confirm: true` to proceed.

---

Full guide and source: [github.com/Tanendra77/solace-semp-mcp](https://github.com/Tanendra77/solace-semp-mcp)

---

## Tags

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release |
| `1.0.0` | First stable release |

Multi-platform: `linux/amd64` · `linux/arm64`