"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListBrokers = handleListBrokers;
exports.handleAddBroker = handleAddBroker;
exports.handleRemoveBroker = handleRemoveBroker;
exports.handleGetBrokerVersion = handleGetBrokerVersion;
exports.handleDescribeBroker = handleDescribeBroker;
exports.registerBrokerTools = registerBrokerTools;
const zod_1 = require("zod");
const client_1 = require("../semp/client");
const confirmation_1 = require("../safety/confirmation");
async function handleListBrokers(registry) {
    const brokers = registry.list();
    if (brokers.length === 0)
        return 'No brokers registered. Use add_broker to register a broker first.';
    return JSON.stringify(brokers, null, 2);
}
async function handleAddBroker(registry, params) {
    registry.add(params);
    return `Broker "${params.name}" (${params.label}) registered (in-memory only — lost on restart).`;
}
async function handleRemoveBroker(registry, name, confirm) {
    const broker = registry.getOrThrow(name);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.DELETE, action: `remove broker "${name}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: 'N/A — removes from in-memory registry',
            effect: `Removes "${name}" from registry. All sessions lose access immediately.`,
        });
    }
    registry.remove(name);
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Removed broker "${name}"`, 'OK');
}
async function handleGetBrokerVersion(registry, brokerName) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/about/api' });
    return JSON.stringify(result.data, null, 2);
}
async function handleDescribeBroker(registry, brokerName) {
    const broker = registry.getOrThrow(brokerName);
    const client = new client_1.SempClient(broker);
    const [about, vpns] = await Promise.all([
        client.request({ api: 'monitor', method: 'GET', path: '/about' }),
        client.request({ api: 'monitor', method: 'GET', path: '/msgVpns', params: { count: 100 } }),
    ]);
    return JSON.stringify({ broker: { name: broker.name, label: broker.label }, about: about.data, vpns: vpns.data }, null, 2);
}
function registerBrokerTools(server, registry) {
    server.tool('list_brokers', 'List all registered brokers — name, label, url only. Credentials never exposed.', {}, async () => ({ content: [{ type: 'text', text: await handleListBrokers(registry) }] }));
    server.tool('add_broker', 'Register a broker in-memory (lost on restart).', {
        name: zod_1.z.string(),
        label: zod_1.z.string(),
        url: zod_1.z.string().url().refine(v => /^https?:\/\//i.test(v), 'Broker URL must use http or https'),
        username: zod_1.z.string(),
        password: zod_1.z.string(),
    }, async (p) => ({ content: [{ type: 'text', text: await handleAddBroker(registry, p) }] }));
    server.tool('remove_broker', 'Remove a broker from registry. dry_run by default — set confirm: true to execute.', { name: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ name, confirm }) => ({ content: [{ type: 'text', text: await handleRemoveBroker(registry, name, confirm) }] }));
    server.tool('get_broker_version', 'PubSub+ version, SEMP version, uptime.', { broker: zod_1.z.string() }, async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetBrokerVersion(registry, broker) }] }));
    server.tool('describe_broker', 'High-level broker summary: VPNs, clients, queues, message rates. Good starting point.', { broker: zod_1.z.string() }, async ({ broker }) => ({ content: [{ type: 'text', text: await handleDescribeBroker(registry, broker) }] }));
}
//# sourceMappingURL=broker-tools.js.map