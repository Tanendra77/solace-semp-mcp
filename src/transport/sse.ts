import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { logger } from '../logger';
import { BrokerRegistry } from '../brokers/registry';

export async function startSseTransport(server: Server, registry: BrokerRegistry): Promise<void> {
  const app = express();
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  const apiKey = process.env['MCP_API_KEY'];
  const rateLimit = parseInt(process.env['MCP_RATE_LIMIT_RPS'] ?? '10', 10);

  app.use(cors());
  app.use(express.json());

  if (apiKey) {
    app.use((req, res, next) => {
      if (req.path === '/health') return next();
      if (req.headers['authorization'] !== `Bearer ${apiKey}`) {
        res.status(401).json({ error: 'Unauthorized' }); return;
      }
      next();
    });
  }

  const sessionCounts = new Map<string, { count: number; resetAt: number }>();
  app.use((req, res, next) => {
    if (req.path === '/health') return next();
    const sid = (req.headers['x-session-id'] as string) ?? req.ip ?? 'default';
    const now = Date.now();
    const entry = sessionCounts.get(sid);
    if (!entry || now > entry.resetAt) { sessionCounts.set(sid, { count: 1, resetAt: now + 1000 }); return next(); }
    if (entry.count >= rateLimit) { res.status(429).json({ error: 'Rate limit exceeded. Please wait before sending additional requests.' }); return; }
    entry.count++;
    next();
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok', brokers: registry.count() }));

  const transports = new Map<string, SSEServerTransport>();

  app.get('/sse', async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    transports.set(transport.sessionId, transport);
    await server.connect(transport);
    logger.info(`SSE client connected: ${transport.sessionId}`);
    req.on('close', () => transports.delete(transport.sessionId));
  });

  app.post('/messages', async (req, res) => {
    const sessionId = req.query['sessionId'] as string;
    const transport = transports.get(sessionId);
    if (!transport) { res.status(404).json({ error: 'Session not found' }); return; }
    await transport.handlePostMessage(req, res);
  });

  app.listen(port, () => logger.info(`MCP SSE server on port ${port}`));
}
