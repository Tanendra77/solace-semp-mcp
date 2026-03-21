"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
function getDateSuffix() {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
}
function createLogger() {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    const envLevel = process.env['LOG_LEVEL'] ?? '';
    const level = validLevels.includes(envLevel) ? envLevel : 'info';
    const logDir = 'logs';
    const transports = [
        new winston_1.default.transports.Console({ format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()) }),
        new winston_1.default.transports.File({ filename: path_1.default.join(logDir, `info-${getDateSuffix()}.log`), level: 'info' }),
    ];
    if (level === 'debug') {
        transports.push(new winston_1.default.transports.File({ filename: path_1.default.join(logDir, `debug-${getDateSuffix()}.log`), level: 'debug' }));
    }
    return winston_1.default.createLogger({ level, format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()), transports });
}
exports.logger = createLogger();
//# sourceMappingURL=logger.js.map