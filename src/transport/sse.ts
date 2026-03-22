import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { logger } from '../logger';
import { BrokerRegistry } from '../brokers/registry';

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const maxLen = Math.max(Buffer.byteLength(a), Buffer.byteLength(b));
    const ab = Buffer.alloc(maxLen);
    const bb = Buffer.alloc(maxLen);
    ab.write(a);
    bb.write(b);
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export async function startSseTransport(server: McpServer, registry: BrokerRegistry): Promise<void> {
  const app = express();
  const rawPort = parseInt(process.env['PORT'] ?? '3000', 10);
  const port = isNaN(rawPort) ? 3000 : rawPort;
  const apiKey = process.env['MCP_API_KEY'];
  const rawRateLimit = parseInt(process.env['MCP_RATE_LIMIT_RPS'] ?? '10', 10);
  const rateLimit = isNaN(rawRateLimit) ? 10 : rawRateLimit;
  const rawMaxSessions = parseInt(process.env['MCP_MAX_SESSIONS'] ?? '100', 10);
  const maxSessions = isNaN(rawMaxSessions) ? 100 : rawMaxSessions;

  // Trust proxy: required when running behind Nginx/Traefik so req.ip reflects the real
  // client IP rather than the proxy address. Without this, all clients behind a proxy
  // share one rate-limit bucket. Enable by setting TRUST_PROXY=1 in the environment.
  const trustProxy = process.env['TRUST_PROXY'];
  if (trustProxy === '1' || trustProxy === 'true') app.set('trust proxy', 1);

  const corsOrigin = process.env['CORS_ORIGIN'];
  if (corsOrigin) {
    app.use(cors({
      origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map(o => o.trim()),
    }));
  }
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
    const sid = req.ip ?? 'default';
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
      if (transports.size >= maxSessions) {
        res.status(503).json({ error: 'Too many concurrent sessions. Try again later.' }); return;
      }
      const transport = new SSEServerTransport('/messages', res);
      transports.set(transport.sessionId, transport);
      await server.server.connect(transport);
      logger.info(`SSE client connected: ${transport.sessionId}`);
      req.on('close', () => transports.delete(transport.sessionId));
    } catch (err) {
      next(err);
    }
  });

  app.post('/messages', async (req, res, next) => {
    try {
      const raw = req.query['sessionId'];
      const sessionId = typeof raw === 'string' ? raw : undefined;
      if (!sessionId) { res.status(400).json({ error: 'Missing sessionId' }); return; }
      const transport = transports.get(sessionId);
      if (!transport) { res.status(404).json({ error: 'Session not found' }); return; }
      await transport.handlePostMessage(req, res);
    } catch (err) {
      next(err);
    }
  });

  app.listen(port, () => logger.info(`MCP SSE server on port ${port}`));
}
