import crypto from 'crypto';
import express from 'express';

export interface OAuthOptions {
  baseUrl: string;
  apiKey?: string;
  tokenTtlSeconds?: number;
}

interface AuthCode {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  expiresAt: number;
  used: boolean;
}

interface AccessToken {
  expiresAt: number;
}

interface OAuthClient {
  clientId: string;
  redirectUris: string[];
  createdAt: number;
}

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

function verifyPkce(verifier: string, challenge: string): boolean {
  try {
    const computed = crypto.createHash('sha256').update(verifier).digest('base64url');
    const a = Buffer.from(computed);
    const b = Buffer.from(challenge);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function createOAuthHandlers(options: OAuthOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const tokenTtlMs = (options.tokenTtlSeconds ?? 3600) * 1000;
  const { apiKey } = options;

  const authCodes = new Map<string, AuthCode>();
  const accessTokens = new Map<string, AccessToken>();
  const clients = new Map<string, OAuthClient>();

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of authCodes) if (now > v.expiresAt) authCodes.delete(k);
    for (const [k, v] of accessTokens) if (now > v.expiresAt) accessTokens.delete(k);
    for (const [k, v] of clients) if (now - v.createdAt > 24 * 60 * 60 * 1000) clients.delete(k);
  }, 300_000).unref();

  function mountRoutes(app: express.Application): void {
    app.get('/.well-known/oauth-authorization-server', (_req, res) => {
      res.json({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/authorize`,
        token_endpoint: `${baseUrl}/token`,
        registration_endpoint: `${baseUrl}/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'client_credentials'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
      });
    });

    app.get('/.well-known/mcp/resource-metadata', (_req, res) => {
      res.json({
        resource: baseUrl,
        authorization_servers: [baseUrl],
        bearer_methods_supported: ['header'],
      });
    });

    app.post('/register', (req, res) => {
      const { redirect_uris } = req.body ?? {};
      if (!Array.isArray(redirect_uris) || redirect_uris.length === 0 ||
          !redirect_uris.every((u: unknown): u is string => typeof u === 'string')) {
        res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uris must be a non-empty array of strings' });
        return;
      }
      const clientId = crypto.randomUUID();
      clients.set(clientId, { clientId, redirectUris: redirect_uris, createdAt: Date.now() });
      res.status(201).json({ client_id: clientId, redirect_uris });
    });

    // Authorization endpoint — show form or auto-approve
    app.get('/authorize', (req, res) => {
      const q = req.query as Record<string, string | undefined>;
      const { response_type, client_id, redirect_uri, code_challenge, code_challenge_method, state } = q;

      if (response_type !== 'code' || !client_id || !redirect_uri || !code_challenge || code_challenge_method !== 'S256') {
        res.status(400).json({ error: 'invalid_request', error_description: 'Missing or invalid parameters' });
        return;
      }

      const client = clients.get(client_id);
      if (client && !client.redirectUris.includes(redirect_uri)) {
        res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri mismatch' });
        return;
      }

      // No API key configured — auto-approve
      if (!apiKey) {
        let url: URL;
        try {
          url = new URL(redirect_uri);
        } catch {
          res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
          return;
        }
        const code = crypto.randomBytes(16).toString('hex');
        authCodes.set(code, {
          clientId: client_id,
          redirectUri: redirect_uri,
          codeChallenge: code_challenge,
          codeChallengeMethod: 'S256',
          expiresAt: Date.now() + 10 * 60 * 1000,
          used: false,
        });
        url.searchParams.set('code', code);
        if (state) url.searchParams.set('state', state);
        res.redirect(url.toString());
        return;
      }

      // Show HTML form for API key entry
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>MCP Authorization — Solace SEMP</title>
<style>body{font-family:sans-serif;max-width:400px;margin:80px auto;padding:0 16px}
input{display:block;width:100%;padding:8px;margin:8px 0;box-sizing:border-box}
button{padding:8px 16px;cursor:pointer}</style></head>
<body>
<h2>Solace SEMP MCP — Authorize</h2>
<p>Enter your API key to grant access.</p>
<form method="POST" action="/authorize/submit">
  <input type="hidden" name="client_id" value="${escapeHtml(client_id)}">
  <input type="hidden" name="redirect_uri" value="${escapeHtml(redirect_uri)}">
  <input type="hidden" name="code_challenge" value="${escapeHtml(code_challenge)}">
  <input type="hidden" name="state" value="${escapeHtml(state ?? '')}">
  <label>API Key</label>
  <input type="password" name="api_key" autofocus required>
  <button type="submit">Authorize</button>
</form>
</body></html>`);
    });

    // Authorization form submission
    app.post('/authorize/submit', express.urlencoded({ extended: false }), (req, res) => {
      const { client_id, redirect_uri, code_challenge, state, api_key } = req.body ?? {};

      if (!client_id || !redirect_uri || !code_challenge || !api_key) {
        res.status(400).json({ error: 'invalid_request', error_description: 'Missing parameters' });
        return;
      }

      if (!apiKey || !timingSafeEqual(String(api_key), apiKey)) {
        res.status(401).json({ error: 'access_denied', error_description: 'Invalid API key' });
        return;
      }

      // Validate redirect_uri against registered client
      const registeredClient = clients.get(String(client_id));
      if (registeredClient && !registeredClient.redirectUris.includes(String(redirect_uri))) {
        res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri mismatch' });
        return;
      }

      let url: URL;
      try {
        url = new URL(String(redirect_uri));
      } catch {
        res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
        return;
      }

      const code = crypto.randomBytes(16).toString('hex');
      authCodes.set(code, {
        clientId: String(client_id),
        redirectUri: String(redirect_uri),
        codeChallenge: String(code_challenge),
        codeChallengeMethod: 'S256',
        expiresAt: Date.now() + 10 * 60 * 1000,
        used: false,
      });

      url.searchParams.set('code', code);
      if (state) url.searchParams.set('state', String(state));
      res.redirect(url.toString());
    });

    // Token endpoint
    app.post('/token', (req, res) => {
      const grantType = (req.body ?? {}).grant_type as string | undefined;

      if (grantType === 'authorization_code') {
        const { code, code_verifier, client_id, redirect_uri } = (req.body ?? {}) as Record<string, string>;

        if (!code || !code_verifier || !client_id || !redirect_uri) {
          res.status(400).json({ error: 'invalid_request', error_description: 'Missing required parameters' });
          return;
        }

        const entry = authCodes.get(code);
        if (!entry) {
          res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid authorization code' });
          return;
        }
        if (entry.used || Date.now() > entry.expiresAt) {
          authCodes.delete(code);
          res.status(400).json({ error: 'invalid_grant', error_description: 'Code expired or already used' });
          return;
        }
        if (entry.clientId !== client_id || entry.redirectUri !== redirect_uri) {
          res.status(400).json({ error: 'invalid_grant', error_description: 'client_id or redirect_uri mismatch' });
          return;
        }
        if (!verifyPkce(code_verifier, entry.codeChallenge)) {
          res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid code_verifier' });
          return;
        }

        entry.used = true;
        const token = crypto.randomBytes(32).toString('hex');
        accessTokens.set(token, { expiresAt: Date.now() + tokenTtlMs });
        res.json({ access_token: token, token_type: 'Bearer', expires_in: options.tokenTtlSeconds ?? 3600 });
        return;
      }

      if (grantType === 'client_credentials') {
        const { client_secret } = (req.body ?? {}) as Record<string, string>;

        if (apiKey && (!client_secret || !timingSafeEqual(client_secret, apiKey))) {
          res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
          return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        accessTokens.set(token, { expiresAt: Date.now() + tokenTtlMs });
        res.json({ access_token: token, token_type: 'Bearer', expires_in: options.tokenTtlSeconds ?? 3600 });
        return;
      }

      res.status(400).json({ error: 'unsupported_grant_type', error_description: `Unsupported grant type: ${String(grantType)}` });
    });
  }

  function createMiddleware(): express.RequestHandler {
    // Placeholder — implemented in Task 6
    return (_req, _res, next) => next();
  }

  return {
    mountRoutes,
    createMiddleware,
    _stores: { authCodes, accessTokens, clients },
  };
}
