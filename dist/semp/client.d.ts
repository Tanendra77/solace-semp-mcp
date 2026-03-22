import { Broker } from '../brokers/types';
import { SempRequestOptions, SempResponse } from './types';
export declare class SempClient {
    private readonly broker;
    private readonly timeout;
    constructor(broker: Broker);
    request<T = unknown>(options: SempRequestOptions): Promise<SempResponse<T>>;
}
