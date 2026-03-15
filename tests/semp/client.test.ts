import axios from 'axios';
import { SempClient } from '../../src/semp/client';
jest.mock('axios');
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
    mockedAxios.request = jest.fn().mockRejectedValue(
      Object.assign(new Error('x'), { isAxiosError: true, response: { status: 401, data: {} }, code: undefined })
    );
    await expect(client.request({ api: 'monitor', method: 'GET', path: '/about' })).rejects.toThrow(/Authentication failed/);
  });
});
