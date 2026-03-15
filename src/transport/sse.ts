import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { logger } from '../logger';
import { BrokerRegistry } from '../brokers/registry';

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export async function startSseTransport(server: Server, registry: BrokerRegistry): Promise<void> {
  const app = express();
  const rawPort = parseInt(process.env['PORT'] ?? '3000', 10);
  const port = isNaN(rawPort) ? 3000 : rawPort;
  const apiKey = process.env['MCP_API_KEY'];
  const rawRateLimit = parseInt(process.env['MCP_RATE_LIMIT_RPS'] ?? '10', 10);
  const rateLimit = isNaN(rawRateLimit) ? 10 : rawRateLimit;

  app.use(cors());
  app.use(express.json());

  if (apiKey) {
    app.use((req, res, next) => {
      if (req.path === '/health') return next();
      const auth = req.headers['authorization'] ?? '';
      if (!timingSafeEqual(auth, `Bearer ${apiKey}`)) {
        res.status(401).json({ error: 'Unauthorized' }); return;
      }
      next();
    });
  }

  const sessionCounts = new Map<string, { count: number; resetAt: number }>();
  // Purge stale rate-limit entries every 60 seconds to prevent unbounded growth
  setInterval(() => {
    const now = Date.now();
    for (const [sid, entry] of sessionCounts) {
      if (now > entry.resetAt) sessionCounts.delete(sid);
    }
  }, 60_000).unref();

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

  app.get('/sse', async (req, res, next) => {
    try {
      const transport = new SSEServerTransport('/messages', res);
      transports.set(transport.sessionId, transport);
      await server.connect(transport);
      logger.info(`SSE client connected: ${transport.sessionId}`);
      req.on('close', () => transports.delete(transport.sessionId));
    } catch (err) {
      next(err);
    }
  });

  app.post('/messages', async (req, res, next) => {
    try {
      const sessionId = req.query['sessionId'] as string;
      const transport = transports.get(sessionId);
      if (!transport) { res.status(404).json({ error: 'Session not found' }); return; }
      await transport.handlePostMessage(req, res);
    } catch (err) {
      next(err);
    }
  });

  app.listen(port, () => logger.info(`MCP SSE server on port ${port}`));
}
