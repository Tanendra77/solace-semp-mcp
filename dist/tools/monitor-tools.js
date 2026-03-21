"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetBrokerStats = handleGetBrokerStats;
exports.handleGetBrokerHealth = handleGetBrokerHealth;
exports.handleGetRedundancyStatus = handleGetRedundancyStatus;
exports.handleGetConfigSyncStatus = handleGetConfigSyncStatus;
exports.handleListVpns = handleListVpns;
exports.handleGetVpnStats = handleGetVpnStats;
exports.registerMonitorTools = registerMonitorTools;
const zod_1 = require("zod");
const client_1 = require("../semp/client");
async function handleGetBrokerStats(registry, brokerName) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/about' });
    return JSON.stringify(result.data, null, 2);
}
async function handleGetBrokerHealth(registry, brokerName) {
    const broker = registry.getOrThrow(brokerName);
    const client = new client_1.SempClient(broker);
    const [about, api] = await Promise.all([
        client.request({ api: 'monitor', method: 'GET', path: '/about' }),
        client.request({ api: 'monitor', method: 'GET', path: '/about/api' }),
    ]);
    return JSON.stringify({ health: about.data, api: api.data }, null, 2);
}
async function handleGetRedundancyStatus(registry, brokerName) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/about' });
    return JSON.stringify(result.data, null, 2);
}
async function handleGetConfigSyncStatus(registry, brokerName) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/configSyncLocalDatabaseRows' });
    return JSON.stringify(result.data, null, 2);
}
async function handleListVpns(registry, brokerName, limit, offset) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({
        api: 'monitor', method: 'GET', path: '/msgVpns',
        params: offset > 0 ? { count: limit, cursor: String(offset) } : { count: limit },
    });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const total = result.meta?.count;
    if (total !== undefined && total > limit) {
        text += `\n\nReturned ${data.length} of ${total}. Use offset=${offset + limit} for the next page.`;
    }
    return text;
}
async function handleGetVpnStats(registry, brokerName, vpn) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}` });
    return JSON.stringify(result.data, null, 2);
}
function registerMonitorTools(server, registry) {
    server.tool('get_broker_stats', 'Raw broker statistics from /about endpoint.', { broker: zod_1.z.string() }, async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetBrokerStats(registry, broker) }] }));
    server.tool('get_broker_health', 'Broker health: uptime, memory, client count, message rates. Use this to check if the broker is healthy.', { broker: zod_1.z.string() }, async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetBrokerHealth(registry, broker) }] }));
    server.tool('get_redundancy_status', 'HA redundancy status — role (primary/backup), standby connection, replication state.', { broker: zod_1.z.string() }, async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetRedundancyStatus(registry, broker) }] }));
    server.tool('get_config_sync_status', 'Config sync status between HA peers.', { broker: zod_1.z.string() }, async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetConfigSyncStatus(registry, broker) }] }));
    server.tool('list_vpns', 'List message VPNs on the broker.', { broker: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), offset: zod_1.z.number().int().min(0).default(0) }, async ({ broker, limit, offset }) => ({ content: [{ type: 'text', text: await handleListVpns(registry, broker, limit, offset) }] }));
    server.tool('get_vpn_stats', 'Detailed stats for a specific VPN.', { broker: zod_1.z.string(), vpn: zod_1.z.string() }, async ({ broker, vpn }) => ({ content: [{ type: 'text', text: await handleGetVpnStats(registry, broker, vpn) }] }));
}
//# sourceMappingURL=monitor-tools.js.map