"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskTier = void 0;
exports.tierFromMethod = tierFromMethod;
var RiskTier;
(function (RiskTier) {
    RiskTier["READ"] = "READ";
    RiskTier["WRITE"] = "WRITE";
    RiskTier["DELETE"] = "DELETE";
})(RiskTier || (exports.RiskTier = RiskTier = {}));
function tierFromMethod(method) {
    switch (method.toUpperCase()) {
        case 'GET': return RiskTier.READ;
        case 'DELETE': return RiskTier.DELETE;
        default: return RiskTier.WRITE;
    }
}
//# sourceMappingURL=tiers.js.map