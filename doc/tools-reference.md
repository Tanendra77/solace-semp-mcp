# Tools Reference

This document lists every MCP tool exposed by this server, the SEMP endpoint it calls, and a brief description of its behaviour. Use it to understand what each tool does without reading source code.

## Approach

**Safety tiers.** Every tool is classified as READ, WRITE, or DELETE. WRITE and DELETE tools default to a dry-run: they describe what would happen and ask you to call again with `confirm: true` to execute. This prevents accidental state changes.

**SEMP APIs used.** The Solace SEMP v2 surface has three sub-APIs, each at a different path prefix:
- `monitor` — read-only runtime state (stats, connected clients, queue depths)
- `config` — persistent configuration (create/update/delete objects)
- `action` — one-shot operations that are not configuration changes (disconnect, purge)

**Pagination.** Read tools that return lists accept `limit` and `cursor`. When there are more results than `limit`, the response appends a `Use cursor="..." for the next page` hint. Pass the cursor back on the next call to advance the page.

**Diagnostic tools.** These fetch a full queue list from the monitor API and filter/rank client-side. They do not call a dedicated SEMP diagnostic endpoint.

---

## 1. Broker Management

These tools operate on the in-memory broker registry, not on a broker's SEMP API directly.

| # | Tool | SEMP endpoint | Notes |
|---|------|---------------|-------|
| 1 | `list_brokers` | none | Lists registered brokers — name, label, URL. Credentials never returned. |
| 2 | `add_broker` | none | Registers a broker in memory for the session. Lost on restart. |
| 3 | `remove_broker` | none | Removes a broker from the registry. DELETE tier — dry-run by default. |
| 4 | `get_broker_version` | `GET /SEMP/v2/monitor/about/api` | Returns SEMP version, software version, and uptime. |
| 5 | `describe_broker` | `GET /SEMP/v2/monitor/about` + `GET /SEMP/v2/monitor/msgVpns` | High-level summary combining broker info and VPN list. Good starting point. |

---

## 2. Monitor

Read-only broker and VPN health tools.

| # | Tool | SEMP endpoint | Notes |
|---|------|---------------|-------|
| 6 | `get_broker_stats` | `GET /SEMP/v2/monitor/about` | Raw broker statistics from the about endpoint. |
| 7 | `get_broker_health` | `GET /SEMP/v2/monitor/about` + `GET /SEMP/v2/monitor/about/api` | Combined health view: uptime, memory, client count, message rates, API version. |
| 8 | `get_redundancy_status` | `GET /SEMP/v2/monitor/about` | HA redundancy role (primary/backup) and replication state. |
| 9 | `get_config_sync_status` | `GET /SEMP/v2/monitor/configSyncLocalDatabaseRows` | Config sync state between HA peers. |
| 10 | `list_vpns` | `GET /SEMP/v2/monitor/msgVpns` | Paginated list of message VPNs. |
| 11 | `get_vpn_stats` | `GET /SEMP/v2/monitor/msgVpns/{vpn}` | Detailed stats for a single VPN. |

---

## 3. Queues

| # | Tool | SEMP endpoint | Tier |
|---|------|---------------|------|
| 12 | `list_queues` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/queues` | READ |
| 13 | `get_queue_stats` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/queues/{queue}` | READ |
| 14 | `list_queue_subscriptions` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/queues/{queue}/subscriptions` | READ |
| 15 | `list_queue_consumers` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/queues/{queue}/txFlows` | READ |
| 16 | `list_queue_messages` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/queues/{queue}/msgs` | READ — payloads truncated at `MESSAGE_PAYLOAD_PREVIEW_BYTES`, max 100 messages |
| 17 | `get_queue_config` | `GET /SEMP/v2/config/msgVpns/{vpn}/queues/{queue}` | READ — reads from the config API, not monitor |
| 18 | `create_queue` | `POST /SEMP/v2/config/msgVpns/{vpn}/queues` | WRITE — dry-run by default |
| 19 | `update_queue_config` | `PATCH /SEMP/v2/config/msgVpns/{vpn}/queues/{queue}` | WRITE — dry-run by default |
| 20 | `delete_queue` | `DELETE /SEMP/v2/config/msgVpns/{vpn}/queues/{queue}` | DELETE — dry-run by default, irreversible |
| 21 | `clear_queue` | `POST /SEMP/v2/action/msgVpns/{vpn}/queues/{queue}/deleteMsgs` | DELETE — purges all messages, dry-run by default |
| 22 | `purge_queue` | `POST /SEMP/v2/action/msgVpns/{vpn}/queues/{queue}/deleteMsgs` | DELETE — alias for `clear_queue` |

---

## 4. Clients

| # | Tool | SEMP endpoint | Tier |
|---|------|---------------|------|
| 23 | `list_clients` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/clients` | READ — paginated |
| 24 | `get_client_details` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/clients/{clientName}` | READ |
| 25 | `list_client_subscriptions` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/clients/{clientName}/subscriptions` | READ — paginated |
| 26 | `list_client_connections` | `GET /SEMP/v2/monitor/msgVpns/{vpn}/clientUsernames/{username}/connections` | READ — paginated, keyed on username not client name |
| 27 | `disconnect_client` | `POST /SEMP/v2/action/msgVpns/{vpn}/clients/{clientName}/disconnect` | WRITE — dry-run by default; client may reconnect immediately |
| 28 | `clear_client_stats` | `POST /SEMP/v2/action/msgVpns/{vpn}/clients/{clientName}/clearStats` | WRITE — resets all stat counters for the client |

---

## 5. ACL Profiles

| # | Tool | SEMP endpoint | Tier |
|---|------|---------------|------|
| 29 | `list_acl_profiles` | `GET /SEMP/v2/config/msgVpns/{vpn}/aclProfiles` | READ — paginated |
| 30 | `get_acl_profile` | `GET /SEMP/v2/config/msgVpns/{vpn}/aclProfiles/{name}` | READ |
| 31 | `create_acl_profile` | `POST /SEMP/v2/config/msgVpns/{vpn}/aclProfiles` | WRITE — dry-run by default |
| 32 | `update_acl_profile` | `PATCH /SEMP/v2/config/msgVpns/{vpn}/aclProfiles/{name}` | WRITE — dry-run by default |
| 33 | `delete_acl_profile` | `DELETE /SEMP/v2/config/msgVpns/{vpn}/aclProfiles/{name}` | DELETE — dry-run by default |

---

## 6. Client Usernames

| # | Tool | SEMP endpoint | Tier |
|---|------|---------------|------|
| 34 | `list_client_usernames` | `GET /SEMP/v2/config/msgVpns/{vpn}/clientUsernames` | READ — paginated |
| 35 | `get_client_username` | `GET /SEMP/v2/config/msgVpns/{vpn}/clientUsernames/{name}` | READ |
| 36 | `create_client_username` | `POST /SEMP/v2/config/msgVpns/{vpn}/clientUsernames` | WRITE — dry-run by default |
| 37 | `update_client_username` | `PATCH /SEMP/v2/config/msgVpns/{vpn}/clientUsernames/{name}` | WRITE — dry-run by default |
| 38 | `delete_client_username` | `DELETE /SEMP/v2/config/msgVpns/{vpn}/clientUsernames/{name}` | DELETE — dry-run by default |

---

## 7. Client Profiles

| # | Tool | SEMP endpoint | Tier |
|---|------|---------------|------|
| 39 | `list_client_profiles` | `GET /SEMP/v2/config/msgVpns/{vpn}/clientProfiles` | READ — paginated |
| 40 | `get_client_profile` | `GET /SEMP/v2/config/msgVpns/{vpn}/clientProfiles/{name}` | READ |
| 41 | `create_client_profile` | `POST /SEMP/v2/config/msgVpns/{vpn}/clientProfiles` | WRITE — dry-run by default |
| 42 | `update_client_profile` | `PATCH /SEMP/v2/config/msgVpns/{vpn}/clientProfiles/{name}` | WRITE — dry-run by default |
| 43 | `delete_client_profile` | `DELETE /SEMP/v2/config/msgVpns/{vpn}/clientProfiles/{name}` | DELETE — dry-run by default |

---

## 8. Diagnostics

These tools call `GET /SEMP/v2/monitor/msgVpns/{vpn}/queues` (up to 500 queues) and apply client-side filtering and ranking. No dedicated SEMP diagnostic endpoint is used.

| # | Tool | Filter logic | Output |
|---|------|--------------|--------|
| 44 | `find_backlogged_queues` | Queues where spool usage >= `spool_threshold_percent` (default 80%) | Sorted by usage %, descending |
| 45 | `find_idle_consumers` | Queues with at least one consumer (`bindCount > 0`) AND spooled messages (`spooledMsgCount > 0`) | Queue name, bind count, message count |
| 46 | `detect_message_lag` | All queues with any spooled messages | Sorted by message count; severity HIGH (>1000), MEDIUM (>100), LOW (>0) |

---

## 9. Passthrough

| # | Tool | SEMP endpoint | Notes |
|---|------|---------------|-------|
| 47 | `semp_request` | Any — caller specifies `api`, `method`, `path`, `body` | Gated by `SEMP_PASSTHROUGH_MODE`. In `monitor_only` mode the schema is narrowed to `GET` + `monitor` only. WRITE/DELETE operations require `confirm: true`. Paths containing `..` are rejected. |
