"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStdioTransport = startStdioTransport;
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const logger_1 = require("../logger");
async function startStdioTransport(server) {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.server.connect(transport);
    logger_1.logger.info('MCP server running on stdio transport');
}
//# sourceMappingURL=stdio.js.map