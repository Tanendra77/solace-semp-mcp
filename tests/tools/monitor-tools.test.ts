import { BrokerRegistry } from '../../src/brokers/registry';
import { SempClient } from '../../src/semp/client';
import { handleGetBrokerStats, handleListVpns, handleGetBrokerHealth } from '../../src/tools/monitor-tools';

jest.mock('../../src/semp/client');

const broker = { name: 'test', label: 'Test', url: 'http://x', username: 'a', password: 'b' };
const registry = new BrokerRegistry([broker]);

beforeEach(() => { jest.clearAllMocks(); });

describe('handleGetBrokerStats', () => {
  it('returns JSON from /about', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: { uptime: 100 } });
    const r = await handleGetBrokerStats(registry, 'test');
    expect(r).toContain('uptime');
  });
});

describe('handleListVpns', () => {
  it('includes cursor hint when nextPageUri is present', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({
      data: [{ name: 'default' }],
      meta: { paging: { nextPageUri: '/SEMP/v2/monitor/msgVpns?count=50&cursor=abc123' } },
    });
    const r = await handleListVpns(registry, 'test', 50);
    expect(r).toContain('cursor="abc123"');
  });
  it('no footer when nextPageUri is absent', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ name: 'default' }], meta: {} });
    const r = await handleListVpns(registry, 'test', 50);
    expect(r).not.toContain('cursor=');
  });
  it('passes cursor to SEMP when provided', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [], meta: {} });
    await handleListVpns(registry, 'test', 50, 'abc123');
    const call = (SempClient.prototype.request as jest.Mock).mock.calls[0][0];
    expect(call.params).toMatchObject({ cursor: 'abc123' });
  });
});

describe('handleGetBrokerHealth', () => {
  it('combines about and api data', async () => {
    (SempClient.prototype.request as jest.Mock)
      .mockResolvedValueOnce({ data: { uptime: 99 } })
      .mockResolvedValueOnce({ data: { sempVersion: 'v2' } });
    const r = await handleGetBrokerHealth(registry, 'test');
    expect(r).toContain('uptime');
    expect(r).toContain('sempVersion');
  });
});
