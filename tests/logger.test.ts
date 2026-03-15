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
