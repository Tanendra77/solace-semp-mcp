# Quickstart

Get up and running with Solace SEMP MCP in under five minutes.

## Prerequisites

- Node.js 20+
- A reachable Solace PubSub+ broker with SEMP v2 enabled (default port: 8080)
- [Claude Code](https://claude.ai/code) (for the Claude Code integration path)

---

## Option A — Claude Code (local, stdio)

The recommended path for using the server with Claude Code on your local machine.

**1. Clone and install**

```bash
git clone https://github.com/Tanendra77/solace-semp-mcp.git
cd solace-semp-mcp
npm install
```

**2. Configure your broker**

```bash
cp brokers.json.example brokers.json
```

Edit `brokers.json` and fill in your broker details:

```json
{
  "brokers": [
    {
      "name": "my-broker",
      "label": "My Broker",
      "url": "http://your-solace-host:8080",
      "username": "admin",
      "password": "yourpassword"
    }
  ]
}
```

**3. Build and register**

```bash
npm run build
claude mcp add solace-semp node dist/index.js
```

**4. Verify**

Start a new Claude Code conversation and ask:

> *"List all brokers"*

You should see your broker listed. Then try:

> *"Get broker health for my-broker"*

---

## Option B — Docker (SSE, remote or team use)

**1. Pull and run**

```bash
docker run -d -p 3000:3000 \
  -e SEMP_BROKER_MY_URL=http://your-solace-host:8080 \
  -e SEMP_BROKER_MY_USERNAME=admin \
  -e SEMP_BROKER_MY_PASSWORD=yourpassword \
  -e SEMP_BROKER_MY_LABEL="My Broker" \
  tanendra/solace-semp-mcp:latest
```

**2. Health check**

```bash
curl http://localhost:3000/health
# {"status":"ok","brokers":1}
```

**3. Connect your MCP client**

Point your SSE-capable MCP client at `http://localhost:3000/sse`.

---

## First things to try

Once connected, these prompts cover the most common starting points:

```
List all brokers
Get broker health for <broker-name>
List VPNs on <broker-name>
List queues on <broker-name> in VPN default
Find backlogged queues on <broker-name>
```

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `MCP_TRANSPORT` | `stdio` | `stdio` or `sse` |
| `PORT` | `3000` | HTTP port (SSE only) |
| `MCP_API_KEY` | — | Bearer token for SSE auth |
| `SEMP_PASSTHROUGH_MODE` | `advanced` | `disabled`, `monitor_only`, or `advanced` |

For the full list see [README.md](./README.md#configuration).

---

## Next steps

- [Connecting to Claude Code](./doc/connecting-to-claude-code.md) — detailed setup guide
- [Tools Reference](./doc/tools-reference.md) — every tool, its SEMP endpoint, and safety tier
- [Docker guide](./doc/docker.md) — production Docker deployment
- [Contributing](./CONTRIBUTING.md) — how to add tools or report issues
