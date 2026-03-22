import { Broker } from './types';
export declare function loadBrokersFromFile(filePath: string): Broker[];
export declare function loadBrokersFromEnv(): Broker[];
export declare function mergeBrokers(fileBrokers: Broker[], envBrokers: Broker[]): Broker[];
