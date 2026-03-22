import { BrokerRegistry } from '../../src/brokers/registry';
import { SempClient } from '../../src/semp/client';
import { handleListClients, handleDisconnectClient, handleClearClientStats } from '../../src/tools/client-tools';
jest.mock('../../src/semp/client');

const broker = { name: 'test', label: 'Test', url: 'http://x', username: 'a', password: 'b' };
const registry = new BrokerRegistry([broker]);
beforeEach(() => { jest.clearAllMocks(); });

describe('handleListClients', () => {
  it('returns client list JSON', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ clientName: 'cli1' }], meta: { count: 1 } });
    const r = await handleListClients(registry, 'test', 'default', 50);
    expect(r).toContain('cli1');
  });
});

describe('handleDisconnectClient', () => {
  it('dry_run without confirm', async () => {
    const r = await handleDisconnectClient(registry, 'test', 'default', 'cli1', false);
    expect(r).toContain('[DRY RUN]');
  });
  it('executes with confirm', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: {} });
    const r = await handleDisconnectClient(registry, 'test', 'default', 'cli1', true);
    expect(r).toContain('[EXECUTED]');
  });
});

describe('handleClearClientStats', () => {
  it('dry_run without confirm', async () => {
    const r = await handleClearClientStats(registry, 'test', 'default', 'cli1', false);
    expect(r).toContain('[DRY RUN]');
  });
});
