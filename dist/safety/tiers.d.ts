export declare enum RiskTier {
    READ = "READ",
    WRITE = "WRITE",
    DELETE = "DELETE"
}
export declare function tierFromMethod(method: string): RiskTier;
