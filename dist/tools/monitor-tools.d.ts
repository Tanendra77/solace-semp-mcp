import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from '../brokers/registry';
export declare function handleGetBrokerStats(registry: BrokerRegistry, brokerName: string): Promise<string>;
export declare function handleGetBrokerHealth(registry: BrokerRegistry, brokerName: string): Promise<string>;
export declare function handleGetRedundancyStatus(registry: BrokerRegistry, brokerName: string): Promise<string>;
export declare function handleGetConfigSyncStatus(registry: BrokerRegistry, brokerName: string): Promise<string>;
export declare function handleListVpns(registry: BrokerRegistry, brokerName: string, limit: number, offset: number): Promise<string>;
export declare function handleGetVpnStats(registry: BrokerRegistry, brokerName: string, vpn: string): Promise<string>;
export declare function registerMonitorTools(server: McpServer, registry: BrokerRegistry): void;
