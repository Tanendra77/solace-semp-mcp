import { BrokerRegistry } from '../../src/brokers/registry';
import { SempClient } from '../../src/semp/client';
import { handleFindBackloggedQueues, handleFindIdleConsumers, handleDetectMessageLag } from '../../src/tools/diagnostic-tools';
jest.mock('../../src/semp/client');

const broker = { name: 'test', label: 'Test', url: 'http://x', username: 'a', password: 'b' };
const registry = new BrokerRegistry([broker]);
beforeEach(() => { jest.clearAllMocks(); });

const queues = [
  { queueName: 'heavy', spooledMsgCount: 5000, maxMsgSpoolUsage: 10000, msgSpoolUsage: 9000, bindCount: 0 },
  { queueName: 'light', spooledMsgCount: 10, maxMsgSpoolUsage: 10000, msgSpoolUsage: 100, bindCount: 2 },
  { queueName: 'stuck', spooledMsgCount: 200, maxMsgSpoolUsage: 10000, msgSpoolUsage: 500, bindCount: 1 },
  { queueName: 'empty', spooledMsgCount: 0, maxMsgSpoolUsage: 10000, msgSpoolUsage: 0, bindCount: 0 },
];

describe('handleFindBackloggedQueues', () => {
  it('includes queues above threshold', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: queues });
    const r = await handleFindBackloggedQueues(registry, 'test', 'default', 80);
    expect(r).toContain('heavy'); // 90% usage
  });
  it('excludes queues below threshold', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: queues });
    const r = await handleFindBackloggedQueues(registry, 'test', 'default', 80);
    expect(r).not.toContain('light'); // 1% usage
  });
  it('returns no-result message when nothing exceeds threshold', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ queueName: 'q', spooledMsgCount: 0, maxMsgSpoolUsage: 1000, msgSpoolUsage: 0, bindCount: 0 }] });
    const r = await handleFindBackloggedQueues(registry, 'test', 'default', 80);
    expect(r).toContain('No queues exceed');
  });
});

describe('handleFindIdleConsumers', () => {
  it('finds queues with consumers but backlog', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: queues });
    const r = await handleFindIdleConsumers(registry, 'test', 'default');
    expect(r).toContain('stuck'); // bindCount=1, spooledMsgCount=200
  });
  it('excludes queues without consumers', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: queues });
    const r = await handleFindIdleConsumers(registry, 'test', 'default');
    expect(r).not.toContain('heavy'); // bindCount=0
  });
});

describe('handleDetectMessageLag', () => {
  it('classifies HIGH severity correctly', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: queues });
    const r = await handleDetectMessageLag(registry, 'test', 'default');
    const parsed = JSON.parse(r);
    const heavy = parsed.find((q: any) => q.queue === 'heavy');
    expect(heavy.severity).toBe('HIGH');
  });
  it('returns no-result message when no lag', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ queueName: 'q', spooledMsgCount: 0 }] });
    const r = await handleDetectMessageLag(registry, 'test', 'default');
    expect(r).toContain('No message lag');
  });
});

const TRUNCATION_WARNING = 'Results limited to 500 queues';

describe('pagination truncation warning', () => {
  beforeEach(() => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({
      data: queues,
      meta: { paging: { nextPageUri: '/SEMP/v2/monitor/msgVpns/default/queues?cursor=abc' } },
    });
  });

  it('find_backlogged_queues warns when results are truncated', async () => {
    const r = await handleFindBackloggedQueues(registry, 'test', 'default', 0);
    expect(r).toContain(TRUNCATION_WARNING);
  });
  it('find_idle_consumers warns when results are truncated', async () => {
    const r = await handleFindIdleConsumers(registry, 'test', 'default');
    expect(r).toContain(TRUNCATION_WARNING);
  });
  it('detect_message_lag warns when results are truncated', async () => {
    const r = await handleDetectMessageLag(registry, 'test', 'default');
    expect(r).toContain(TRUNCATION_WARNING);
  });
  it('no warning when all results fit in one page', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: queues, meta: {} });
    const r = await handleFindBackloggedQueues(registry, 'test', 'default', 0);
    expect(r).not.toContain(TRUNCATION_WARNING);
  });
});
