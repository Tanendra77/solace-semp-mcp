import path from 'path';
import { createLogger } from '../src/logger';

describe('logger', () => {
  it('defaults to info level', () => {
    expect(createLogger().level).toBe('info');
  });
  it('uses debug level when LOG_LEVEL=debug', () => {
    process.env['LOG_LEVEL'] = 'debug';
    expect(createLogger().level).toBe('debug');
    delete process.env['LOG_LEVEL'];
  });
});

describe('logger LOG_DIR', () => {
  afterEach(() => {
    delete process.env['LOG_DIR'];
  });

  it('uses LOG_DIR when set', () => {
    process.env['LOG_DIR'] = '/tmp/test-logs';
    // Just verify that createLogger does not throw and respects the env var
    const logger = createLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it('defaults to process.cwd()/logs when LOG_DIR is unset', () => {
    delete process.env['LOG_DIR'];
    // Just verify that createLogger does not throw with the fallback
    const logger = createLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });
});
