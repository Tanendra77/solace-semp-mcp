import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BrokerRegistry } from '../brokers/registry';
import { SempClient } from '../semp/client';
import { RiskTier, buildDryRunResponse, buildExecutedResponse } from '../safety/confirmation';

export async function handleListClients(registry: BrokerRegistry, brokerName: string, vpn: string, limit: number, offset: number): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/clients`, params: { count: limit } });
  const data = result.data as unknown[];
  let text = JSON.stringify(data, null, 2);
  const total = result.meta?.count;
  if (total !== undefined && total > limit) text += `\n\nReturned ${data.length} of ${total}. Use offset=${offset + limit} for the next page.`;
  return text;
}

export async function handleGetClientDetails(registry: BrokerRegistry, brokerName: string, vpn: string, clientName: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/clients/${clientName}` });
  return JSON.stringify(result.data, null, 2);
}

export async function handleListClientSubscriptions(registry: BrokerRegistry, brokerName: string, vpn: string, clientName: string, limit: number, offset: number): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/clients/${clientName}/subscriptions`, params: { count: limit } });
  const data = result.data as unknown[];
  let text = JSON.stringify(data, null, 2);
  const total = result.meta?.count;
  if (total !== undefined && total > limit) text += `\n\nReturned ${data.length} of ${total}. Use offset=${offset + limit} for the next page.`;
  return text;
}

export async function handleListClientConnections(registry: BrokerRegistry, brokerName: string, vpn: string, username: string, limit: number, offset: number): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/clientUsernames/${username}/connections`, params: { count: limit } });
  const data = result.data as unknown[];
  let text = JSON.stringify(data, null, 2);
  const total = result.meta?.count;
  if (total !== undefined && total > limit) text += `\n\nReturned ${data.length} of ${total}. Use offset=${offset + limit} for the next page.`;
  return text;
}

export async function handleDisconnectClient(registry: BrokerRegistry, brokerName: string, vpn: string, clientName: string, confirm: boolean): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  if (!confirm) {
    return buildDryRunResponse({
      tier: RiskTier.WRITE, action: `disconnect client "${clientName}" on VPN "${vpn}"`,
      brokerName: broker.name, brokerLabel: broker.label,
      sempEndpoint: `POST /SEMP/v2/action/msgVpns/${vpn}/clients/${clientName}/disconnect`,
      effect: 'Force-disconnects client. The client may reconnect immediately.',
    });
  }
  await new SempClient(broker).request({ api: 'action', method: 'POST', path: `/msgVpns/${vpn}/clients/${clientName}/disconnect`, body: {} });
  return buildExecutedResponse(broker.name, broker.label, `Disconnected client "${clientName}"`, '200 OK');
}

export async function handleClearClientStats(registry: BrokerRegistry, brokerName: string, vpn: string, clientName: string, confirm: boolean): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  if (!confirm) {
    return buildDryRunResponse({
      tier: RiskTier.WRITE, action: `clear stats for client "${clientName}" on VPN "${vpn}"`,
      brokerName: broker.name, brokerLabel: broker.label,
      sempEndpoint: `POST /SEMP/v2/action/msgVpns/${vpn}/clients/${clientName}/clearStats`,
      effect: 'Resets all statistics counters for this client. Counters start from zero.',
    });
  }
  await new SempClient(broker).request({ api: 'action', method: 'POST', path: `/msgVpns/${vpn}/clients/${clientName}/clearStats`, body: {} });
  return buildExecutedResponse(broker.name, broker.label, `Cleared stats for client "${clientName}"`, '200 OK');
}

export function registerClientTools(server: McpServer, registry: BrokerRegistry): void {
  server.tool('list_clients', 'List connected clients on a VPN. Paginated.',
    { broker: z.string(), vpn: z.string(), limit: z.number().int().min(1).max(500).default(50), offset: z.number().int().min(0).default(0) },
    async ({ broker, vpn, limit, offset }) => ({ content: [{ type: 'text', text: await handleListClients(registry, broker, vpn, limit, offset) }] }));
  server.tool('get_client_details', 'Detailed info for a specific client connection.',
    { broker: z.string(), vpn: z.string(), client_name: z.string() },
    async ({ broker, vpn, client_name }) => ({ content: [{ type: 'text', text: await handleGetClientDetails(registry, broker, vpn, client_name) }] }));
  server.tool('list_client_subscriptions', 'Topic subscriptions for a client. Paginated.',
    { broker: z.string(), vpn: z.string(), client_name: z.string(), limit: z.number().int().min(1).max(500).default(50), offset: z.number().int().min(0).default(0) },
    async ({ broker, vpn, client_name, limit, offset }) => ({ content: [{ type: 'text', text: await handleListClientSubscriptions(registry, broker, vpn, client_name, limit, offset) }] }));
  server.tool('list_client_connections', 'Connections for a client username. Paginated.',
    { broker: z.string(), vpn: z.string(), username: z.string(), limit: z.number().int().min(1).max(500).default(50), offset: z.number().int().min(0).default(0) },
    async ({ broker, vpn, username, limit, offset }) => ({ content: [{ type: 'text', text: await handleListClientConnections(registry, broker, vpn, username, limit, offset) }] }));
  server.tool('disconnect_client', 'Force-disconnect a client. dry_run by default.',
    { broker: z.string(), vpn: z.string(), client_name: z.string(), confirm: z.boolean().default(false) },
    async ({ broker, vpn, client_name, confirm }) => ({ content: [{ type: 'text', text: await handleDisconnectClient(registry, broker, vpn, client_name, confirm) }] }));
  server.tool('clear_client_stats', 'Reset client statistics. dry_run by default.',
    { broker: z.string(), vpn: z.string(), client_name: z.string(), confirm: z.boolean().default(false) },
    async ({ broker, vpn, client_name, confirm }) => ({ content: [{ type: 'text', text: await handleClearClientStats(registry, broker, vpn, client_name, confirm) }] }));
}
