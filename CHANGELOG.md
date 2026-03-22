# Changelog

All notable changes to this project will be documented here. This project follows [Semantic Versioning](./VERSIONING.md).

---

## [1.0.0] — 2026-03-22

Initial release.

```bash
docker pull tanendra/solace-semp-mcp:1.0.0
```

### Tools (47 total)

**Broker management**
- `list_brokers` — list all registered brokers (name, label, URL; credentials never returned)
- `add_broker` — register a broker in-session via tool call
- `remove_broker` — remove a broker from the registry (DELETE tier, dry-run by default)
- `get_broker_version` — SEMP version, software version, uptime
- `describe_broker` — high-level broker summary combining about and VPN list

**Monitor / health**
- `get_broker_stats` — raw broker statistics
- `get_broker_health` — combined health view: uptime, memory, client count, message rates
- `get_redundancy_status` — HA redundancy role and replication state
- `get_config_sync_status` — config sync state between HA peers
- `list_vpns` — paginated VPN list
- `get_vpn_stats` — detailed stats for a single VPN

**Queues**
- `list_queues` — paginated queue list with runtime stats
- `get_queue_stats` — message count, consumer count, spool usage for one queue
- `list_queue_subscriptions` — paginated topic subscriptions on a queue
- `list_queue_consumers` — active consumer connections
- `list_queue_messages` — browse messages; payloads truncated at `MESSAGE_PAYLOAD_PREVIEW_BYTES`
- `get_queue_config` — persistent configuration from the config API
- `create_queue` — create a queue (WRITE, dry-run by default)
- `update_queue_config` — update queue configuration (WRITE, dry-run by default)
- `delete_queue` — permanently delete a queue and all its messages (DELETE, dry-run by default)
- `clear_queue` / `purge_queue` — purge all messages from a queue (DELETE, dry-run by default)

**Clients**
- `list_clients` — paginated client connection list
- `get_client_details` — full details for one client
- `list_client_subscriptions` — paginated topic subscriptions for a client
- `list_client_connections` — paginated connections for a client username
- `disconnect_client` — disconnect a client (WRITE, dry-run by default)
- `clear_client_stats` — reset stat counters for a client (WRITE, dry-run by default)

**ACL profiles**
- `list_acl_profiles`, `get_acl_profile` — read ACL profile config
- `create_acl_profile`, `update_acl_profile`, `delete_acl_profile` — manage ACL profiles (dry-run by default)

**Client usernames**
- `list_client_usernames`, `get_client_username` — read client username config
- `create_client_username`, `update_client_username`, `delete_client_username` — manage client usernames (dry-run by default)

**Client profiles**
- `list_client_profiles`, `get_client_profile` — read client profile config
- `create_client_profile`, `update_client_profile`, `delete_client_profile` — manage client profiles (dry-run by default)

**Diagnostics**
- `find_backlogged_queues` — queues exceeding a spool usage threshold (default 80%), sorted by usage
- `find_idle_consumers` — queues with bound consumers and spooled messages (stalled consumers)
- `detect_message_lag` — all queues with spooled messages, ranked by count with HIGH / MEDIUM / LOW severity

**Passthrough**
- `semp_request` — guarded raw SEMP call; gated by `SEMP_PASSTHROUGH_MODE` (`disabled`, `monitor_only`, `advanced`)

### Safety system
- All write and delete operations default to dry-run; require `confirm: true` to execute
- Three risk tiers: READ, WRITE, DELETE
- Dry-run responses describe exactly what would happen and which SEMP endpoint would be called

### Transports
- `stdio` — default for local MCP clients (Claude Code, Claude Desktop)
- `sse` — HTTP/SSE server with optional Bearer auth (`MCP_API_KEY`), per-IP rate limiting (`MCP_RATE_LIMIT_RPS`), session cap (`MCP_MAX_SESSIONS`), CORS (`CORS_ORIGIN`), and reverse-proxy support (`TRUST_PROXY`)

### Broker configuration
- File-based: `brokers.json` (gitignored)
- Environment-based: `SEMP_BROKER_{NAME}_{URL,USERNAME,PASSWORD,LABEL}` vars
- Both sources merged at startup; env vars take precedence

### Infrastructure
- Multi-stage Docker image on `node:20-alpine`; runs as non-root `node` user
- Multi-platform build: `linux/amd64` and `linux/arm64`
- GitHub Actions workflow auto-publishes to Docker Hub on `v*.*.*` tag push
- Docker Compose configuration for SSE mode with named log volume
- Winston structured logging to stdout and rotating daily log files

### Pagination
- All paginated tools use SEMP opaque cursor strings (not numeric offsets)
- Cursor extracted from `meta.paging.nextPageUri` and appended as a hint in the response
- `semp_request` GET responses expose `meta.paging` when a next page exists
