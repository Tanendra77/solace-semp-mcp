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

const PKCE_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const PKCE_CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

async function getAuthCode(app: express.Application, clientId = 'test-client', redirectUri = 'http://localhost:8080/cb'): Promise<string> {
  const res = await request(app).get('/authorize').query({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: PKCE_CHALLENGE,
    code_challenge_method: 'S256',
  });
  const location = new URL(res.headers['location']!);
  return location.searchParams.get('code')!;
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

describe('Dynamic client registration', () => {
  it('POST /register with redirect_uris returns client_id', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/register')
      .send({ redirect_uris: ['http://localhost:8080/callback'] })
      .expect(201);
    expect(typeof res.body.client_id).toBe('string');
    expect(res.body.client_id.length).toBeGreaterThan(0);
    expect(res.body.redirect_uris).toEqual(['http://localhost:8080/callback']);
  });

  it('POST /register without redirect_uris returns 400', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/register').send({}).expect(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('POST /register with empty redirect_uris array returns 400', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/register')
      .send({ redirect_uris: [] })
      .expect(400);
    expect(res.body.error).toBe('invalid_request');
  });
});

describe('Authorization endpoint', () => {
  const authorizeParams = {
    response_type: 'code',
    client_id: 'any-client',
    redirect_uri: 'http://localhost:8080/callback',
    code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', // base64url(SHA256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))
    code_challenge_method: 'S256',
    state: 'xyz',
  };

  it('GET /authorize without API key auto-redirects with code', async () => {
    const { app } = makeApp(); // no apiKey
    const res = await request(app)
      .get('/authorize')
      .query(authorizeParams)
      .expect(302);
    const location = new URL(res.headers['location']!);
    expect(location.searchParams.get('code')).toBeTruthy();
    expect(location.searchParams.get('state')).toBe('xyz');
  });

  it('GET /authorize with API key returns HTML form', async () => {
    const { app } = makeApp('secret-key');
    const res = await request(app)
      .get('/authorize')
      .query(authorizeParams)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<form');
    expect(res.text).toContain('/authorize/submit');
  });

  it('GET /authorize with missing code_challenge returns 400', async () => {
    const { app } = makeApp();
    const { code_challenge, ...rest } = authorizeParams;
    const res = await request(app).get('/authorize').query(rest).expect(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('GET /authorize with wrong code_challenge_method returns 400', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .get('/authorize')
      .query({ ...authorizeParams, code_challenge_method: 'plain' })
      .expect(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('POST /authorize/submit with correct API key redirects with code', async () => {
    const { app } = makeApp('secret-key');
    const res = await request(app)
      .post('/authorize/submit')
      .type('form')
      .send({
        client_id: 'any-client',
        redirect_uri: 'http://localhost:8080/callback',
        code_challenge: authorizeParams.code_challenge,
        state: 'xyz',
        api_key: 'secret-key',
      })
      .expect(302);
    const location = new URL(res.headers['location']!);
    expect(location.searchParams.get('code')).toBeTruthy();
    expect(location.searchParams.get('state')).toBe('xyz');
  });

  it('POST /authorize/submit with wrong API key returns 401', async () => {
    const { app } = makeApp('secret-key');
    const res = await request(app)
      .post('/authorize/submit')
      .type('form')
      .send({
        client_id: 'any-client',
        redirect_uri: 'http://localhost:8080/callback',
        code_challenge: authorizeParams.code_challenge,
        api_key: 'wrong-key',
      })
      .expect(401);
    expect(res.body.error).toBe('access_denied');
  });
});

describe('Token endpoint — authorization_code grant', () => {
  const clientId = 'test-client';
  const redirectUri = 'http://localhost:8080/cb';

  it('exchanges valid code for access token', async () => {
    const { app } = makeApp(); // no apiKey → auto-approve
    const code = await getAuthCode(app, clientId, redirectUri);

    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'authorization_code', code, code_verifier: PKCE_VERIFIER, client_id: clientId, redirect_uri: redirectUri })
      .expect(200);

    expect(typeof res.body.access_token).toBe('string');
    expect(res.body.access_token.length).toBeGreaterThan(0);
    expect(res.body.token_type).toBe('Bearer');
    expect(res.body.expires_in).toBe(3600);
  });

  it('returns invalid_grant for unknown code', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'authorization_code', code: 'bad-code', code_verifier: PKCE_VERIFIER, client_id: clientId, redirect_uri: redirectUri })
      .expect(400);
    expect(res.body.error).toBe('invalid_grant');
  });

  it('returns invalid_grant for already-used code', async () => {
    const { app } = makeApp();
    const code = await getAuthCode(app, clientId, redirectUri);
    // Use it once
    await request(app).post('/token').send({ grant_type: 'authorization_code', code, code_verifier: PKCE_VERIFIER, client_id: clientId, redirect_uri: redirectUri });
    // Try to use it again
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'authorization_code', code, code_verifier: PKCE_VERIFIER, client_id: clientId, redirect_uri: redirectUri })
      .expect(400);
    expect(res.body.error).toBe('invalid_grant');
  });

  it('returns invalid_grant for expired code', async () => {
    const { app, oauth } = makeApp();
    const code = await getAuthCode(app, clientId, redirectUri);
    // Manually expire the code
    const entry = oauth._stores.authCodes.get(code)!;
    entry.expiresAt = Date.now() - 1;

    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'authorization_code', code, code_verifier: PKCE_VERIFIER, client_id: clientId, redirect_uri: redirectUri })
      .expect(400);
    expect(res.body.error).toBe('invalid_grant');
    expect(res.body.error_description).toContain('expired');
  });

  it('returns invalid_grant for wrong PKCE verifier', async () => {
    const { app } = makeApp();
    const code = await getAuthCode(app, clientId, redirectUri);
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'authorization_code', code, code_verifier: 'wrong-verifier', client_id: clientId, redirect_uri: redirectUri })
      .expect(400);
    expect(res.body.error).toBe('invalid_grant');
  });

  it('returns invalid_request when required params are missing', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'authorization_code' }) // missing code, code_verifier, etc.
      .expect(400);
    expect(res.body.error).toBe('invalid_request');
  });
});

describe('Token endpoint — client_credentials grant', () => {
  it('issues token when client_secret matches API key', async () => {
    const { app } = makeApp('secret-key');
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'client_credentials', client_id: 'agent', client_secret: 'secret-key' })
      .expect(200);
    expect(typeof res.body.access_token).toBe('string');
    expect(res.body.token_type).toBe('Bearer');
    expect(res.body.expires_in).toBe(3600);
  });

  it('returns invalid_client when client_secret is wrong', async () => {
    const { app } = makeApp('secret-key');
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'client_credentials', client_id: 'agent', client_secret: 'wrong' })
      .expect(401);
    expect(res.body.error).toBe('invalid_client');
  });

  it('issues token when no API key is configured (open server)', async () => {
    const { app } = makeApp(); // no apiKey
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'client_credentials' })
      .expect(200);
    expect(typeof res.body.access_token).toBe('string');
  });

  it('returns unsupported_grant_type for unknown grant', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'implicit' })
      .expect(400);
    expect(res.body.error).toBe('unsupported_grant_type');
  });
});

describe('Auth middleware', () => {
  it('allows request with valid OAuth access token', async () => {
    const { app } = makeApp('secret-key');
    // Get a token via client_credentials
    const tokenRes = await request(app)
      .post('/token')
      .send({ grant_type: 'client_credentials', client_secret: 'secret-key' });
    const token = tokenRes.body.access_token as string;

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('allows request with raw API key as Bearer token (backward compat)', async () => {
    const { app } = makeApp('secret-key');
    await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer secret-key')
      .expect(200);
  });

  it('rejects request with unknown token (401)', async () => {
    const { app } = makeApp('secret-key');
    await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer unknown-token')
      .expect(401);
  });

  it('rejects request with no Authorization header (401)', async () => {
    const { app } = makeApp('secret-key');
    await request(app).get('/protected').expect(401);
  });

  it('rejects request with expired token (401)', async () => {
    const { app, oauth } = makeApp('secret-key');
    const tokenRes = await request(app)
      .post('/token')
      .send({ grant_type: 'client_credentials', client_secret: 'secret-key' });
    const token = tokenRes.body.access_token as string;

    // Manually expire the token
    const entry = oauth._stores.accessTokens.get(token)!;
    entry.expiresAt = Date.now() - 1;

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('allows /health without any token even when API key is configured', async () => {
    const { app } = makeApp('secret-key');
    await request(app).get('/health').expect(200);
  });

  it('allows all requests when no API key is configured', async () => {
    const { app } = makeApp(); // no apiKey
    await request(app).get('/protected').expect(200);
  });

  it('allows /.well-known/* without token', async () => {
    const { app } = makeApp('secret-key');
    await request(app).get('/.well-known/oauth-authorization-server').expect(200);
  });
});
