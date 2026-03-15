import { BrokerRegistry } from '../../src/brokers/registry';

const sample = { name: 'test', label: 'Test Broker', url: 'http://localhost:8080', username: 'admin', password: 'admin' };

describe('BrokerRegistry', () => {
  let registry: BrokerRegistry;
  beforeEach(() => { registry = new BrokerRegistry([]); });

  it('starts empty', () => expect(registry.list()).toHaveLength(0));
  it('adds a broker', () => { registry.add(sample); expect(registry.list()).toHaveLength(1); });
  it('list() omits credentials', () => {
    registry.add(sample);
    expect(registry.list()[0]).not.toHaveProperty('password');
  });
  it('get() returns credentials', () => {
    registry.add(sample);
    expect(registry.get('test')!.password).toBe('admin');
  });
  it('get() is case-insensitive', () => {
    registry.add(sample);
    expect(registry.get('TEST')).toBeDefined();
  });
  it('throws on duplicate', () => {
    registry.add(sample);
    expect(() => registry.add(sample)).toThrow(/already registered/);
  });
  it('removes a broker', () => {
    registry.add(sample); registry.remove('test');
    expect(registry.list()).toHaveLength(0);
  });
  it('throws removing non-existent', () => {
    expect(() => registry.remove('ghost')).toThrow(/not registered/);
  });
  it('getOrThrow helpful message when empty', () => {
    expect(() => new BrokerRegistry([]).getOrThrow('x')).toThrow(/No brokers registered/);
  });
  it('getOrThrow helpful message when name not found in non-empty registry', () => {
    registry.add(sample);
    expect(() => registry.getOrThrow('unknown')).toThrow(/not registered/);
  });
});
