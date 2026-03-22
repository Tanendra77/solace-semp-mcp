import { RiskTier, tierFromMethod } from '../../src/safety/tiers';

describe('tierFromMethod', () => {
  it('GET -> READ', () => expect(tierFromMethod('GET')).toBe(RiskTier.READ));
  it('DELETE -> DELETE', () => expect(tierFromMethod('DELETE')).toBe(RiskTier.DELETE));
  it('POST -> WRITE', () => expect(tierFromMethod('POST')).toBe(RiskTier.WRITE));
  it('PATCH -> WRITE', () => expect(tierFromMethod('PATCH')).toBe(RiskTier.WRITE));
  it('PUT -> WRITE', () => expect(tierFromMethod('PUT')).toBe(RiskTier.WRITE));
  it('case-insensitive: get -> READ', () => expect(tierFromMethod('get')).toBe(RiskTier.READ));
});
