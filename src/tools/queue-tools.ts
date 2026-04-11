import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BrokerRegistry } from '../brokers/registry';
import { SempClient } from '../semp/client';
import { RiskTier, buildDryRunResponse, buildExecutedResponse, requiresConfirmation } from '../safety/confirmation';

function nextCursor(nextPageUri?: string): string | undefined {
  if (!nextPageUri) return undefined;
  try { return new URL(nextPageUri, 'http://x').searchParams.get('cursor') ?? undefined; }
  catch { return undefined; }
}

const DEFAULT_PAYLOAD_LIMIT = 2048;

function truncatePayload(payload: unknown, limitBytes: number): object {
  if (typeof payload !== 'string') return { payload };
  const buf = Buffer.from(payload, 'utf-8');
  if (buf.byteLength <= limitBytes) return { payload };
  // Truncate at byte boundary, but backtrack if we'd create an incomplete UTF-8 sequence
  let truncateAt = limitBytes;
  while (truncateAt > 0) {
    const truncated = buf.subarray(0, truncateAt);
    const decoded = truncated.toString('utf-8');
    if (Buffer.byteLength(decoded, 'utf-8') === truncateAt) break; // Valid boundary
    truncateAt--;
  }
  return {
    payload_preview: buf.subarray(0, truncateAt).toString('utf-8') + '...',
    payload_truncated: true,
    payload_original_size: buf.byteLength,
  };
}

export async function handleListQueues(registry: BrokerRegistry, brokerName: string, vpn: string, limit: number, cursor?: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const params: Record<string, string | number> = { count: limit };
  if (cursor) params['cursor'] = cursor;
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues`, params });
  const data = result.data as unknown[];
  let text = JSON.stringify(data, null, 2);
  const next = nextCursor(result.meta?.paging?.nextPageUri);
  if (next) text += `\n\nMore results available. Use cursor="${next}" for the next page.`;
  return text;
}

export async function handleGetQueueStats(registry: BrokerRegistry, brokerName: string, vpn: string, queue: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}` });
  return JSON.stringify(result.data, null, 2);
}

export async function handleListQueueSubscriptions(registry: BrokerRegistry, brokerName: string, vpn: string, queue: string, limit: number, cursor?: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const params: Record<string, string | number> = { count: limit };
  if (cursor) params['cursor'] = cursor;
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}/subscriptions`, params });
  const data = result.data as unknown[];
  let text = JSON.stringify(data, null, 2);
  const next = nextCursor(result.meta?.paging?.nextPageUri);
  if (next) text += `\n\nMore results available. Use cursor="${next}" for the next page.`;
  return text;
}

export async function handleListQueueConsumers(registry: BrokerRegistry, brokerName: string, vpn: string, queue: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}/txFlows` });
  return JSON.stringify(result.data, null, 2);
}

export async function handleListQueueMessages(registry: BrokerRegistry, brokerName: string, vpn: string, queue: string, maxMessages: number): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const cappedMax = Math.min(maxMessages, 100);
  const payloadLimit = parseInt(process.env['MESSAGE_PAYLOAD_PREVIEW_BYTES'] ?? String(DEFAULT_PAYLOAD_LIMIT), 10);
  const result = await new SempClient(broker).request({ api: 'monitor', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}/msgs`, params: { count: cappedMax } });
  const msgs = result.data as Array<Record<string, unknown>>;
  const processed = msgs.map(msg => ({ ...msg, ...truncatePayload(msg['payload'], isNaN(payloadLimit) ? DEFAULT_PAYLOAD_LIMIT : payloadLimit) }));
  return JSON.stringify(processed, null, 2);
}

export async function handleGetQueueConfig(registry: BrokerRegistry, brokerName: string, vpn: string, queue: string): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const result = await new SempClient(broker).request({ api: 'config', method: 'GET', path: `/msgVpns/${vpn}/queues/${queue}` });
  return JSON.stringify(result.data, null, 2);
}

export async function handleCreateQueue(registry: BrokerRegistry, brokerName: string, vpn: string, config: Record<string, unknown>, confirm: boolean): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  const queueName = String(config['queueName'] ?? 'unknown');
  if (!confirm) {
    return buildDryRunResponse({
      tier: RiskTier.WRITE, action: `create queue "${queueName}" on VPN "${vpn}"`,
      brokerName: broker.name, brokerLabel: broker.label,
      sempEndpoint: `POST /SEMP/v2/config/msgVpns/${vpn}/queues`,
      effect: `Creates queue "${queueName}" on VPN "${vpn}".`,
    });
  }
  const result = await new SempClient(broker).request({ api: 'config', method: 'POST', path: `/msgVpns/${vpn}/queues`, body: config });
  return buildExecutedResponse(broker.name, broker.label, `Created queue "${queueName}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}

export async function handleUpdateQueueConfig(registry: BrokerRegistry, brokerName: string, vpn: string, queue: string, config: Record<string, unknown>, confirm: boolean): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  if (!confirm) {
    return buildDryRunResponse({
      tier: RiskTier.WRITE, action: `update queue "${queue}" config on VPN "${vpn}"`,
      brokerName: broker.name, brokerLabel: broker.label,
      sempEndpoint: `PATCH /SEMP/v2/config/msgVpns/${vpn}/queues/${queue}`,
      effect: `Updates configuration for queue "${queue}".`,
    });
  }
  const result = await new SempClient(broker).request({ api: 'config', method: 'PATCH', path: `/msgVpns/${vpn}/queues/${queue}`, body: config });
  return buildExecutedResponse(broker.name, broker.label, `Updated queue "${queue}"`, '200 OK') + '\n\n' + JSON.stringify(result.data, null, 2);
}

export async function handleDeleteQueue(registry: BrokerRegistry, brokerName: string, vpn: string, queue: string, confirm: boolean): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  if (!confirm) {
    return buildDryRunResponse({
      tier: RiskTier.DELETE, action: `delete queue "${queue}" from VPN "${vpn}"`,
      brokerName: broker.name, brokerLabel: broker.label,
      sempEndpoint: `DELETE /SEMP/v2/config/msgVpns/${vpn}/queues/${queue}`,
      effect: `Permanently deletes queue "${queue}" and all its messages from VPN "${vpn}".`,
    });
  }
  await new SempClient(broker).request({ api: 'config', method: 'DELETE', path: `/msgVpns/${vpn}/queues/${queue}` });
  return buildExecutedResponse(broker.name, broker.label, `Deleted queue "${queue}"`, '200 OK');
}

export async function handleClearQueue(registry: BrokerRegistry, brokerName: string, vpn: string, queue: string, confirm: boolean, actionLabel = 'clear'): Promise<string> {
  const broker = registry.getOrThrow(brokerName);
  if (!confirm) {
    return buildDryRunResponse({
      tier: RiskTier.DELETE, action: `${actionLabel} all messages from queue "${queue}" on VPN "${vpn}"`,
      brokerName: broker.name, brokerLabel: broker.label,
      sempEndpoint: `POST /SEMP/v2/action/msgVpns/${vpn}/queues/${queue}/deleteMsgs`,
      effect: `Deletes ALL messages from queue "${queue}". This cannot be undone.`,
    });
  }
  await new SempClient(broker).request({ api: 'action', method: 'POST', path: `/msgVpns/${vpn}/queues/${queue}/deleteMsgs`, body: {} });
  return buildExecutedResponse(broker.name, broker.label, `Cleared all messages from queue "${queue}"`, '200 OK');
}

export function registerQueueTools(server: McpServer, registry: BrokerRegistry): void {
  server.tool('list_queues', 'List queues on a VPN. Paginated.',
    { broker: z.string(), vpn: z.string(), limit: z.number().int().min(1).max(500).default(50), cursor: z.string().optional() },
    async ({ broker, vpn, limit, cursor }) => ({ content: [{ type: 'text', text: await handleListQueues(registry, broker, vpn, limit, cursor) }] }));
  server.tool('get_queue_stats', 'Queue statistics: message count, consumer count, spool usage.',
    { broker: z.string(), vpn: z.string(), queue: z.string() },
    async ({ broker, vpn, queue }) => ({ content: [{ type: 'text', text: await handleGetQueueStats(registry, broker, vpn, queue) }] }));
  server.tool('list_queue_subscriptions', 'Topic subscriptions on a queue. Paginated.',
    { broker: z.string(), vpn: z.string(), queue: z.string(), limit: z.number().int().min(1).max(500).default(50), cursor: z.string().optional() },
    async ({ broker, vpn, queue, limit, cursor }) => ({ content: [{ type: 'text', text: await handleListQueueSubscriptions(registry, broker, vpn, queue, limit, cursor) }] }));
  server.tool('list_queue_consumers', 'Active consumer connections on a queue.',
    { broker: z.string(), vpn: z.string(), queue: z.string() },
    async ({ broker, vpn, queue }) => ({ content: [{ type: 'text', text: await handleListQueueConsumers(registry, broker, vpn, queue) }] }));
  server.tool('list_queue_messages', 'Browse messages in a queue. Payloads truncated at MESSAGE_PAYLOAD_PREVIEW_BYTES.',
    { broker: z.string(), vpn: z.string(), queue: z.string(), max_messages: z.number().int().min(1).max(100).default(20) },
    async ({ broker, vpn, queue, max_messages }) => ({ content: [{ type: 'text', text: await handleListQueueMessages(registry, broker, vpn, queue, max_messages) }] }));
  server.tool('get_queue_config', 'Queue configuration from the config API.',
    { broker: z.string(), vpn: z.string(), queue: z.string() },
    async ({ broker, vpn, queue }) => ({ content: [{ type: 'text', text: await handleGetQueueConfig(registry, broker, vpn, queue) }] }));
  server.tool('create_queue', 'Create a queue. dry_run by default — set confirm: true to execute.',
    { broker: z.string(), vpn: z.string(), config: z.record(z.string(), z.unknown()), confirm: z.boolean().default(false) },
    async ({ broker, vpn, config, confirm }) => ({ content: [{ type: 'text', text: await handleCreateQueue(registry, broker, vpn, config, confirm) }] }));
  server.tool('update_queue_config', 'Update queue configuration. dry_run by default.',
    { broker: z.string(), vpn: z.string(), queue: z.string(), config: z.record(z.string(), z.unknown()), confirm: z.boolean().default(false) },
    async ({ broker, vpn, queue, config, confirm }) => ({ content: [{ type: 'text', text: await handleUpdateQueueConfig(registry, broker, vpn, queue, config, confirm) }] }));
  server.tool('delete_queue', 'Delete a queue and all its messages. dry_run by default.',
    { broker: z.string(), vpn: z.string(), queue: z.string(), confirm: z.boolean().default(false) },
    async ({ broker, vpn, queue, confirm }) => ({ content: [{ type: 'text', text: await handleDeleteQueue(registry, broker, vpn, queue, confirm) }] }));
  server.tool('clear_queue', 'Delete all messages in a queue (purge). dry_run by default.',
    { broker: z.string(), vpn: z.string(), queue: z.string(), confirm: z.boolean().default(false) },
    async ({ broker, vpn, queue, confirm }) => ({ content: [{ type: 'text', text: await handleClearQueue(registry, broker, vpn, queue, confirm) }] }));
  server.tool('purge_queue', 'Alias for clear_queue — delete all messages in a queue.',
    { broker: z.string(), vpn: z.string(), queue: z.string(), confirm: z.boolean().default(false) },
    async ({ broker, vpn, queue, confirm }) => ({ content: [{ type: 'text', text: await handleClearQueue(registry, broker, vpn, queue, confirm, 'purge') }] }));
}
