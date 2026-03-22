import { RiskTier, tierFromMethod } from './tiers';
export { RiskTier, tierFromMethod };
export interface DryRunOptions {
    tier: RiskTier;
    action: string;
    brokerName: string;
    brokerLabel: string;
    sempEndpoint: string;
    effect: string;
}
export declare function buildDryRunResponse(opts: DryRunOptions): string;
export declare function buildExecutedResponse(brokerName: string, brokerLabel: string, action: string, sempStatus: string): string;
export declare function requiresConfirmation(tier: RiskTier): boolean;
