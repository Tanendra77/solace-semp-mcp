export type SempApi = 'monitor' | 'config' | 'action';
export interface SempRequestOptions {
    api: SempApi;
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    path: string;
    body?: unknown;
    params?: Record<string, string | number>;
}
export interface SempResponse<T = unknown> {
    data: T;
    meta?: {
        count?: number;
        paging?: {
            nextPageUri?: string;
        };
    };
}
