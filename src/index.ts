import { loadBrokersFromFile, loadBrokersFromEnv, mergeBrokers } from './brokers/loader';
import { BrokerRegistry } from './brokers/registry';
import { createMcpServer } from './server';
import { startStdioTransport } from './transport/stdio';
import { startSseTransport } from './transport/sse';
import { logger } from './logger';

async function main(): Promise<void> {
  const registry = new BrokerRegistry(mergeBrokers(loadBrokersFromFile('brokers.json'), loadBrokersFromEnv()));
  const server = createMcpServer(registry);

  const transport = process.env['MCP_TRANSPORT'] ?? 'stdio';
  if (transport !== 'stdio' && transport !== 'sse')
    logger.warn(`Unknown MCP_TRANSPORT "${transport}", defaulting to stdio`);

  logger.info([
    'Solace SEMP MCP Server started',
    `Transport:          ${transport === 'sse' ? 'SSE' : 'stdio'}`,
    transport === 'sse' ? `Port:               ${process.env['PORT'] ?? '3000'}` : null,
    `Registered brokers: ${registry.count()} (${registry.list().map(b => b.name).join(', ') || 'none'})`,
    `Passthrough mode:   ${process.env['SEMP_PASSTHROUGH_MODE'] ?? 'advanced'}`,
    transport === 'sse' ? `Rate limit:         ${process.env['MCP_RATE_LIMIT_RPS'] ?? '10'} req/s` : null,
    `Log level:          ${process.env['LOG_LEVEL'] ?? 'info'}`,
  ].filter(Boolean).join('\n'));

  if (transport === 'sse') await startSseTransport(server, registry);
  else await startStdioTransport(server);
}

main().catch((err: unknown) => { console.error('Fatal:', err); process.exit(1); });
