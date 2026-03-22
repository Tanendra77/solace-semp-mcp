import { Broker, BrokerPublic } from './types';
export declare class BrokerRegistry {
    private brokers;
    constructor(initial: Broker[]);
    add(broker: Broker): void;
    remove(name: string): void;
    get(name: string): Broker | undefined;
    getOrThrow(name: string): Broker;
    list(): BrokerPublic[];
    count(): number;
}
