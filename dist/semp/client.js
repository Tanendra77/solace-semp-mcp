"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SempClient = void 0;
const axios_1 = __importStar(require("axios"));
const errors_1 = require("./errors");
class SempClient {
    broker;
    timeout;
    constructor(broker) {
        this.broker = broker;
        const parsed = parseInt(process.env['SEMP_TIMEOUT_MS'] ?? '10000', 10);
        this.timeout = isNaN(parsed) ? 10000 : parsed;
    }
    async request(options) {
        if (/\.\./.test(options.path))
            throw new Error('Invalid path: ".." segments are not allowed.');
        const url = `${this.broker.url}/SEMP/v2/${options.api}${options.path}`;
        try {
            const response = await axios_1.default.request({
                method: options.method, url,
                auth: { username: this.broker.username, password: this.broker.password },
                data: options.body, params: options.params,
                timeout: this.timeout,
            });
            return { data: response.data.data, meta: response.data.meta };
        }
        catch (err) {
            if ((0, axios_1.isAxiosError)(err))
                throw new Error((0, errors_1.mapSempError)(err, this.broker.name));
            throw err;
        }
    }
}
exports.SempClient = SempClient;
//# sourceMappingURL=client.js.map