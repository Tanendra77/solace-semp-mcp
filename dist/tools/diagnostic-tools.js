"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFindBackloggedQueues = handleFindBackloggedQueues;
exports.handleFindIdleConsumers = handleFindIdleConsumers;
exports.handleDetectMessageLag = handleDetectMessageLag;
exports.registerDiagnosticTools = registerDiagnosticTools;
const zod_1 = require("zod");
const client_1 = require("../semp/client");
async function handleFindBackloggedQueues(registry, brokerName, vpn, threshold) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues`, params: { count: 500 } });
    const queues = result.data;
    const backlogged = queues
        .filter(q => {
        const used = Number(q['msgSpoolUsage'] ?? 0);
        const max = Number(q['maxMsgSpoolUsage'] ?? 0);
        return max > 0 && (used / max) * 100 >= threshold;
    })
        .map(q => {
        const used = Number(q['msgSpoolUsage'] ?? 0);
        const max = Number(q['maxMsgSpoolUsage'] ?? 0);
        return { queue: q['queueName'], usagePct: Math.round((used / max) * 100), consumers: q['bindCount'] ?? 0, spooledMsgCount: q['spooledMsgCount'] ?? 0 };
    })
        .sort((a, b) => b.usagePct - a.usagePct);
    if (backlogged.length === 0)
        return `No queues exceed ${threshold}% spool usage on VPN '${vpn}'.`;
    return JSON.stringify(backlogged, null, 2);
}
async function handleFindIdleConsumers(registry, brokerName, vpn) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues`, params: { count: 500 } });
    const queues = result.data;
    const idle = queues
        .filter(q => Number(q['bindCount'] ?? 0) > 0 && Number(q['spooledMsgCount'] ?? 0) > 0)
        .map(q => ({ queue: q['queueName'], bindCount: q['bindCount'], spooledMsgCount: q['spooledMsgCount'] }));
    if (idle.length === 0)
        return `No idle consumers detected on VPN '${vpn}'.`;
    return JSON.stringify(idle, null, 2);
}
async function handleDetectMessageLag(registry, brokerName, vpn) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues`, params: { count: 500 } });
    const queues = result.data;
    const lagging = queues
        .filter(q => Number(q['spooledMsgCount'] ?? 0) > 0)
        .map(q => {
        const count = Number(q['spooledMsgCount']);
        const severity = count > 1000 ? 'HIGH' : count > 100 ? 'MEDIUM' : 'LOW';
        return { queue: q['queueName'], spooledMsgCount: count, severity };
    })
        .sort((a, b) => b.spooledMsgCount - a.spooledMsgCount);
    if (lagging.length === 0)
        return `No message lag detected on VPN '${vpn}'.`;
    return JSON.stringify(lagging, null, 2);
}
function registerDiagnosticTools(server, registry) {
    server.tool('find_backlogged_queues', 'Find queues exceeding a spool usage threshold. Useful for capacity planning.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), spool_threshold_percent: zod_1.z.number().int().min(0).max(100).default(80) }, async ({ broker, vpn, spool_threshold_percent }) => ({ content: [{ type: 'text', text: await handleFindBackloggedQueues(registry, broker, vpn, spool_threshold_percent) }] }));
    server.tool('find_idle_consumers', 'Find queues with consumers that are not draining messages. Useful for diagnosing stuck consumers.', { broker: zod_1.z.string(), vpn: zod_1.z.string() }, async ({ broker, vpn }) => ({ content: [{ type: 'text', text: await handleFindIdleConsumers(registry, broker, vpn) }] }));
    server.tool('detect_message_lag', 'Identify queues with message backlogs. Severity: HIGH (>1000), MEDIUM (>100), LOW (>0).', { broker: zod_1.z.string(), vpn: zod_1.z.string() }, async ({ broker, vpn }) => ({ content: [{ type: 'text', text: await handleDetectMessageLag(registry, broker, vpn) }] }));
}
//# sourceMappingURL=diagnostic-tools.js.map