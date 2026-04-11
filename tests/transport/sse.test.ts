import request from 'supertest';
import { createSseApp } from '../../src/transport/sse';
import { BrokerRegistry } from '../../src/brokers/registry';

// Mock SSEServerTransport so GET /sse does not open a real streaming connection.
// Without this the HTTP response never completes and supertest hangs.
let sessionCounter = 0;
jest.mock('@modelcontextprotocol/sdk/server/sse.js', () => ({
  SSEServerTransport: jest.fn().mockImplementation(() => ({
    sessionId: `mock-session-${++sessionCounter}`,
    handlePostMessage: jest.fn(),
  })),
}));

const broker = { name: 'test', label: 'Test', url: 'http://x', username: 'a', password: 'b' };
const registry = new BrokerRegistry([broker]);

function makeMockServer(connectImpl: () => Promise<void>) {
  return { server: { connect: jest.fn().mockImplementation(connectImpl) } } as any;
}

describe('SSE session leak', () => {
  it('does not retain transport in map when connect throws', async () => {
    const factory = () => makeMockServer(async () => { throw new Error('connect failed'); });
    const { app, transports } = createSseApp(factory, registry, { maxSessions: 10 });

    await request(app).get('/sse').expect(500);
    expect(transports.size).toBe(0);
  });

  it('does not block new connections after a failed connect', async () => {
    const factory = () => makeMockServer(async () => { throw new Error('connect failed'); });
    const { app } = createSseApp(factory, registry, { maxSessions: 1 });

    // First request: connect throws → session must be freed
    await request(app).get('/sse').expect(500);
    // Second request: maxSessions=1 but slot was freed, so should not get 503
    await request(app).get('/sse').expect(500); // 500 because connect still throws, not 503
  });
});

describe('SSE error handler', () => {
  it('returns 500 JSON without stack trace on route error', async () => {
    const factory = () => makeMockServer(async () => { throw new Error('boom'); });
    const { app } = createSseApp(factory, registry, { maxSessions: 10 });

    const res = await request(app).get('/sse').expect(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('stack');
    expect(JSON.stringify(res.body)).not.toContain('boom');
  });
});
