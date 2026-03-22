import { BrokerRegistry } from '../../src/brokers/registry';
import { handleListBrokers, handleAddBroker, handleRemoveBroker } from '../../src/tools/broker-tools';
import { SempClient } from '../../src/semp/client';
jest.mock('../../src/semp/client');

describe('handleListBrokers', () => {
  it('omits credentials', async () => {
    const reg = new BrokerRegistry([{ name: 'p', label: 'Prod', url: 'http://x', username: 'a', password: 'b' }]);
    expect(await handleListBrokers(reg)).not.toContain('"password"');
  });
  it('shows message when empty', async () => {
    expect(await handleListBrokers(new BrokerRegistry([]))).toContain('No brokers registered');
  });
});

describe('handleRemoveBroker', () => {
  it('dry_run without confirm', async () => {
    const reg = new BrokerRegistry([{ name: 'p', label: 'Prod', url: 'http://x', username: 'a', password: 'b' }]);
    expect(await handleRemoveBroker(reg, 'p', false)).toContain('[DRY RUN]');
  });
  it('executes with confirm', async () => {
    const reg = new BrokerRegistry([{ name: 'p', label: 'Prod', url: 'http://x', username: 'a', password: 'b' }]);
    expect(await handleRemoveBroker(reg, 'p', true)).toContain('[EXECUTED]');
    expect(reg.get('p')).toBeUndefined();
  });
});
