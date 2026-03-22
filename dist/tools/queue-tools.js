"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListQueues = handleListQueues;
exports.handleGetQueueStats = handleGetQueueStats;
exports.handleListQueueSubscriptions = handleListQueueSubscriptions;
exports.handleListQueueConsumers = handleListQueueConsumers;
exports.handleListQueueMessages = handleListQueueMessages;
exports.handleGetQueueConfig = handleGetQueueConfig;
exports.handleCreateQueue = handleCreateQueue;
exports.handleUpdateQueueConfig = handleUpdateQueueConfig;
exports.handleDeleteQueue = handleDeleteQueue;
exports.handleClearQueue = handleClearQueue;
exports.registerQueueTools = registerQueueTools;
const zod_1 = require("zod");
const client_1 = require("../semp/client");
const confirmation_1 = require("../safety/confirmation");
function nextCursor(nextPageUri) {
    if (!nextPageUri)
        return undefined;
    try {
        return new URL(nextPageUri, 'http://x').searchParams.get('cursor') ?? undefined;
    }
    catch {
        return undefined;
    }
}
const DEFAULT_PAYLOAD_LIMIT = 2048;
function truncatePayload(payload, limitBytes) {
    if (typeof payload !== 'string' || payload.length <= limitBytes)
        return { payload };
    return { payload_preview: payload.slice(0, limitBytes) + '...', payload_truncated: true, payload_original_size: payload.length };
}
async function handleListQueues(registry, brokerName, vpn, limit, cursor) {
    const broker = registry.getOrThrow(brokerName);
    const params = { count: limit };
    if (cursor)
        params['cursor'] = cursor;
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues`, params });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const next = nextCursor(result.meta?.paging?.nextPageUri);
    if (next)
        text += `\n\nMore results available. Use cursor="${next}" for the next page.`;
    return text;
}
async function handleGetQueueStats(registry, brokerName, vpn, queue) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}` });
    return JSON.stringify(result.data, null, 2);
}
async function handleListQueueSubscriptions(registry, brokerName, vpn, queue, limit, cursor) {
    const broker = registry.getOrThrow(brokerName);
    const params = { count: limit };
    if (cursor)
        params['cursor'] = cursor;
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}/subscriptions`, params });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const next = nextCursor(result.meta?.paging?.nextPageUri);
    if (next)
        text += `\n\nMore results available. Use cursor="${next}" for the next page.`;
    return text;
}
async function handleListQueueConsumers(registry, brokerName, vpn, queue) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}/txFlows` });
    return JSON.stringify(result.data, null, 2);
}
async function handleListQueueMessages(registry, brokerName, vpn, queue, maxMessages) {
    const broker = registry.getOrThrow(brokerName);
    const cappedMax = Math.min(maxMessages, 100);
    const payloadLimit = parseInt(process.env['MESSAGE_PAYLOAD_PREVIEW_BYTES'] ?? String(DEFAULT_PAYLOAD_LIMIT), 10);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}/msgs`, params: { count: cappedMax } });
    const msgs = result.data;
    const processed = msgs.map(msg => ({ ...msg, ...truncatePayload(msg['payload'], isNaN(payloadLimit) ? DEFAULT_PAYLOAD_LIMIT : payloadLimit) }));
    return JSON.stringify(processed, null, 2);
}
async function handleGetQueueConfig(registry, brokerName, vpn, queue) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}` });
    return JSON.stringify(result.data, null, 2);
}
async function handleCreateQueue(registry, brokerName, vpn, config, confirm) {
    const broker = registry.getOrThrow(brokerName);
    const queueName = String(config['queueName'] ?? 'unknown');
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `create queue "${queueName}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `POST /SEMP/v2/config/msgVpns/${vpn}/queues`,
            effect: `Creates queue "${queueName}" on VPN "${vpn}".`,
        });
    }
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'POST', path: `/msgVpns/${vpn}/queues`, body: config });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Created queue "${queueName}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}
async function handleUpdateQueueConfig(registry, brokerName, vpn, queue, config, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `update queue "${queue}" config on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `PATCH /SEMP/v2/config/msgVpns/${vpn}/queues/${queue}`,
            effect: `Updates configuration for queue "${queue}".`,
        });
    }
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'PATCH', path: `/msgVpns/${vpn}/queues/${queue}`, body: config });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Updated queue "${queue}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}
async function handleDeleteQueue(registry, brokerName, vpn, queue, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.DELETE, action: `delete queue "${queue}" from VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `DELETE /SEMP/v2/config/msgVpns/${vpn}/queues/${queue}`,
            effect: `Permanently deletes queue "${queue}" and all its messages from VPN "${vpn}".`,
        });
    }
    await new client_1.SempClient(broker).request({ api: 'config', method: 'DELETE', path: `/msgVpns/${vpn}/queues/${queue}` });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Deleted queue "${queue}"`, '200 OK');
}
async function handleClearQueue(registry, brokerName, vpn, queue, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.DELETE, action: `clear all messages from queue "${queue}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `POST /SEMP/v2/action/msgVpns/${vpn}/queues/${queue}/deleteMsgs`,
            effect: `Deletes ALL messages from queue "${queue}". This cannot be undone.`,
        });
    }
    await new client_1.SempClient(broker).request({ api: 'action', method: 'POST', path: `/msgVpns/${vpn}/queues/${queue}/deleteMsgs`, body: {} });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Cleared all messages from queue "${queue}"`, '200 OK');
}
function registerQueueTools(server, registry) {
    server.tool('list_queues', 'List queues on a VPN. Paginated.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), cursor: zod_1.z.string().optional() }, async ({ broker, vpn, limit, cursor }) => ({ content: [{ type: 'text', text: await handleListQueues(registry, broker, vpn, limit, cursor) }] }));
    server.tool('get_queue_stats', 'Queue statistics: message count, consumer count, spool usage.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string() }, async ({ broker, vpn, queue }) => ({ content: [{ type: 'text', text: await handleGetQueueStats(registry, broker, vpn, queue) }] }));
    server.tool('list_queue_subscriptions', 'Topic subscriptions on a queue. Paginated.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), cursor: zod_1.z.string().optional() }, async ({ broker, vpn, queue, limit, cursor }) => ({ content: [{ type: 'text', text: await handleListQueueSubscriptions(registry, broker, vpn, queue, limit, cursor) }] }));
    server.tool('list_queue_consumers', 'Active consumer connections on a queue.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string() }, async ({ broker, vpn, queue }) => ({ content: [{ type: 'text', text: await handleListQueueConsumers(registry, broker, vpn, queue) }] }));
    server.tool('list_queue_messages', 'Browse messages in a queue. Payloads truncated at MESSAGE_PAYLOAD_PREVIEW_BYTES.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string(), max_messages: zod_1.z.number().int().min(1).max(100).default(20) }, async ({ broker, vpn, queue, max_messages }) => ({ content: [{ type: 'text', text: await handleListQueueMessages(registry, broker, vpn, queue, max_messages) }] }));
    server.tool('get_queue_config', 'Queue configuration from the config API.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string() }, async ({ broker, vpn, queue }) => ({ content: [{ type: 'text', text: await handleGetQueueConfig(registry, broker, vpn, queue) }] }));
    server.tool('create_queue', 'Create a queue. dry_run by default — set confirm: true to execute.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, config, confirm }) => ({ content: [{ type: 'text', text: await handleCreateQueue(registry, broker, vpn, config, confirm) }] }));
    server.tool('update_queue_config', 'Update queue configuration. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string(), config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, queue, config, confirm }) => ({ content: [{ type: 'text', text: await handleUpdateQueueConfig(registry, broker, vpn, queue, config, confirm) }] }));
    server.tool('delete_queue', 'Delete a queue and all its messages. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, queue, confirm }) => ({ content: [{ type: 'text', text: await handleDeleteQueue(registry, broker, vpn, queue, confirm) }] }));
    server.tool('clear_queue', 'Delete all messages in a queue (purge). dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, queue, confirm }) => ({ content: [{ type: 'text', text: await handleClearQueue(registry, broker, vpn, queue, confirm) }] }));
    server.tool('purge_queue', 'Alias for clear_queue — delete all messages in a queue.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), queue: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, queue, confirm }) => ({ content: [{ type: 'text', text: await handleClearQueue(registry, broker, vpn, queue, confirm) }] }));
}
//# sourceMappingURL=queue-tools.js.map