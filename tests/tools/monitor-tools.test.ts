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
  it('includes pagination footer when total > limit', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ name: 'default' }], meta: { count: 500 } });
    const r = await handleListVpns(registry, 'test', 50, 0);
    expect(r).toContain('Use offset=50');
  });
  it('no footer when count fits in limit', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ name: 'default' }], meta: { count: 1 } });
    const r = await handleListVpns(registry, 'test', 50, 0);
    expect(r).not.toContain('offset=');
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
