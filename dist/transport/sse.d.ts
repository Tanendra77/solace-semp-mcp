import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from '../brokers/registry';
export declare function startSseTransport(server: McpServer, registry: BrokerRegistry): Promise<void>;
