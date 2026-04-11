import request from 'supertest';
import express from 'express';
import { createOAuthHandlers, OAuthOptions } from '../../src/transport/oauth';

function makeApp(apiKey?: string) {
  const app = express();
  app.use(express.json());
  const opts: OAuthOptions = { baseUrl: 'http://localhost:3000', apiKey, tokenTtlSeconds: 3600 };
  const oauth = createOAuthHandlers(opts);
  oauth.mountRoutes(app);
  app.use(oauth.createMiddleware());
  app.get('/protected', (_req, res) => res.json({ ok: true }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  return { app, oauth };
}

describe('OAuth discovery', () => {
  it('GET /.well-known/oauth-authorization-server returns RFC 8414 fields', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/.well-known/oauth-authorization-server').expect(200);
    expect(res.body.issuer).toBe('http://localhost:3000');
    expect(res.body.authorization_endpoint).toBe('http://localhost:3000/authorize');
    expect(res.body.token_endpoint).toBe('http://localhost:3000/token');
    expect(res.body.registration_endpoint).toBe('http://localhost:3000/register');
    expect(res.body.code_challenge_methods_supported).toContain('S256');
    expect(res.body.grant_types_supported).toContain('authorization_code');
    expect(res.body.grant_types_supported).toContain('client_credentials');
    expect(res.body.response_types_supported).toContain('code');
  });

  it('GET /.well-known/mcp/resource-metadata returns MCP fields', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/.well-known/mcp/resource-metadata').expect(200);
    expect(res.body.resource).toBe('http://localhost:3000');
    expect(res.body.authorization_servers).toContain('http://localhost:3000');
    expect(res.body.bearer_methods_supported).toContain('header');
  });

  it('discovery endpoints strip trailing slash from baseUrl', async () => {
    const app = express();
    app.use(express.json());
    const oauth = createOAuthHandlers({ baseUrl: 'http://localhost:3000/' });
    oauth.mountRoutes(app);
    app.use(oauth.createMiddleware());
    const res = await request(app).get('/.well-known/oauth-authorization-server').expect(200);
    expect(res.body.issuer).toBe('http://localhost:3000');
    expect(res.body.authorization_endpoint).toBe('http://localhost:3000/authorize');
  });
});
