export enum RiskTier { READ = 'READ', WRITE = 'WRITE', DELETE = 'DELETE' }

export function tierFromMethod(method: string): RiskTier {
  switch (method.toUpperCase()) {
    case 'GET': return RiskTier.READ;
    case 'DELETE': return RiskTier.DELETE;
    default: return RiskTier.WRITE;
  }
}
