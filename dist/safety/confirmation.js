"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tierFromMethod = exports.RiskTier = void 0;
exports.buildDryRunResponse = buildDryRunResponse;
exports.buildExecutedResponse = buildExecutedResponse;
exports.requiresConfirmation = requiresConfirmation;
const tiers_1 = require("./tiers");
Object.defineProperty(exports, "RiskTier", { enumerable: true, get: function () { return tiers_1.RiskTier; } });
Object.defineProperty(exports, "tierFromMethod", { enumerable: true, get: function () { return tiers_1.tierFromMethod; } });
function buildDryRunResponse(opts) {
    const warning = opts.tier === tiers_1.RiskTier.DELETE ? '\n⚠️  This operation cannot be undone.' : '';
    return [
        `[DRY RUN] About to ${opts.action} on broker "${opts.brokerName}" (${opts.brokerLabel}).`,
        '', `Operation: ${opts.sempEndpoint}`,
        `Effect: ${opts.effect}${warning}`, '',
        'To execute, call this tool again with confirm: true.',
    ].join('\n');
}
function buildExecutedResponse(brokerName, brokerLabel, action, sempStatus) {
    return `[EXECUTED] ${action} on broker "${brokerName}" (${brokerLabel}).\nSEMP response: ${sempStatus}`;
}
function requiresConfirmation(tier) {
    return tier === tiers_1.RiskTier.WRITE || tier === tiers_1.RiskTier.DELETE;
}
//# sourceMappingURL=confirmation.js.map