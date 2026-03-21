"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSempError = mapSempError;
function extractDescription(error) {
    try {
        return error.response?.data?.meta?.error?.description ?? error.message;
    }
    catch {
        return error.message;
    }
}
function mapSempError(error, brokerName) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || !error.response)
        return `Broker "${brokerName}" is unreachable. Check network connectivity and the broker URL.`;
    const d = extractDescription(error);
    switch (error.response.status) {
        case 400: return `Invalid request: ${d}`;
        case 401: return `Authentication failed for broker "${brokerName}". Check username/password.`;
        case 403: return `Permission denied on broker "${brokerName}". The configured user lacks access.`;
        case 404: return `Resource not found: ${d}. (Endpoint may not exist on this broker version.)`;
        case 409: return `Conflict: ${d}`;
        case 503: return `Broker "${brokerName}" is unreachable or SEMP is disabled. Check the URL and broker status.`;
        default: return `Unexpected SEMP error ${error.response.status}: ${d}`;
    }
}
//# sourceMappingURL=errors.js.map