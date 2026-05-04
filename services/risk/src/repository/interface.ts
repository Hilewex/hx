import { RiskSignal, RiskCase, RiskTargetType, RiskCaseStatus, RiskLevel } from '@hx/contracts';

export interface IRiskRepository {
  createSignal(signal: RiskSignal): Promise<void>;
  createCase(riskCase: RiskCase): Promise<void>;
  updateCase(caseId: string, updates: Partial<RiskCase>): Promise<void>;
  getCase(caseId: string): Promise<RiskCase | null>;
  listCases(query: {
    targetId?: string;
    targetType?: RiskTargetType;
    status?: RiskCaseStatus;
    level?: RiskLevel;
    limit?: number;
    offset?: number;
  }): Promise<{ cases: RiskCase[]; total: number }>;
  listSignals(query: {
    targetId?: string;
    targetType?: RiskTargetType;
    limit?: number;
    offset?: number;
  }): Promise<{ signals: RiskSignal[]; total: number }>;
  checkIdempotency(key: string): Promise<string | null>;
  saveIdempotency(key: string, result: string): Promise<void>;
}
