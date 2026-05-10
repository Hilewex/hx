import { CreateRiskSignalCommand, CreateRiskCaseCommand, ReviewRiskCaseCommand, GetRiskCaseQuery, ListRiskCasesQuery, RiskMutationResult, RiskCaseResponse, RiskCaseListResponse, RiskSignal } from '@hx/contracts';
export declare function createRiskSignal(command: CreateRiskSignalCommand): Promise<RiskMutationResult>;
export declare function createRiskCase(command: CreateRiskCaseCommand): Promise<RiskMutationResult>;
export declare function reviewRiskCase(command: ReviewRiskCaseCommand): Promise<RiskMutationResult>;
export declare function createInternalRiskSignal(params: {
    targetId: string;
    targetType: any;
    type: any;
    level: any;
    source: any;
    reasonCode: any;
    metadata?: Record<string, any>;
    correlationId?: string;
}): Promise<RiskMutationResult>;
export declare function getRiskCase(query: GetRiskCaseQuery): Promise<RiskCaseResponse>;
export declare function listRiskCases(query: ListRiskCasesQuery): Promise<RiskCaseListResponse>;
export declare function listRiskSignals(query: {
    targetId?: string;
    targetType?: any;
    limit?: number;
    offset?: number;
}): Promise<{
    signals: RiskSignal[];
    total: number;
}>;
//# sourceMappingURL=risk.d.ts.map