import { Broker, BrokerPublic } from './types';
import { logger } from '../logger';

export class BrokerRegistry {
  private brokers = new Map<string, Broker>();

  constructor(initial: Broker[]) {
    for (const b of initial) {
      const key = b.name.toLowerCase();
      if (this.brokers.has(key)) {
        logger.warn(`Duplicate broker name "${b.name}" in initial config — last entry wins.`);
      }
      this.brokers.set(key, b);
    }
  }

  add(broker: Broker): void {
    const key = broker.name.toLowerCase();
    if (this.brokers.has(key)) throw new Error(`Broker "${broker.name}" is already registered.`);
    this.brokers.set(key, broker);
  }

  remove(name: string): void {
    if (!this.brokers.has(name.toLowerCase())) throw new Error(`Broker "${name}" is not registered.`);
    this.brokers.delete(name.toLowerCase());
  }

  get(name: string): Broker | undefined { return this.brokers.get(name.toLowerCase()); }

  getOrThrow(name: string): Broker {
    const broker = this.get(name);
    if (!broker) {
      if (this.brokers.size === 0) throw new Error('No brokers registered. Use add_broker to register a broker first.');
      throw new Error(`Broker "${name}" is not registered. Use list_brokers to see available brokers.`);
    }
    return broker;
  }

  list(): BrokerPublic[] {
    return Array.from(this.brokers.values()).map(({ name, label, url }) => ({ name, label, url }));
  }

  count(): number { return this.brokers.size; }
}
