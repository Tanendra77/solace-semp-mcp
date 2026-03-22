"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrokerRegistry = void 0;
const logger_1 = require("../logger");
class BrokerRegistry {
    brokers = new Map();
    constructor(initial) {
        for (const b of initial) {
            const key = b.name.toLowerCase();
            if (this.brokers.has(key)) {
                logger_1.logger.warn(`Duplicate broker name "${b.name}" in initial config — last entry wins.`);
            }
            this.brokers.set(key, b);
        }
    }
    add(broker) {
        const key = broker.name.toLowerCase();
        if (this.brokers.has(key))
            throw new Error(`Broker "${broker.name}" is already registered.`);
        this.brokers.set(key, broker);
    }
    remove(name) {
        if (!this.brokers.has(name.toLowerCase()))
            throw new Error(`Broker "${name}" is not registered.`);
        this.brokers.delete(name.toLowerCase());
    }
    get(name) { return this.brokers.get(name.toLowerCase()); }
    getOrThrow(name) {
        const broker = this.get(name);
        if (!broker) {
            if (this.brokers.size === 0)
                throw new Error('No brokers registered. Use add_broker to register a broker first.');
            throw new Error(`Broker "${name}" is not registered. Use list_brokers to see available brokers.`);
        }
        return broker;
    }
    list() {
        return Array.from(this.brokers.values()).map(({ name, label, url }) => ({ name, label, url }));
    }
    count() { return this.brokers.size; }
}
exports.BrokerRegistry = BrokerRegistry;
//# sourceMappingURL=registry.js.map