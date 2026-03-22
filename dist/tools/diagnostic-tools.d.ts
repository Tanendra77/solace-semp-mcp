import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from '../brokers/registry';
export declare function handleFindBackloggedQueues(registry: BrokerRegistry, brokerName: string, vpn: string, threshold: number): Promise<string>;
export declare function handleFindIdleConsumers(registry: BrokerRegistry, brokerName: string, vpn: string): Promise<string>;
export declare function handleDetectMessageLag(registry: BrokerRegistry, brokerName: string, vpn: string): Promise<string>;
export declare function registerDiagnosticTools(server: McpServer, registry: BrokerRegistry): void;
