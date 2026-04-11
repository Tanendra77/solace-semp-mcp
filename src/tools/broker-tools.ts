import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BrokerRegistry } from '../brokers/registry';
import { SempClient } from '../semp/client';
import { RiskTier, buildDryRunResponse, buildExecutedResponse } from '../safety/confirmation';

const PRIVATE_HOST_RE = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+)$/i;

export function isPrivateUrl(url: string): boolean {
  try {
    return PRIVATE_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export async function handleListBrokers(registry: BrokerRegistry): Promise<string> {
  const brokers = registry.list();
  if (brokers.length === 0) return 'No brokers registered. Use add_broker to register a broker first.';
  return JSON.stringify(brokers, null, 2);
}

export async function handleAddBroker(
  registry: BrokerRegistry,
  params: { name: string; label: string; url: string; username: string; password: string }
): Promise<string> {
  registry.add(params);
  return `Broker "${params.name}" (${params.label}) registered (in-memory only — lost on restart).`;
}

export async function handleRemoveBroker(registry: BrokerRegistry, name: string, confirm: boolean): Promise<string> {
  const broker = registry.getOrThrow(name);
  if (!confirm) {
    return buildDryRunResponse({
      tier: RiskTier.DELETE, action: `remove broker "${name}"`,
      brokerName: broker.name, brokerLabel: broker.label,
      sempEndpoint: 'N/A — removes from in-memory registry',
      effect: `Removes "${name}" from registry. All sessions lose access immediately.`,
    });
  }
  registry.remove(name);
  return buildExecutedResponse(broker.name, broker.label, `Removed broker "${name}"`, 'OK');
}

export async function handleGetBrokerVersion(registry: BrokerRegistry, brokerName: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: '/about/api' });
  return JSON.stringify(result.data, null, 2);
}

export async function handleDescribeBroker(registry: BrokerRegistry, brokerName: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const client = new SempClient(broker);
  const [about, vpns] = await Promise.all([
    client.request({ api: 'monitor', method: 'GET', path: '/about' }),
    client.request({ api: 'monitor', method: 'GET', path: '/msgVpns', params: { count: 100 } }),
  ]);
  return JSON.stringify({ broker: { name: broker.name, label: broker.label }, about: about.data, vpns: vpns.data }, null, 2);
}

export function registerBrokerTools(server: McpServer, registry: BrokerRegistry): void {
  server.tool('list_brokers', 'List all registered brokers — name, label, url only. Credentials never exposed.', {},
    async () => ({ content: [{ type: 'text', text: await handleListBrokers(registry) }] }));
  server.tool('add_broker', 'Register a broker in-memory (lost on restart).',
    {
      name: z.string(),
      label: z.string(),
      url: z.string()
        .url()
        .refine(v => /^https?:\/\//i.test(v), 'Broker URL must use http or https')
        .refine(v => {
          if (process.env['BLOCK_PRIVATE_BROKER_URLS'] !== 'true' && process.env['BLOCK_PRIVATE_BROKER_URLS'] !== '1') return true;
          return !isPrivateUrl(v);
        }, 'Private/loopback URLs are blocked. Unset BLOCK_PRIVATE_BROKER_URLS to allow them.'),
      username: z.string(),
      password: z.string(),
    },
    async (p) => ({ content: [{ type: 'text', text: await handleAddBroker(registry, p) }] }));
  server.tool('remove_broker', 'Remove a broker from registry. dry_run by default — set confirm: true to execute.',
    { name: z.string(), confirm: z.boolean().default(false) },
    async ({ name, confirm }) => ({ content: [{ type: 'text', text: await handleRemoveBroker(registry, name, confirm) }] }));
  server.tool('get_broker_version', 'PubSub+ version, SEMP version, uptime.',
    { broker: z.string() },
    async ({ broker }) => ({ content: [{ type: 'text', text: await handleGetBrokerVersion(registry, broker) }] }));
  server.tool('describe_broker', 'High-level broker summary: VPNs, clients, queues, message rates. Good starting point.',
    { broker: z.string() },
    async ({ broker }) => ({ content: [{ type: 'text', text: await handleDescribeBroker(registry, broker) }] }));
}
