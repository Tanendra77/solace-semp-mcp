import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrokerRegistry } from '../brokers/registry';
export declare function handleListBrokers(registry: BrokerRegistry): Promise<string>;
export declare function handleAddBroker(registry: BrokerRegistry, params: {
    name: string;
    label: string;
    url: string;
    username: string;
    password: string;
}): Promise<string>;
export declare function handleRemoveBroker(registry: BrokerRegistry, name: string, confirm: boolean): Promise<string>;
export declare function handleGetBrokerVersion(registry: BrokerRegistry, brokerName: string): Promise<string>;
export declare function handleDescribeBroker(registry: BrokerRegistry, brokerName: string): Promise<string>;
export declare function registerBrokerTools(server: McpServer, registry: BrokerRegistry): void;
