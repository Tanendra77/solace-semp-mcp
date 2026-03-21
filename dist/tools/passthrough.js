"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSempRequest = handleSempRequest;
exports.registerPassthroughTool = registerPassthroughTool;
const zod_1 = require("zod");
const client_1 = require("../semp/client");
const confirmation_1 = require("../safety/confirmation");
async function handleSempRequest(registry, brokerName, api, method, path, body, confirm) {
    const mode = process.env['SEMP_PASSTHROUGH_MODE'] ?? 'advanced';
    if (mode === 'disabled')
        throw new Error('semp_request is disabled. Set SEMP_PASSTHROUGH_MODE=monitor_only or advanced to enable.');
    if (mode === 'monitor_only' && (method.toUpperCase() !== 'GET' || api !== 'monitor'))
        throw new Error('semp_request is restricted in monitor_only mode. Only GET requests to the monitor API are allowed.');
    const broker = registry.getOrThrow(brokerName);
    const tier = (0, confirmation_1.tierFromMethod)(method);
    const endpoint = `${method.toUpperCase()} /SEMP/v2/${api}${path}`;
    if ((0, confirmation_1.requiresConfirmation)(tier) && !confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier, action: `${method.toUpperCase()} ${path}`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: endpoint,
            effect: tier === confirmation_1.RiskTier.DELETE
                ? 'May be irreversible. Review carefully before confirming.'
                : 'Modifies broker state. Note: POST to action API may be irreversible even at WRITE tier.',
        });
    }
    const result = await new client_1.SempClient(broker).request({
        api, method: method.toUpperCase(), path, body,
    });
    if (tier === confirmation_1.RiskTier.READ)
        return JSON.stringify(result.data, null, 2);
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `${method.toUpperCase()} ${path}`, '200 OK') +
        '\n\n' + JSON.stringify(result.data, null, 2);
}
function registerPassthroughTool(server, registry) {
    const mode = process.env['SEMP_PASSTHROUGH_MODE'] ?? 'advanced';
    if (mode === 'disabled')
        return;
    const apiSchema = mode === 'monitor_only'
        ? zod_1.z.enum(['monitor'])
        : zod_1.z.enum(['monitor', 'config', 'action']);
    const methodSchema = mode === 'monitor_only'
        ? zod_1.z.enum(['GET'])
        : zod_1.z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
    server.tool('semp_request', `Advanced escape hatch — raw SEMP call. Mode: ${mode}. ` +
        (mode === 'monitor_only' ? 'Only GET to monitor API allowed.' : 'Full access to all SEMP APIs.') +
        ' POST to action endpoints may be irreversible — review dry_run carefully.', {
        broker: zod_1.z.string(),
        api: apiSchema,
        method: methodSchema,
        path: zod_1.z.string()
            .refine(v => !v.includes('..'), 'Path must not contain ".." segments')
            .describe('Path after /SEMP/v2/{api}, e.g. "/msgVpns/default/queues"'),
        body: zod_1.z.unknown().optional(),
        confirm: zod_1.z.boolean().default(false),
    }, async ({ broker, api, method, path, body, confirm }) => ({
        content: [{ type: 'text', text: await handleSempRequest(registry, broker, api, method, path, body, confirm) }],
    }));
}
//# sourceMappingURL=passthrough.js.map