import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from '../brokers/registry';
import { registerBrokerTools } from './broker-tools';
import { registerMonitorTools } from './monitor-tools';
import { registerQueueTools } from './queue-tools';
import { registerClientTools } from './client-tools';
import { registerAclTools } from './acl-tools';
import { registerDiagnosticTools } from './diagnostic-tools';
import { registerPassthroughTool } from './passthrough';

export function registerAllTools(server: McpServer, registry: BrokerRegistry): void {
  registerBrokerTools(server, registry);
  registerMonitorTools(server, registry);
  registerQueueTools(server, registry);
  registerClientTools(server, registry);
  registerAclTools(server, registry);
  registerDiagnosticTools(server, registry);
  registerPassthroughTool(server, registry);
}
