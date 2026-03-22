import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from '../brokers/registry';
import { SempApi } from '../semp/types';
export declare function handleSempRequest(registry: BrokerRegistry, brokerName: string, api: SempApi, method: string, path: string, body: unknown, confirm: boolean): Promise<string>;
export declare function registerPassthroughTool(server: McpServer, registry: BrokerRegistry): void;
