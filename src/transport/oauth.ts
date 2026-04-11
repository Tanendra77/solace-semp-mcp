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
