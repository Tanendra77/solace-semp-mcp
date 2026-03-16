import { BrokerRegistry } from '../../src/brokers/registry';
import { SempClient } from '../../src/semp/client';
import { handleDeleteQueue, handleListQueueMessages, handleClearQueue } from '../../src/tools/queue-tools';
jest.mock('../../src/semp/client');

const broker = { name: 'test', label: 'Test', url: 'http://x', username: 'a', password: 'b' };
const registry = new BrokerRegistry([broker]);

beforeEach(() => { jest.clearAllMocks(); });

describe('handleDeleteQueue', () => {
  it('dry_run contains "cannot be undone"', async () => {
    const r = await handleDeleteQueue(registry, 'test', 'default', 'my-queue', false);
    expect(r).toContain('cannot be undone');
  });
  it('executes with confirm', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: {} });
    const r = await handleDeleteQueue(registry, 'test', 'default', 'my-queue', true);
    expect(r).toContain('[EXECUTED]');
  });
});

describe('handleListQueueMessages', () => {
  it('caps max_messages at 100', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [] });
    await handleListQueueMessages(registry, 'test', 'default', 'q', 999, 0);
    expect((SempClient.prototype.request as jest.Mock).mock.calls[0][0].params.count).toBe(100);
  });
  it('truncates long payloads', async () => {
    const longPayload = 'x'.repeat(3000);
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ payload: longPayload }] });
    const r = await handleListQueueMessages(registry, 'test', 'default', 'q', 10, 0);
    const parsed = JSON.parse(r);
    expect(parsed[0].payload_truncated).toBe(true);
  });
});

describe('handleClearQueue', () => {
  it('dry_run without confirm', async () => {
    const r = await handleClearQueue(registry, 'test', 'default', 'q', false);
    expect(r).toContain('[DRY RUN]');
  });
  it('executes with confirm', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: {} });
    const r = await handleClearQueue(registry, 'test', 'default', 'q', true);
    expect(r).toContain('[EXECUTED]');
  });
});
