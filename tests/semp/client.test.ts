import axios, { AxiosError } from 'axios';
import { SempClient } from '../../src/semp/client';

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  request: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

const broker = { name: 'test', label: 'Test', url: 'http://localhost:8080', username: 'admin', password: 'admin' };

describe('SempClient', () => {
  let client: SempClient;
  beforeEach(() => { client = new SempClient(broker); jest.clearAllMocks(); });

  it('makes GET to monitor API with correct URL and auth', async () => {
    mockedAxios.request = jest.fn().mockResolvedValue({ data: { data: [], meta: {} } });
    const result = await client.request({ api: 'monitor', method: 'GET', path: '/msgVpns' });
    expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'http://localhost:8080/SEMP/v2/monitor/msgVpns',
      auth: { username: 'admin', password: 'admin' },
    }));
    expect(result.data).toEqual([]);
  });

  it('throws mapped error on 401', async () => {
    const axiosErr = new AxiosError('Request failed', undefined, undefined, undefined,
      { status: 401, data: {}, statusText: '', headers: {}, config: {} as any });
    mockedAxios.request = jest.fn().mockRejectedValue(axiosErr);
    await expect(client.request({ api: 'monitor', method: 'GET', path: '/about' })).rejects.toThrow(/Authentication failed/);
  });

  it('forwards params to axios request', async () => {
    mockedAxios.request = jest.fn().mockResolvedValue({ data: { data: [], meta: {} } });
    await client.request({ api: 'monitor', method: 'GET', path: '/msgVpns', params: { count: 10 } });
    expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({ params: { count: 10 } }));
  });

  it('re-throws non-axios errors', async () => {
    const nonAxios = new TypeError('unexpected');
    mockedAxios.request = jest.fn().mockRejectedValue(nonAxios);
    await expect(client.request({ api: 'monitor', method: 'GET', path: '/about' })).rejects.toThrow('unexpected');
  });
});
