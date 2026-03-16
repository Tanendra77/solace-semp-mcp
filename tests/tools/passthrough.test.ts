import { BrokerRegistry } from '../../src/brokers/registry';
import { SempClient } from '../../src/semp/client';
import { handleSempRequest } from '../../src/tools/passthrough';
jest.mock('../../src/semp/client');

const registry = new BrokerRegistry([
  { name: 'test', label: 'Test', url: 'http://x:8080', username: 'a', password: 'b' },
]);

describe('handleSempRequest', () => {
  afterEach(() => { delete process.env['SEMP_PASSTHROUGH_MODE']; });

  it('GET executes immediately (no dry_run)', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: { ok: true } });
    const r = await handleSempRequest(registry, 'test', 'monitor', 'GET', '/msgVpns', undefined, false);
    expect(r).not.toContain('[DRY RUN]');
  });
  it('DELETE returns dry_run without confirm', async () => {
    const r = await handleSempRequest(registry, 'test', 'config', 'DELETE', '/x', undefined, false);
    expect(r).toContain('[DRY RUN]');
  });
  it('throws when mode=disabled', async () => {
    process.env['SEMP_PASSTHROUGH_MODE'] = 'disabled';
    await expect(handleSempRequest(registry, 'test', 'monitor', 'GET', '/x', undefined, false)).rejects.toThrow(/disabled/);
  });
  it('blocks non-GET in monitor_only', async () => {
    process.env['SEMP_PASSTHROUGH_MODE'] = 'monitor_only';
    await expect(handleSempRequest(registry, 'test', 'config', 'DELETE', '/x', undefined, false)).rejects.toThrow(/monitor_only/);
  });
  it('allows GET to monitor in monitor_only mode', async () => {
    process.env['SEMP_PASSTHROUGH_MODE'] = 'monitor_only';
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: {} });
    await expect(handleSempRequest(registry, 'test', 'monitor', 'GET', '/msgVpns', undefined, false)).resolves.toBeTruthy();
  });
});
