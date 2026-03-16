import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from './brokers/registry';
import { registerAllTools } from './tools/index';

export function createMcpServer(registry: BrokerRegistry): McpServer {
  const server = new McpServer({ name: 'solace-semp-mcp', version: '1.0.0' });
  registerAllTools(server, registry);
  return server;
}
