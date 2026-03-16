<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@700;800&family=Inter:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:transparent}
  .hero{padding:2.5rem 2rem 2rem;text-align:center;position:relative;overflow:hidden}
  .grid-bg{position:absolute;inset:0;background-image:linear-gradient(var(--color-border-tertiary) 1px,transparent 1px),linear-gradient(90deg,var(--color-border-tertiary) 1px,transparent 1px);background-size:32px 32px;opacity:0.5}
  .icon-wrap{display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:18px;border:0.5px solid var(--color-border-secondary);background:var(--color-background-primary);margin-bottom:1.25rem;position:relative;z-index:1}
  .icon-wrap svg{width:36px;height:36px}
  h1{font-family:'Syne',sans-serif;font-size:2.6rem;font-weight:800;letter-spacing:-0.04em;color:var(--color-text-primary);line-height:1;margin-bottom:.5rem;position:relative;z-index:1}
  h1 span{color:#00C895}
  .mono{font-family:'IBM Plex Mono',monospace;font-size:.85rem;color:var(--color-text-secondary);letter-spacing:.04em;margin-bottom:1.25rem;position:relative;z-index:1}
  .tagline{font-family:'Inter',sans-serif;font-size:1.05rem;color:var(--color-text-secondary);max-width:460px;margin:0 auto 1.75rem;line-height:1.6;position:relative;z-index:1}
  .badges{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:2rem;position:relative;z-index:1}
  .badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-family:'IBM Plex Mono',monospace;font-size:.72rem;font-weight:600;border:0.5px solid}
  .badge.green{background:#E1F5EE;color:#0F6E56;border-color:#5DCAA5}
  .badge.purple{background:#EEEDFE;color:#3C3489;border-color:#AFA9EC}
  .badge.blue{background:#E6F1FB;color:#185FA5;border-color:#85B7EB}
  .badge.amber{background:#FAEEDA;color:#854F0B;border-color:#EF9F27}
  .badge.gray{background:#F1EFE8;color:#444441;border-color:#B4B2A9}
  .dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.7}
  .arch{display:flex;align-items:center;justify-content:center;gap:0;padding:1.5rem 1rem;border-top:0.5px solid var(--color-border-tertiary);position:relative;z-index:1}
  .node{padding:10px 18px;border-radius:10px;font-family:'IBM Plex Mono',monospace;font-size:.75rem;font-weight:600;border:0.5px solid;text-align:center;min-width:90px}
  .node.ai{background:#EEEDFE;color:#3C3489;border-color:#AFA9EC}
  .node.mcp{background:#E1F5EE;color:#0F6E56;border-color:#5DCAA5}
  .node.broker{background:#E6F1FB;color:#185FA5;border-color:#85B7EB}
  .node-sub{font-family:'Inter',sans-serif;font-weight:400;font-size:.65rem;opacity:.7;margin-top:2px}
  .arrow{display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 6px}
  .arrow-line{width:36px;height:1px;background:var(--color-border-secondary)}
  .arrow-label{font-family:'IBM Plex Mono',monospace;font-size:.6rem;color:var(--color-text-secondary);letter-spacing:.02em}
  .arrow-head{font-size:10px;color:var(--color-text-secondary);margin-top:-3px}
</style>
<div class="hero">
  <div class="grid-bg"></div>
  <div class="icon-wrap">
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="28" height="5" rx="2.5" fill="#00C895" opacity=".9"/>
      <rect x="4" y="18" width="20" height="5" rx="2.5" fill="#00C895" opacity=".6"/>
      <rect x="4" y="26" width="14" height="5" rx="2.5" fill="#00C895" opacity=".35"/>
      <circle cx="29" cy="28.5" r="5" fill="#3C3489" opacity=".9"/>
      <path d="M27 28.5h4M29 26.5v4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </div>
  <h1>solace-<span>semp</span>-mcp</h1>
  <div class="mono">// model context protocol Â· solace semp v2</div>
  <p class="tagline">Manage Solace PubSub+ brokers through natural language. Configure VPNs, inspect queues, and control your messaging infrastructure â€” all via AI.</p>
  <div class="badges">
    <span class="badge green"><span class="dot"></span>MCP Compatible</span>
    <span class="badge purple"><span class="dot"></span>SEMP v2</span>
    <span class="badge blue"><span class="dot"></span>Node.js 20+</span>
    <span class="badge amber"><span class="dot"></span>MIT License</span>
    <span class="badge gray"><span class="dot"></span>TypeScript</span>
  </div>
  <div class="arch">
    <div class="node ai">AI Client<div class="node-sub">Claude / Cursor</div></div>
    <div class="arrow"><div class="arrow-label">MCP</div><div class="arrow-line"></div><div class="arrow-head">â–¶</div></div>
    <div class="node mcp">semp-mcp<div class="node-sub">this server</div></div>
    <div class="arrow"><div class="arrow-label">SEMP v2</div><div class="arrow-line"></div><div class="arrow-head">â–¶</div></div>
    <div class="node broker">Solace Broker<div class="node-sub">Cloud / Software</div></div>
  </div>
</div>

---

## Overview

`solace-semp-mcp` is a Model Context Protocol server for Solace PubSub+ brokers. It exposes curated tools for broker inspection, queue and client operations, ACL and profile management, diagnostics, and a guarded SEMP passthrough.

The server can run over:

- `stdio` for local MCP clients such as Claude Code or desktop-style integrations
- `sse` for HTTP/SSE-based MCP clients and remote integrations

## Features

- Broker registration from `brokers.json` and environment variables
- Read-oriented broker, VPN, queue, client, ACL, and profile tools
- Dry-run confirmation for write and delete operations
- Optional raw `semp_request` passthrough with mode controls
- Structured logging to console and log files
- Unit test coverage for broker loading, SEMP client behavior, safety, and tool handlers

## Repository Layout

```text
src/
  brokers/      Broker config loading and in-memory registry
  safety/       Risk tiers and dry-run confirmation helpers
  semp/         Solace SEMP HTTP client and error mapping
  tools/        MCP tool registration and handlers
  transport/    stdio and SSE transports
  index.ts      App entrypoint
  server.ts     MCP server factory
  logger.ts     Winston logger setup

tests/          Jest tests for src/
dist/           Compiled JavaScript output generated by TypeScript
docs/           Reference notes and design material
```

## Requirements

- Node.js `20+`
- npm `10+` recommended
- Reachable Solace PubSub+ broker with SEMP v2 enabled

## Installation

```bash
npm install
```

## Configuration

### Option A: `brokers.json`

Create a `brokers.json` file in the repository root:

```json
{
  "brokers": [
    {
      "name": "dev-broker",
      "label": "Development Broker",
      "url": "http://localhost:8080",
      "username": "admin",
      "password": "admin"
    }
  ]
}
```

Use [brokers.json.example](./brokers.json.example) as a starting point.

### Option B: Environment Variables

You can also register brokers through environment variables:

```bash
SEMP_BROKER_DEV_URL=http://localhost:8080
SEMP_BROKER_DEV_USERNAME=admin
SEMP_BROKER_DEV_PASSWORD=admin
SEMP_BROKER_DEV_LABEL=Development Broker
```

### Runtime Variables

Common runtime options:

- `MCP_TRANSPORT`: `stdio` or `sse`
- `PORT`: HTTP port for SSE mode, default `3000`
- `MCP_API_KEY`: bearer token required in SSE mode
- `MCP_RATE_LIMIT_RPS`: request rate limit for SSE mode, default `10`
- `SEMP_TIMEOUT_MS`: upstream SEMP timeout, default `10000`
- `SEMP_PASSTHROUGH_MODE`: `disabled`, `monitor_only`, or `advanced`
- `MESSAGE_PAYLOAD_PREVIEW_BYTES`: payload preview limit for queue message browsing
- `LOG_LEVEL`: `error`, `warn`, `info`, or `debug`

## Development

Run the TypeScript server directly:

```bash
npm run dev
```

Build the compiled output:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Collect coverage:

```bash
npm run test:coverage
```

## Running The Server

### stdio mode

Use `stdio` when the MCP client launches the process locally.

```bash
npm run build
node dist/index.js
```

Or explicitly:

```bash
MCP_TRANSPORT=stdio node dist/index.js
```

### SSE mode

Use `sse` when the client expects an HTTP endpoint.

```bash
MCP_TRANSPORT=sse PORT=3000 node dist/index.js
```

Available endpoints:

- `GET /sse`
- `POST /messages?sessionId=...`
- `GET /health`

If `MCP_API_KEY` is set, send `Authorization: Bearer <token>`.

## Connecting From MCP Clients

### Claude Code

Typical local configuration uses `stdio`:

```json
{
  "mcpServers": {
    "solace-semp": {
      "command": "node",
      "args": ["D:\\solace-semp-mcp\\dist\\index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

### HTTP/SSE Clients

Run the server with `MCP_TRANSPORT=sse` and configure the client to connect to:

- `http://<host>:<port>/sse`
- `http://<host>:<port>/messages`

## Available Tool Groups

- Broker tools: list, add, remove, version, summary
- Monitor tools: broker health, VPN listing, redundancy, config sync
- Queue tools: list queues, inspect stats, manage config, clear or delete
- Client tools: list clients, subscriptions, connections, disconnect, clear stats
- ACL/Profile tools: ACL profiles, client usernames, client profiles
- Diagnostic tools: backlogged queues, idle consumers, message lag
- Passthrough tool: guarded raw SEMP requests

## Safety Model

Write and delete operations are dry-run by default. To execute a risky action, call the same tool again with `confirm: true`.

This logic lives in [src/safety/confirmation.ts](./src/safety/confirmation.ts) and is part of the public behavior of this server.

## Logs

Logs are written to the console and to the `logs/` directory. Increase `LOG_LEVEL=debug` when troubleshooting request flow or transport issues.

## Documentation

Additional repository docs:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [VERSIONING.md](./VERSIONING.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [LICENSE](./LICENSE)

## Known Limitations

- SSE transport currently behaves as a single active MCP server session implementation; `stdio` is the safer default for local usage.
- Jest currently emits a `ts-jest` deprecation warning from the existing config shape.

## License

Released under the [MIT License](./LICENSE).
