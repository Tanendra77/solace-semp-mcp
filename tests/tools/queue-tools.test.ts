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
    await handleListQueueMessages(registry, 'test', 'default', 'q', 999);
    expect((SempClient.prototype.request as jest.Mock).mock.calls[0][0].params.count).toBe(100);
  });
  it('truncates long payloads', async () => {
    const longPayload = 'x'.repeat(3000);
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ payload: longPayload }] });
    const r = await handleListQueueMessages(registry, 'test', 'default', 'q', 10);
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

describe('truncatePayload byte accuracy', () => {
  it('keeps preview within limitBytes for multibyte characters', async () => {
    // Each '中' is 3 bytes in UTF-8. 10 chars = 30 bytes.
    // Limit of 20 bytes should cut at 6 chars (18 bytes), not 20 chars.
    const multibyte = '中'.repeat(10); // 30 bytes
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({
      data: [{ payload: multibyte }],
    });
    process.env['MESSAGE_PAYLOAD_PREVIEW_BYTES'] = '20';
    const r = await handleListQueueMessages(registry, 'test', 'default', 'q', 1);
    delete process.env['MESSAGE_PAYLOAD_PREVIEW_BYTES'];
    const parsed = JSON.parse(r);
    expect(parsed[0].payload_truncated).toBe(true);
    // Preview must not exceed 20 bytes when re-encoded (strip trailing '...' first)
    expect(Buffer.byteLength(parsed[0].payload_preview.replace(/\.\.\.$/, ''), 'utf-8')).toBeLessThanOrEqual(20);
  });
});

describe('purge_queue alias text', () => {
  it('dry-run response contains "purge" when called with purge label', async () => {
    const r = await handleClearQueue(registry, 'test', 'default', 'q', false, 'purge');
    expect(r).toContain('purge');
  });
  it('dry-run response contains "clear" by default', async () => {
    const r = await handleClearQueue(registry, 'test', 'default', 'q', false);
    expect(r).toContain('clear');
  });
});
