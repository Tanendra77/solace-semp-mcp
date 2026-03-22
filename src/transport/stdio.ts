import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../logger';

export async function startStdioTransport(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.server.connect(transport);
  logger.info('MCP server running on stdio transport');
}
