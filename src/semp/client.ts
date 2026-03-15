import axios, { AxiosError, isAxiosError } from 'axios';
import { Broker } from '../brokers/types';
import { SempRequestOptions, SempResponse } from './types';
import { mapSempError } from './errors';

export class SempClient {
  constructor(private readonly broker: Broker) {}

  async request<T = unknown>(options: SempRequestOptions): Promise<SempResponse<T>> {
    const url = `${this.broker.url}/SEMP/v2/${options.api}${options.path}`;
    try {
      const response = await axios.request<{ data: T; meta?: SempResponse['meta'] }>({
        method: options.method, url,
        auth: { username: this.broker.username, password: this.broker.password },
        data: options.body, params: options.params,
        timeout: parseInt(process.env['SEMP_TIMEOUT_MS'] ?? '10000', 10),
      });
      return { data: response.data.data, meta: response.data.meta };
    } catch (err: unknown) {
      if (isAxiosError(err) || (err instanceof Error && (err as any).isAxiosError === true))
        throw new Error(mapSempError(err as AxiosError, this.broker.name));
      throw err;
    }
  }
}
