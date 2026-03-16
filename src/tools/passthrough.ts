import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BrokerRegistry } from '../brokers/registry';
import { SempClient } from '../semp/client';
import { SempApi } from '../semp/types';
import { RiskTier, tierFromMethod, buildDryRunResponse, buildExecutedResponse, requiresConfirmation } from '../safety/confirmation';

export async function handleSempRequest(
  registry: BrokerRegistry, brokerName: string,
  api: SempApi, method: string, path: string, body: unknown, confirm: boolean
): Promise<string> {
  const mode = process.env['SEMP_PASSTHROUGH_MODE'] ?? 'advanced';
  if (mode === 'disabled')
    throw new Error('semp_request is disabled. Set SEMP_PASSTHROUGH_MODE=monitor_only or advanced to enable.');
  if (mode === 'monitor_only' && (method.toUpperCase() !== 'GET' || api !== 'monitor'))
    throw new Error('semp_request is restricted in monitor_only mode. Only GET requests to the monitor API are allowed.');

  const broker = registry.getOrThrow(brokerName);
  const tier = tierFromMethod(method);
  const endpoint = `${method.toUpperCase()} /SEMP/v2/${api}${path}`;

  if (requiresConfirmation(tier) && !confirm) {
    return buildDryRunResponse({
      tier, action: `${method.toUpperCase()} ${path}`,
      brokerName: broker.name, brokerLabel: broker.label,
      sempEndpoint: endpoint,
      effect: tier === RiskTier.DELETE
        ? 'May be irreversible. Review carefully before confirming.'
        : 'Modifies broker state. Note: POST to action API may be irreversible even at WRITE tier.',
    });
  }

  const result = await new SempClient(broker).request({
    api, method: method.toUpperCase() as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', path, body,
  });

  if (tier === RiskTier.READ) return JSON.stringify(result.data, null, 2);
  return buildExecutedResponse(broker.name, broker.label, `${method.toUpperCase()} ${path}`, '200 OK') +
    '\n\n' + JSON.stringify(result.data, null, 2);
}

export function registerPassthroughTool(server: McpServer, registry: BrokerRegistry): void {
  const mode = process.env['SEMP_PASSTHROUGH_MODE'] ?? 'advanced';
  if (mode === 'disabled') return;
  server.tool('semp_request',
    `Advanced escape hatch — raw SEMP call. Mode: ${mode}. ` +
    (mode === 'monitor_only' ? 'Only GET to monitor API allowed.' : 'Full access to all SEMP APIs.') +
    ' POST to action endpoints may be irreversible — review dry_run carefully.',
    {
      broker: z.string(), api: z.enum(['monitor', 'config', 'action']),
      method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']),
      path: z.string().describe('Path after /SEMP/v2/{api}, e.g. "/msgVpns/default/queues"'),
      body: z.unknown().optional(),
      confirm: z.boolean().default(false),
    },
    async ({ broker, api, method, path, body, confirm }) => ({
      content: [{ type: 'text', text: await handleSempRequest(registry, broker, api, method, path, body, confirm) }],
    })
  );
}
