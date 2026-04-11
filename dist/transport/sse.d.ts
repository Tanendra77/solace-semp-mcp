import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { BrokerRegistry } from '../brokers/registry';
type ServerFactory = () => McpServer;
export interface SseAppOptions {
    maxSessions?: number;
    rateLimit?: number;
    apiKey?: string;
    corsOrigin?: string;
    trustProxy?: boolean;
    baseUrl?: string;
    tokenTtlSeconds?: number;
}
export declare function createSseApp(serverFactory: ServerFactory, registry: BrokerRegistry, options?: SseAppOptions): {
    app: express.Application;
    transports: Map<string, SSEServerTransport>;
};
export declare function startSseTransport(serverFactory: ServerFactory, registry: BrokerRegistry): Promise<void>;
export {};
