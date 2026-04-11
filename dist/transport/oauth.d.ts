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
export declare function createOAuthHandlers(options: OAuthOptions): {
    mountRoutes: (app: express.Application) => void;
    createMiddleware: () => express.RequestHandler;
    _stores: {
        authCodes: Map<string, AuthCode>;
        accessTokens: Map<string, AccessToken>;
        clients: Map<string, OAuthClient>;
    };
};
export {};
