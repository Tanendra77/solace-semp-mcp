#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loader_1 = require("./brokers/loader");
const registry_1 = require("./brokers/registry");
const server_1 = require("./server");
const stdio_1 = require("./transport/stdio");
const sse_1 = require("./transport/sse");
const logger_1 = require("./logger");
const setup_1 = require("./setup");
if (process.argv[2] === 'setup') {
    (0, setup_1.runSetup)().catch((err) => { console.error(err); process.exit(1); });
}
else {
    main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
}
async function main() {
    const registry = new registry_1.BrokerRegistry((0, loader_1.mergeBrokers)((0, loader_1.loadBrokersFromFile)('brokers.json'), (0, loader_1.loadBrokersFromEnv)()));
    const transport = process.env['MCP_TRANSPORT'] ?? 'stdio';
    if (transport !== 'stdio' && transport !== 'sse')
        logger_1.logger.warn(`Unknown MCP_TRANSPORT "${transport}", defaulting to stdio`);
    logger_1.logger.info([
        'Solace SEMP MCP Server started',
        `Transport:          ${transport === 'sse' ? 'SSE' : 'stdio'}`,
        transport === 'sse' ? `Port:               ${process.env['PORT'] ?? '3000'}` : null,
        `Registered brokers: ${registry.count()} (${registry.list().map(b => b.name).join(', ') || 'none'})`,
        `Passthrough mode:   ${process.env['SEMP_PASSTHROUGH_MODE'] ?? 'advanced'}`,
        transport === 'sse' ? `Rate limit:         ${process.env['MCP_RATE_LIMIT_RPS'] ?? '10'} req/s` : null,
        `Log level:          ${process.env['LOG_LEVEL'] ?? 'info'}`,
    ].filter(Boolean).join('\n'));
    if (transport === 'sse') {
        // SSE mode: each connection gets its own McpServer instance (SDK constraint)
        await (0, sse_1.startSseTransport)(() => (0, server_1.createMcpServer)(registry), registry);
    }
    else {
        await (0, stdio_1.startStdioTransport)((0, server_1.createMcpServer)(registry));
    }
}
//# sourceMappingURL=index.js.map