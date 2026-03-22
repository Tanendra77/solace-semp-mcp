import fs from 'fs';
import path from 'path';
import { loadBrokersFromFile, loadBrokersFromEnv, mergeBrokers } from '../../src/brokers/loader';

const validJson = JSON.stringify({ brokers: [{ name: 'test', label: 'Test', url: 'http://x', username: 'u', password: 'p' }] });
const invalidJson = 'not json';
const wrongShapeJson = JSON.stringify({ brokers: 'oops' });
const missingFieldsJson = JSON.stringify({ brokers: [{ name: 'x' }] });

describe('loadBrokersFromFile', () => {
  const tmpFile = path.join(__dirname, '__tmp_brokers.json');
  afterEach(() => { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); });

  it('returns brokers from a valid file', () => {
    fs.writeFileSync(tmpFile, validJson);
    const result = loadBrokersFromFile(tmpFile);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('test');
  });

  it('returns [] if file does not exist', () => {
    expect(loadBrokersFromFile('/nonexistent/path/brokers.json')).toEqual([]);
  });

  it('returns [] for invalid JSON', () => {
    fs.writeFileSync(tmpFile, invalidJson);
    expect(loadBrokersFromFile(tmpFile)).toEqual([]);
  });

  it('returns [] if brokers is not an array', () => {
    fs.writeFileSync(tmpFile, wrongShapeJson);
    expect(loadBrokersFromFile(tmpFile)).toEqual([]);
  });

  it('skips entries missing required fields', () => {
    fs.writeFileSync(tmpFile, missingFieldsJson);
    expect(loadBrokersFromFile(tmpFile)).toEqual([]);
  });
});

describe('loadBrokersFromEnv', () => {
  afterEach(() => {
    delete process.env['SEMP_BROKER_MYBROKER_URL'];
    delete process.env['SEMP_BROKER_MYBROKER_USERNAME'];
    delete process.env['SEMP_BROKER_MYBROKER_PASSWORD'];
    delete process.env['SEMP_BROKER_MYBROKER_LABEL'];
    delete process.env['SEMP_BROKER_INCOMPLETE_URL'];
  });

  it('loads a broker from env vars', () => {
    process.env['SEMP_BROKER_MYBROKER_URL'] = 'http://host';
    process.env['SEMP_BROKER_MYBROKER_USERNAME'] = 'admin';
    process.env['SEMP_BROKER_MYBROKER_PASSWORD'] = 'secret';
    const result = loadBrokersFromEnv();
    const broker = result.find(b => b.name === 'mybroker');
    expect(broker).toBeDefined();
    expect(broker!.url).toBe('http://host');
  });

  it('skips incomplete env broker missing PASSWORD', () => {
    process.env['SEMP_BROKER_INCOMPLETE_URL'] = 'http://host';
    const result = loadBrokersFromEnv();
    expect(result.find(b => b.name === 'incomplete')).toBeUndefined();
  });

  it('uses name as label if LABEL not set', () => {
    process.env['SEMP_BROKER_MYBROKER_URL'] = 'http://host';
    process.env['SEMP_BROKER_MYBROKER_USERNAME'] = 'admin';
    process.env['SEMP_BROKER_MYBROKER_PASSWORD'] = 'secret';
    const result = loadBrokersFromEnv();
    expect(result[0]!.label).toBe('mybroker');
  });
});

describe('mergeBrokers', () => {
  const file = [{ name: 'a', label: 'A', url: 'http://file', username: 'u', password: 'p' }];
  const env  = [{ name: 'a', label: 'A-env', url: 'http://env', username: 'u2', password: 'p2' }];

  it('env entries override file entries with the same name', () => {
    const result = mergeBrokers(file, env);
    expect(result).toHaveLength(1);
    expect(result[0]!.url).toBe('http://env');
  });

  it('combines non-overlapping entries', () => {
    const env2 = [{ name: 'b', label: 'B', url: 'http://b', username: 'u', password: 'p' }];
    expect(mergeBrokers(file, env2)).toHaveLength(2);
  });
});
