"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListAclProfiles = handleListAclProfiles;
exports.handleGetAclProfile = handleGetAclProfile;
exports.handleCreateAclProfile = handleCreateAclProfile;
exports.handleUpdateAclProfile = handleUpdateAclProfile;
exports.handleDeleteAclProfile = handleDeleteAclProfile;
exports.handleListClientUsernames = handleListClientUsernames;
exports.handleGetClientUsername = handleGetClientUsername;
exports.handleCreateClientUsername = handleCreateClientUsername;
exports.handleUpdateClientUsername = handleUpdateClientUsername;
exports.handleDeleteClientUsername = handleDeleteClientUsername;
exports.handleListClientProfiles = handleListClientProfiles;
exports.handleGetClientProfile = handleGetClientProfile;
exports.handleCreateClientProfile = handleCreateClientProfile;
exports.handleUpdateClientProfile = handleUpdateClientProfile;
exports.handleDeleteClientProfile = handleDeleteClientProfile;
exports.registerAclTools = registerAclTools;
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
// --- ACL Profile READ tools ---
async function handleListAclProfiles(registry, brokerName, vpn, limit, cursor) {
    const broker = registry.getOrThrow(brokerName);
    const params = { count: limit };
    if (cursor)
        params['cursor'] = cursor;
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'GET', path: `/msgVpns/${vpn}/aclProfiles`, params });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const next = nextCursor(result.meta?.paging?.nextPageUri);
    if (next)
        text += `\n\nMore results available. Use cursor="${next}" for the next page.`;
    return text;
}
async function handleGetAclProfile(registry, brokerName, vpn, name) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'GET', path: `/msgVpns/${vpn}/aclProfiles/${name}` });
    return JSON.stringify(result.data, null, 2);
}
// --- ACL Profile WRITE/DELETE tools ---
async function handleCreateAclProfile(registry, brokerName, vpn, config, confirm) {
    const broker = registry.getOrThrow(brokerName);
    const profileName = String(config['aclProfileName'] ?? 'unknown');
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `create ACL profile "${profileName}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `POST /SEMP/v2/config/msgVpns/${vpn}/aclProfiles`,
            effect: `Creates ACL profile "${profileName}".`,
        });
    }
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'POST', path: `/msgVpns/${vpn}/aclProfiles`, body: config });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Created ACL profile "${profileName}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}
async function handleUpdateAclProfile(registry, brokerName, vpn, name, config, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `update ACL profile "${name}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `PATCH /SEMP/v2/config/msgVpns/${vpn}/aclProfiles/${name}`,
            effect: `Updates ACL profile "${name}".`,
        });
    }
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'PATCH', path: `/msgVpns/${vpn}/aclProfiles/${name}`, body: config });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Updated ACL profile "${name}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}
async function handleDeleteAclProfile(registry, brokerName, vpn, name, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.DELETE, action: `delete ACL profile "${name}" from VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `DELETE /SEMP/v2/config/msgVpns/${vpn}/aclProfiles/${name}`,
            effect: `Permanently deletes ACL profile "${name}".`,
        });
    }
    await new client_1.SempClient(broker).request({ api: 'config', method: 'DELETE', path: `/msgVpns/${vpn}/aclProfiles/${name}` });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Deleted ACL profile "${name}"`, '200 OK');
}
// --- Client Username READ tools ---
async function handleListClientUsernames(registry, brokerName, vpn, limit, cursor) {
    const broker = registry.getOrThrow(brokerName);
    const params = { count: limit };
    if (cursor)
        params['cursor'] = cursor;
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'GET', path: `/msgVpns/${vpn}/clientUsernames`, params });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const next = nextCursor(result.meta?.paging?.nextPageUri);
    if (next)
        text += `\n\nMore results available. Use cursor="${next}" for the next page.`;
    return text;
}
async function handleGetClientUsername(registry, brokerName, vpn, name) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'GET', path: `/msgVpns/${vpn}/clientUsernames/${name}` });
    return JSON.stringify(result.data, null, 2);
}
// --- Client Username WRITE/DELETE tools ---
async function handleCreateClientUsername(registry, brokerName, vpn, config, confirm) {
    const broker = registry.getOrThrow(brokerName);
    const username = String(config['clientUsername'] ?? 'unknown');
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `create client username "${username}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `POST /SEMP/v2/config/msgVpns/${vpn}/clientUsernames`,
            effect: `Creates client username "${username}".`,
        });
    }
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'POST', path: `/msgVpns/${vpn}/clientUsernames`, body: config });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Created client username "${username}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}
async function handleUpdateClientUsername(registry, brokerName, vpn, name, config, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `update client username "${name}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `PATCH /SEMP/v2/config/msgVpns/${vpn}/clientUsernames/${name}`,
            effect: `Updates client username "${name}".`,
        });
    }
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'PATCH', path: `/msgVpns/${vpn}/clientUsernames/${name}`, body: config });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Updated client username "${name}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}
async function handleDeleteClientUsername(registry, brokerName, vpn, name, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.DELETE, action: `delete client username "${name}" from VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `DELETE /SEMP/v2/config/msgVpns/${vpn}/clientUsernames/${name}`,
            effect: `Permanently deletes client username "${name}".`,
        });
    }
    await new client_1.SempClient(broker).request({ api: 'config', method: 'DELETE', path: `/msgVpns/${vpn}/clientUsernames/${name}` });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Deleted client username "${name}"`, '200 OK');
}
// --- Client Profile READ tools ---
async function handleListClientProfiles(registry, brokerName, vpn, limit, cursor) {
    const broker = registry.getOrThrow(brokerName);
    const params = { count: limit };
    if (cursor)
        params['cursor'] = cursor;
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'GET', path: `/msgVpns/${vpn}/clientProfiles`, params });
    const data = result.data;
    let text = JSON.stringify(data, null, 2);
    const next = nextCursor(result.meta?.paging?.nextPageUri);
    if (next)
        text += `\n\nMore results available. Use cursor="${next}" for the next page.`;
    return text;
}
async function handleGetClientProfile(registry, brokerName, vpn, name) {
    const broker = registry.getOrThrow(brokerName);
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'GET', path: `/msgVpns/${vpn}/clientProfiles/${name}` });
    return JSON.stringify(result.data, null, 2);
}
// --- Client Profile WRITE/DELETE tools ---
async function handleCreateClientProfile(registry, brokerName, vpn, config, confirm) {
    const broker = registry.getOrThrow(brokerName);
    const profileName = String(config['clientProfileName'] ?? 'unknown');
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `create client profile "${profileName}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `POST /SEMP/v2/config/msgVpns/${vpn}/clientProfiles`,
            effect: `Creates client profile "${profileName}".`,
        });
    }
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'POST', path: `/msgVpns/${vpn}/clientProfiles`, body: config });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Created client profile "${profileName}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}
async function handleUpdateClientProfile(registry, brokerName, vpn, name, config, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.WRITE, action: `update client profile "${name}" on VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `PATCH /SEMP/v2/config/msgVpns/${vpn}/clientProfiles/${name}`,
            effect: `Updates client profile "${name}".`,
        });
    }
    const result = await new client_1.SempClient(broker).request({ api: 'config', method: 'PATCH', path: `/msgVpns/${vpn}/clientProfiles/${name}`, body: config });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Updated client profile "${name}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}
async function handleDeleteClientProfile(registry, brokerName, vpn, name, confirm) {
    const broker = registry.getOrThrow(brokerName);
    if (!confirm) {
        return (0, confirmation_1.buildDryRunResponse)({
            tier: confirmation_1.RiskTier.DELETE, action: `delete client profile "${name}" from VPN "${vpn}"`,
            brokerName: broker.name, brokerLabel: broker.label,
            sempEndpoint: `DELETE /SEMP/v2/config/msgVpns/${vpn}/clientProfiles/${name}`,
            effect: `Permanently deletes client profile "${name}".`,
        });
    }
    await new client_1.SempClient(broker).request({ api: 'config', method: 'DELETE', path: `/msgVpns/${vpn}/clientProfiles/${name}` });
    return (0, confirmation_1.buildExecutedResponse)(broker.name, broker.label, `Deleted client profile "${name}"`, '200 OK');
}
// --- Registration ---
function registerAclTools(server, registry) {
    // ACL Profile READ tools
    server.tool('list_acl_profiles', 'List ACL profiles on a VPN. Paginated.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), cursor: zod_1.z.string().optional() }, async ({ broker, vpn, limit, cursor }) => ({ content: [{ type: 'text', text: await handleListAclProfiles(registry, broker, vpn, limit, cursor) }] }));
    server.tool('get_acl_profile', 'Get details of a specific ACL profile.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string() }, async ({ broker, vpn, name }) => ({ content: [{ type: 'text', text: await handleGetAclProfile(registry, broker, vpn, name) }] }));
    // ACL Profile WRITE/DELETE tools
    server.tool('create_acl_profile', 'Create an ACL profile. dry_run by default — set confirm: true to execute.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, config, confirm }) => ({ content: [{ type: 'text', text: await handleCreateAclProfile(registry, broker, vpn, config, confirm) }] }));
    server.tool('update_acl_profile', 'Update an ACL profile. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string(), config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, name, config, confirm }) => ({ content: [{ type: 'text', text: await handleUpdateAclProfile(registry, broker, vpn, name, config, confirm) }] }));
    server.tool('delete_acl_profile', 'Delete an ACL profile. Cannot be undone. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, name, confirm }) => ({ content: [{ type: 'text', text: await handleDeleteAclProfile(registry, broker, vpn, name, confirm) }] }));
    // Client Username READ tools
    server.tool('list_client_usernames', 'List client usernames on a VPN. Paginated.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), cursor: zod_1.z.string().optional() }, async ({ broker, vpn, limit, cursor }) => ({ content: [{ type: 'text', text: await handleListClientUsernames(registry, broker, vpn, limit, cursor) }] }));
    server.tool('get_client_username', 'Get details of a specific client username.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string() }, async ({ broker, vpn, name }) => ({ content: [{ type: 'text', text: await handleGetClientUsername(registry, broker, vpn, name) }] }));
    // Client Username WRITE/DELETE tools
    server.tool('create_client_username', 'Create a client username. dry_run by default — set confirm: true to execute.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, config, confirm }) => ({ content: [{ type: 'text', text: await handleCreateClientUsername(registry, broker, vpn, config, confirm) }] }));
    server.tool('update_client_username', 'Update a client username. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string(), config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, name, config, confirm }) => ({ content: [{ type: 'text', text: await handleUpdateClientUsername(registry, broker, vpn, name, config, confirm) }] }));
    server.tool('delete_client_username', 'Delete a client username. Cannot be undone. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, name, confirm }) => ({ content: [{ type: 'text', text: await handleDeleteClientUsername(registry, broker, vpn, name, confirm) }] }));
    // Client Profile READ tools
    server.tool('list_client_profiles', 'List client profiles on a VPN. Paginated.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), limit: zod_1.z.number().int().min(1).max(500).default(50), cursor: zod_1.z.string().optional() }, async ({ broker, vpn, limit, cursor }) => ({ content: [{ type: 'text', text: await handleListClientProfiles(registry, broker, vpn, limit, cursor) }] }));
    server.tool('get_client_profile', 'Get details of a specific client profile.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string() }, async ({ broker, vpn, name }) => ({ content: [{ type: 'text', text: await handleGetClientProfile(registry, broker, vpn, name) }] }));
    // Client Profile WRITE/DELETE tools
    server.tool('create_client_profile', 'Create a client profile. dry_run by default — set confirm: true to execute.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, config, confirm }) => ({ content: [{ type: 'text', text: await handleCreateClientProfile(registry, broker, vpn, config, confirm) }] }));
    server.tool('update_client_profile', 'Update a client profile. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string(), config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, name, config, confirm }) => ({ content: [{ type: 'text', text: await handleUpdateClientProfile(registry, broker, vpn, name, config, confirm) }] }));
    server.tool('delete_client_profile', 'Delete a client profile. Cannot be undone. dry_run by default.', { broker: zod_1.z.string(), vpn: zod_1.z.string(), name: zod_1.z.string(), confirm: zod_1.z.boolean().default(false) }, async ({ broker, vpn, name, confirm }) => ({ content: [{ type: 'text', text: await handleDeleteClientProfile(registry, broker, vpn, name, confirm) }] }));
}
//# sourceMappingURL=acl-tools.js.map