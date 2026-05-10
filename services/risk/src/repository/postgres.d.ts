import { Pool } from 'pg';
import { RiskSignal, RiskCase } from '@hx/contracts';
import { IRiskRepository } from './interface';
export declare class PostgresRiskRepository implements IRiskRepository {
    private pool;
    constructor(pool: Pool);
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
    private mapToDomain;
}
//# sourceMappingURL=postgres.d.ts.map