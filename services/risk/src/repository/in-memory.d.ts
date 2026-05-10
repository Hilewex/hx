import { RiskSignal, RiskCase } from '@hx/contracts';
import { IRiskRepository } from './interface';
export declare class InMemoryRiskRepository implements IRiskRepository {
    private signals;
    private cases;
    private idempotency;
    createSignal(signal: RiskSignal): Promise<void>;
    createCase(riskCase: RiskCase): Promise<void>;
    updateCase(caseId: string, updates: Partial<RiskCase>): Promise<void>;
    getCase(caseId: string): Promise<RiskCase | null>;
    listCases(query: any): Promise<{
        cases: RiskCase[];
        total: number;
    }>;
    listSignals(query: any): Promise<{
        signals: RiskSignal[];
        total: number;
    }>;
    checkIdempotency(key: string): Promise<string | null>;
    saveIdempotency(key: string, result: string): Promise<void>;
}
//# sourceMappingURL=in-memory.d.ts.map