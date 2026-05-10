import { PaymentReconciliationTaskCandidate, ReconciliationStatus } from '@hx/contracts';
export type PaymentReconciliationTaskCreateInput = PaymentReconciliationTaskCandidate & {
    readonly reconciliationRef: string;
};
export interface PaymentReconciliationTaskStatusUpdate {
    readonly status: ReconciliationStatus;
    readonly nextAttemptAt?: Date;
    readonly manualReviewRequired?: boolean;
}
export interface PaymentReconciliationTaskAttemptUpdate {
    readonly attemptCount: number;
    readonly nextAttemptAt?: Date;
    readonly lastInquiryRef?: string;
    readonly lastCandidate?: PaymentReconciliationTaskCandidate['lastCandidate'];
}
export interface PaymentReconciliationTaskRepository {
    createTask(candidate: PaymentReconciliationTaskCreateInput): Promise<PaymentReconciliationTaskCandidate>;
    getTaskById(taskId: string): Promise<PaymentReconciliationTaskCandidate | null>;
    getTaskByReconciliationRef(reconciliationRef: string): Promise<PaymentReconciliationTaskCandidate | null>;
    findOpenTaskByProviderReference(providerName: string, providerReference: string): Promise<PaymentReconciliationTaskCandidate | null>;
    listTasksByStatus(status: ReconciliationStatus, limit?: number): Promise<PaymentReconciliationTaskCandidate[]>;
    updateTaskStatus(taskId: string, update: PaymentReconciliationTaskStatusUpdate): Promise<PaymentReconciliationTaskCandidate | null>;
    markTaskAttempt(taskId: string, update: PaymentReconciliationTaskAttemptUpdate): Promise<PaymentReconciliationTaskCandidate | null>;
}
export declare class InMemoryPaymentReconciliationTaskRepository implements PaymentReconciliationTaskRepository {
    private tasks;
    private reconciliationRefIndex;
    private nextId;
    createTask(candidate: PaymentReconciliationTaskCreateInput): Promise<PaymentReconciliationTaskCandidate>;
    getTaskById(taskId: string): Promise<PaymentReconciliationTaskCandidate | null>;
    getTaskByReconciliationRef(reconciliationRef: string): Promise<PaymentReconciliationTaskCandidate | null>;
    findOpenTaskByProviderReference(providerName: string, providerReference: string): Promise<PaymentReconciliationTaskCandidate | null>;
    listTasksByStatus(status: ReconciliationStatus, limit?: number): Promise<PaymentReconciliationTaskCandidate[]>;
    updateTaskStatus(taskId: string, update: PaymentReconciliationTaskStatusUpdate): Promise<PaymentReconciliationTaskCandidate | null>;
    markTaskAttempt(taskId: string, update: PaymentReconciliationTaskAttemptUpdate): Promise<PaymentReconciliationTaskCandidate | null>;
}
export declare class PostgresPaymentReconciliationTaskRepository implements PaymentReconciliationTaskRepository {
    createTask(candidate: PaymentReconciliationTaskCreateInput): Promise<PaymentReconciliationTaskCandidate>;
    getTaskById(taskId: string): Promise<PaymentReconciliationTaskCandidate | null>;
    getTaskByReconciliationRef(reconciliationRef: string): Promise<PaymentReconciliationTaskCandidate | null>;
    findOpenTaskByProviderReference(providerName: string, providerReference: string): Promise<PaymentReconciliationTaskCandidate | null>;
    listTasksByStatus(status: ReconciliationStatus, limit?: number): Promise<PaymentReconciliationTaskCandidate[]>;
    updateTaskStatus(taskId: string, update: PaymentReconciliationTaskStatusUpdate): Promise<PaymentReconciliationTaskCandidate | null>;
    markTaskAttempt(taskId: string, update: PaymentReconciliationTaskAttemptUpdate): Promise<PaymentReconciliationTaskCandidate | null>;
}
export declare function getPaymentReconciliationTaskRepository(): PaymentReconciliationTaskRepository;
//# sourceMappingURL=payment-reconciliation-task.d.ts.map