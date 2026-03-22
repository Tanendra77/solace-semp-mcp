import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from '../brokers/registry';
export declare function handleListClients(registry: BrokerRegistry, brokerName: string, vpn: string, limit: number, cursor?: string): Promise<string>;
export declare function handleGetClientDetails(registry: BrokerRegistry, brokerName: string, vpn: string, clientName: string): Promise<string>;
export declare function handleListClientSubscriptions(registry: BrokerRegistry, brokerName: string, vpn: string, clientName: string, limit: number, cursor?: string): Promise<string>;
export declare function handleListClientConnections(registry: BrokerRegistry, brokerName: string, vpn: string, username: string, limit: number, cursor?: string): Promise<string>;
export declare function handleDisconnectClient(registry: BrokerRegistry, brokerName: string, vpn: string, clientName: string, confirm: boolean): Promise<string>;
export declare function handleClearClientStats(registry: BrokerRegistry, brokerName: string, vpn: string, clientName: string, confirm: boolean): Promise<string>;
export declare function registerClientTools(server: McpServer, registry: BrokerRegistry): void;
