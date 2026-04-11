import { BrokerRegistry } from '../../src/brokers/registry';
import { handleListBrokers, handleAddBroker, handleRemoveBroker, isPrivateUrl } from '../../src/tools/broker-tools';
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

describe('isPrivateUrl', () => {
  it('returns true for localhost', () => {
    expect(isPrivateUrl('http://localhost/semp')).toBe(true);
  });
  it('returns true for 127.0.0.1', () => {
    expect(isPrivateUrl('http://127.0.0.1:8080/semp')).toBe(true);
  });
  it('returns true for 10.x range', () => {
    expect(isPrivateUrl('http://10.0.0.1/semp')).toBe(true);
  });
  it('returns true for 192.168.x range', () => {
    expect(isPrivateUrl('http://192.168.1.100/semp')).toBe(true);
  });
  it('returns true for 172.16-31.x range', () => {
    expect(isPrivateUrl('http://172.20.0.1/semp')).toBe(true);
  });
  it('returns true for AWS metadata endpoint', () => {
    expect(isPrivateUrl('http://169.254.169.254/latest/meta-data')).toBe(true);
  });
  it('returns false for public hostname', () => {
    expect(isPrivateUrl('http://my-broker.example.com/semp')).toBe(false);
  });
  it('returns false for public IP', () => {
    expect(isPrivateUrl('http://8.8.8.8/semp')).toBe(false);
  });
});

describe('handleAddBroker with BLOCK_PRIVATE_BROKER_URLS', () => {
  afterEach(() => { delete process.env['BLOCK_PRIVATE_BROKER_URLS']; });

  it('allows private URL when BLOCK_PRIVATE_BROKER_URLS is unset', async () => {
    const reg = new BrokerRegistry([]);
    const result = await handleAddBroker(reg, {
      name: 'local', label: 'Local', url: 'http://localhost:8080',
      username: 'admin', password: 'pass',
    });
    expect(result).toContain('registered');
  });
});
