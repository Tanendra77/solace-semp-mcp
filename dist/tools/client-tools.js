"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListClients = handleListClients;
exports.handleGetClientDetails = handleGetClientDetails;
exports.handleListClientSubscriptions = handleListClientSubscriptions;
exports.handleListClientConnections = handleListClientConnections;
exports.handleDisconnectClient = handleDisconnectClient;
exports.handleClearClientStats = handleClearClientStats;
exports.registerClientTools = registerClientTools;
const zod_1 = require("zod");
const client_1 = require("../semp/client");
const confirmation_1 = require("../safety/confirmation");
async function handleListClients(registry, brokerName, vpn, limit, offset) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/clients`, params: { count: limit } });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const total = result.meta?.count;
    if (total !== undefined && total > limit)
        text += `\n\nReturned ${data.length} of ${total}. Use offset=${offset + limit} for the next page.`;
    return text;
}
async function handleGetClientDetails(registry, brokerName, vpn, clientName) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/clients/${clientName}` });
    return JSON.stringify(result.data, null, 2);
}
async function handleListClientSubscriptions(registry, brokerName, vpn, clientName, limit, offset) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/clients/${clientName}/subscriptions`, params: { count: limit } });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const total = result.meta?.count;
    if (total !== undefined && total > limit)
        text += `\n\nReturned ${data.length} of ${total}. Use offset=${offset + limit} for the next page.`;
    return text;
}
async function handleListClientConnections(registry, brokerName, vpn, username, limit, offset) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/clientUsernames/${username}/connections`, params: { count: limit } });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const total = result.meta?.count;
    if (total !== undefined && total > limit)
        text += `\n\nReturned ${data.length} of ${total}. Use offset=${offset + limit} for the next page.`;
    return text;
}
async function handleDisconnectClient(registry, brokerName, vpn, clientName, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `disconnect client "${clientName}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `POST /SEMP/v2/action/msgVpns/${vpn}/clients/${clientName}/disconnect`,
            effect: 'Force-disconnects client. The client may reconnect immediately.',
        });
    }
    await new client_1.SempClient(broker).request({ api: 'action', method: 'POST', path: `/msgVpns/${vpn}/clients/${clientName}/disconnect`, body: {} });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Disconnected client "${clientName}"`, '200 OK');
}
async function handleClearClientStats(registry, brokerName, vpn, clientName, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `clear stats for client "${clientName}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `POST /SEMP/v2/action/msgVpns/${vpn}/clients/${clientName}/clearStats`,
            effect: 'Resets all statistics counters for this client. Counters start from zero.',
        });
    }
    await new client_1.SempClient(broker).request({ api: 'action', method: 'POST', path: `/msgVpns/${vpn}/clients/${clientName}/clearStats`, body: {} });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Cleared stats for client "${clientName}"`, '200 OK');
}
function registerClientTools(server, registry) {
    server.tool('list_clients', 'List connected clients on a VPN. Paginated.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), offset: zod_1.z.number().int().min(0).default(0) }, async ({ broker, vpn, limit, offset }) => ({ content: [{ type: 'text', text: await handleListClients(registry, broker, vpn, limit, offset) }] }));
    server.tool('get_client_details', 'Detailed info for a specific client connection.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), client_name: zod_1.z.string() }, async ({ broker, vpn, client_name }) => ({ content: [{ type: 'text', text: await handleGetClientDetails(registry, broker, vpn, client_name) }] }));
    server.tool('list_client_subscriptions', 'Topic subscriptions for a client. Paginated.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), client_name: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), offset: zod_1.z.number().int().min(0).default(0) }, async ({ broker, vpn, client_name, limit, offset }) => ({ content: [{ type: 'text', text: await handleListClientSubscriptions(registry, broker, vpn, client_name, limit, offset) }] }));
    server.tool('list_client_connections', 'Connections for a client username. Paginated.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), username: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), offset: zod_1.z.number().int().min(0).default(0) }, async ({ broker, vpn, username, limit, offset }) => ({ content: [{ type: 'text', text: await handleListClientConnections(registry, broker, vpn, username, limit, offset) }] }));
    server.tool('disconnect_client', 'Force-disconnect a client. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), client_name: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, client_name, confirm }) => ({ content: [{ type: 'text', text: await handleDisconnectClient(registry, broker, vpn, client_name, confirm) }] }));
    server.tool('clear_client_stats', 'Reset client statistics. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), client_name: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, client_name, confirm }) => ({ content: [{ type: 'text', text: await handleClearClientStats(registry, broker, vpn, client_name, confirm) }] }));
}
//# sourceMappingURL=client-tools.js.map