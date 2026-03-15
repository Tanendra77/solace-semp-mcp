import { RiskTier } from './tiers';
export { RiskTier };

export interface DryRunOptions {
  tier: RiskTier; action: string; brokerName: string;
  brokerLabel: string; sempEndpoint: string; effect: string;
}

export function buildDryRunResponse(opts: DryRunOptions): string {
  const warning = opts.tier === RiskTier.DELETE ? '\n⚠️  This operation cannot be undone.' : '';
  return [
    `[DRY RUN] About to ${opts.action} on broker "${opts.brokerName}" (${opts.brokerLabel}).`,
    '', `Operation: ${opts.sempEndpoint}`,
    `Effect: ${opts.effect}${warning}`, '',
    'To execute, call this tool again with confirm: true.',
  ].join('\n');
}

export function buildExecutedResponse(brokerName: string, brokerLabel: string, action: string, sempStatus: string): string {
  return `[EXECUTED] ${action} on broker "${brokerName}" (${brokerLabel}).\nSEMP response: ${sempStatus}`;
}

export function requiresConfirmation(tier: RiskTier): boolean {
  return tier === RiskTier.WRITE || tier === RiskTier.DELETE;
}
