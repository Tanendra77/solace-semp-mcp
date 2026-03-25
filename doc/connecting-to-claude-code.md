# Connecting Solace SEMP MCP to Claude Code

This guide explains how to connect the Solace SEMP MCP server to Claude Code so you can manage your Solace brokers through natural language.

---

## Option A — Docker (recommended, no clone needed)

The fastest path. One command registers the server globally — available in every project directory.

**Prerequisites:** [Claude Code](https://claude.ai/code) + Docker

```bash
claude mcp add --scope user solace-semp docker -- run -i --rm --no-healthcheck \
  -e MCP_TRANSPORT=stdio \
  -e SEMP_BROKER_MY_URL=http://your-solace-host:8080 \
  -e SEMP_BROKER_MY_USERNAME=admin \
  -e SEMP_BROKER_MY_PASSWORD=yourpassword \
  -e SEMP_BROKER_MY_LABEL=MyBroker \
  tanendra/solace-semp-mcp:latest
```

Claude Code starts the container automatically on demand — no pre-running server needed. To remove:

```bash
claude mcp remove solace-semp
```

---

## Option B — From source

**Prerequisites:** [Claude Code](https://claude.ai/code) + Node.js 20+

## Step 1 - Build the server

```bash
cd solace-semp-mcp
npm install
npm run build
```

## Step 2 - Register with Claude Code

From the repository directory, run:

```bash
claude mcp add solace-semp node dist/index.js
```

Verify it registered correctly:

```bash
claude mcp list
```

You should see `solace-semp: node dist/index.js - Connected`.

## Step 3 - Start a new conversation

MCP tools only become available in sessions started **after** registration. Close and reopen Claude Code, or start a new conversation.

## Step 4 - Add your broker

You have two options:

### Option A - Dynamically (in-session only)

Ask Claude to add your broker:

> *"Add a broker named my-broker with URL http://your-host:8080, username admin, password yourpassword"*

Claude will call the `add_broker` tool. The broker is available for the rest of the session but **does not persist** across restarts.

### Option B - Permanently via `brokers.json`

Create `brokers.json` in the repository root (it is gitignored):

```json
{
  "brokers": [
    {
      "name": "my-broker",
      "label": "My Hosted Broker",
      "url": "http://your-host:8080",
      "username": "admin",
      "password": "yourpassword"
    }
  ]
}
```

The broker is loaded automatically every time the MCP server starts.

> Default SEMP port is **8080** (HTTP) or **943** (HTTPS).

## Step 5 - Test it

Try asking Claude:

- *"List all brokers"*
- *"Get broker health for my-broker"*
- *"List VPNs on my-broker"*
- *"List all queues in VPN default"*
- *"Show me any backlogged queues on my-broker"*

## Removing the MCP server

```bash
claude mcp remove solace-semp
```
