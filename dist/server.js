"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServer = createMcpServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const index_1 = require("./tools/index");
function createMcpServer(registry) {
    const server = new mcp_js_1.McpServer({ name: 'solace-semp-mcp', version: '1.0.0' });
    (0, index_1.registerAllTools)(server, registry);
    return server;
}
//# sourceMappingURL=server.js.map