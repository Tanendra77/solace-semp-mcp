import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from '../brokers/registry';
import { SempClient } from '../semp/client';

function nextCursor(nextPageUri?: string): string | undefined {
  if (!nextPageUri) return undefined;
  try { return new URL(nextPageUri, 'http://x').searchParams.get('cursor') ?? undefined; }
  catch { return undefined; }
}

export async function handleGetBrokerStats(registry: BrokerRegistry, brokerName: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/about' });
  return JSON.stringify(result.data, null, 2);
}

export async function handleGetBrokerHealth(registry: BrokerRegistry, brokerName: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const client = new SempClient(broker);
  const [about, api] = await Promise.all([
    client.request({ api: 'monitor', method: 'GET', path: '/about' }),
    client.request({ api: 'monitor', method: 'GET', path: '/about/api' }),
  ]);
  return JSON.stringify({ health: about.data, api: api.data }, null, 2);
}

export async function handleGetRedundancyStatus(registry: BrokerRegistry, brokerName: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/about' });
  return JSON.stringify(result.data, null, 2);
}

export async function handleGetConfigSyncStatus(registry: BrokerRegistry, brokerName: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/configSyncLocalDatabaseRows' });
  return JSON.stringify(result.data, null, 2);
}

export async function handleListVpns(registry: BrokerRegistry, brokerName: string, limit: number, cursor?: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const params: Record<string, string | number> = { count: limit };
  if (cursor) params['cursor'] = cursor;
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/msgVpns', params });
  const data = result.data as unknown[];
  let text = JSON.stringify(data, null, 2);
  const next = nextCursor(result.meta?.paging?.nextPageUri);
  if (next) text += `\n\nMore results available. Use cursor="${next}" for the next page.`;
  return text;
}

export async function handleGetVpnStats(registry: BrokerRegistry, brokerName: string, vpn: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}` });
  return JSON.stringify(result.data, null, 2);
}

export function registerMonitorTools(server: McpServer, registry: BrokerRegistry): void {
  server.tool('get_broker_stats', 'Raw broker statistics from /about endpoint.',
    { broker: z.string() },
    async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetBrokerStats(registry, broker) }] }));
  server.tool('get_broker_health', 'Broker health: uptime, memory, client count, message rates. Use this to check if the broker is healthy.',
    { broker: z.string() },
    async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetBrokerHealth(registry, broker) }] }));
  server.tool('get_redundancy_status', 'HA redundancy status — role (primary/backup), standby connection, replication state.',
    { broker: z.string() },
    async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetRedundancyStatus(registry, broker) }] }));
  server.tool('get_config_sync_status', 'Config sync status between HA peers.',
    { broker: z.string() },
    async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetConfigSyncStatus(registry, broker) }] }));
  server.tool('list_vpns', 'List message VPNs on the broker.',
    { broker: z.string(), limit: z.number().int().min(1).max(500).default(50), cursor: z.string().optional() },
    async ({ broker, limit, cursor }) => ({ content: [{ type: 'text', text: await handleListVpns(registry, broker, limit, cursor) }] }));
  server.tool('get_vpn_stats', 'Detailed stats for a specific VPN.',
    { broker: z.string(), vpn: z.string() },
    async ({ broker, vpn }) => ({ content: [{ type: 'text', text: await handleGetVpnStats(registry, broker, vpn) }] }));
}
