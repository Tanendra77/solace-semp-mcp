"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBrokersFromFile = loadBrokersFromFile;
exports.loadBrokersFromEnv = loadBrokersFromEnv;
exports.mergeBrokers = mergeBrokers;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../logger");
function loadBrokersFromFile(filePath) {
    const resolved = path_1.default.resolve(filePath);
    if (!fs_1.default.existsSync(resolved)) {
        logger_1.logger.info(`No brokers.json at ${resolved}, skipping.`);
        return [];
    }
    try {
        const raw = JSON.parse(fs_1.default.readFileSync(resolved, 'utf-8'));
        if (!Array.isArray(raw?.brokers)) {
            logger_1.logger.warn(`Invalid brokers.json: "brokers" must be an array.`);
            return [];
        }
        const brokers = [];
        for (const entry of raw.brokers) {
            if (typeof entry.name === 'string' && typeof entry.url === 'string' &&
                typeof entry.username === 'string' && typeof entry.password === 'string') {
                brokers.push({ name: entry.name, label: entry.label ?? entry.name, url: entry.url, username: entry.username, password: entry.password });
            }
            else {
                logger_1.logger.warn(`Skipping invalid broker entry in brokers.json: name=${entry?.name ?? '(missing)'}, url=${entry?.url ?? '(missing)'}`);
            }
        }
        logger_1.logger.info(`Loaded ${brokers.length} broker(s) from ${resolved}`);
        return brokers;
    }
    catch (err) {
        logger_1.logger.warn(`Failed to parse brokers.json: ${String(err)}`);
        return [];
    }
}
function loadBrokersFromEnv() {
    const map = new Map();
    for (const [key, value] of Object.entries(process.env)) {
        if (!value)
            continue;
        const match = /^SEMP_BROKER_([A-Z0-9_]+)_(URL|USERNAME|PASSWORD|LABEL)$/.exec(key);
        if (!match)
            continue;
        const name = match[1].toLowerCase();
        if (!map.has(name))
            map.set(name, { name });
        const b = map.get(name);
        const field = match[2];
        if (field === 'URL')
            b.url = value;
        else if (field === 'USERNAME')
            b.username = value;
        else if (field === 'PASSWORD')
            b.password = value;
        else if (field === 'LABEL')
            b.label = value;
    }
    const result = [];
    for (const [name, p] of map) {
        if (p.url && p.username && p.password)
            result.push({ name, label: p.label ?? name, url: p.url, username: p.username, password: p.password });
        else
            logger_1.logger.warn(`Incomplete env broker "${name}" — needs URL, USERNAME, PASSWORD`);
    }
    return result;
}
function mergeBrokers(fileBrokers, envBrokers) {
    const merged = new Map();
    for (const b of fileBrokers)
        merged.set(b.name.toLowerCase(), b);
    for (const b of envBrokers)
        merged.set(b.name.toLowerCase(), b);
    return Array.from(merged.values());
}
//# sourceMappingURL=loader.js.map