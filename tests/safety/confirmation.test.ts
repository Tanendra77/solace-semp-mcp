import { buildDryRunResponse, buildExecutedResponse, RiskTier } from '../../src/safety/confirmation';

const base = { brokerName: 'prod', brokerLabel: 'Production', sempEndpoint: 'DELETE /x', effect: 'Gone.' };

describe('buildDryRunResponse', () => {
  it('includes [DRY RUN] and confirm instruction', () => {
    const r = buildDryRunResponse({ tier: RiskTier.DELETE, action: 'delete x', ...base });
    expect(r).toContain('[DRY RUN]');
    expect(r).toContain('confirm: true');
  });
  it('includes irreversibility warning for DELETE', () => {
    expect(buildDryRunResponse({ tier: RiskTier.DELETE, action: 'x', ...base })).toContain('cannot be undone');
  });
  it('no irreversibility warning for WRITE', () => {
    expect(buildDryRunResponse({ tier: RiskTier.WRITE, action: 'x', ...base, sempEndpoint: 'PATCH /x', effect: 'Updates.' }))
      .not.toContain('cannot be undone');
  });
});

describe('buildExecutedResponse', () => {
  it('includes [EXECUTED] and status', () => {
    const r = buildExecutedResponse('prod', 'Prod', 'Created queue', '200 OK');
    expect(r).toContain('[EXECUTED]');
    expect(r).toContain('200 OK');
  });
});
