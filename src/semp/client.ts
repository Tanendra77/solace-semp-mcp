import axios, { isAxiosError } from 'axios';
import { Broker } from '../brokers/types';
import { SempRequestOptions, SempResponse } from './types';
import { mapSempError } from './errors';

export class SempClient {
  private readonly timeout: number;

  constructor(private readonly broker: Broker) {
    const parsed = parseInt(process.env['SEMP_TIMEOUT_MS'] ?? '10000', 10);
    this.timeout = isNaN(parsed) ? 10000 : parsed;
  }

  async request<T = unknown>(options: SempRequestOptions): Promise<SempResponse<T>> {
    const url = `${this.broker.url}/SEMP/v2/${options.api}${options.path}`;
    try {
      const response = await axios.request<{ data: T; meta?: SempResponse['meta'] }>({
        method: options.method, url,
        auth: { username: this.broker.username, password: this.broker.password },
        data: options.body, params: options.params,
        timeout: this.timeout,
      });
      return { data: response.data.data, meta: response.data.meta };
    } catch (err: unknown) {
      if (isAxiosError(err)) throw new Error(mapSempError(err, this.broker.name));
      throw err;
    }
  }
}
