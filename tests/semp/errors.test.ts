import { mapSempError } from '../../src/semp/errors';
import { AxiosError } from 'axios';

function makeErr(status: number, description: string): AxiosError {
  const err = new AxiosError('Request failed');
  err.response = { status, data: { meta: { error: { description } } }, statusText: '', headers: {}, config: {} as any };
  return err;
}

describe('mapSempError', () => {
  it('maps 400', () => expect(mapSempError(makeErr(400, 'Bad field'), 'prod')).toContain('Invalid request'));
  it('maps 401', () => expect(mapSempError(makeErr(401, 'x'), 'prod')).toContain('Authentication failed'));
  it('maps 403', () => expect(mapSempError(makeErr(403, 'x'), 'prod')).toContain('Permission denied'));
  it('maps 404', () => expect(mapSempError(makeErr(404, 'Queue not found'), 'prod')).toContain('Resource not found'));
  it('maps 409', () => expect(mapSempError(makeErr(409, 'Exists'), 'prod')).toContain('Conflict'));
  it('maps 503', () => expect(mapSempError(makeErr(503, 'x'), 'prod')).toContain('unreachable or SEMP is disabled'));
  it('maps ECONNREFUSED', () => {
    const err = Object.assign(new AxiosError('conn'), { code: 'ECONNREFUSED' });
    expect(mapSempError(err, 'prod')).toContain('network connectivity');
  });
  it('maps ETIMEDOUT', () => {
    const err = Object.assign(new AxiosError('timeout'), { code: 'ETIMEDOUT' });
    expect(mapSempError(err, 'prod')).toContain('unreachable');
  });
});
