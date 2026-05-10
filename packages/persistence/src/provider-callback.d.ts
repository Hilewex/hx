import { ProviderCallbackProcessingStatus, ProviderCallbackRecord } from '@hx/contracts';
export interface ProviderCallbackEventRepository {
    insertProviderCallbackEvent(record: Omit<ProviderCallbackRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderCallbackRecord>;
    getProviderCallbackEventById(id: string): Promise<ProviderCallbackRecord | null>;
    findProviderCallbackEventByProviderEventId(providerDomain: string, providerName: string, providerEventId: string): Promise<ProviderCallbackRecord | null>;
    findProviderCallbackEventByIdempotencyKey(providerDomain: string, providerName: string, idempotencyKey: string): Promise<ProviderCallbackRecord | null>;
    markProviderCallbackEventProcessed(id: string, processingStatus: ProviderCallbackProcessingStatus, processedAt?: Date): Promise<ProviderCallbackRecord | null>;
    listProviderCallbackEventsByProcessingStatus(processingStatus: ProviderCallbackProcessingStatus, limit?: number): Promise<ProviderCallbackRecord[]>;
}
export declare class InMemoryProviderCallbackEventRepository implements ProviderCallbackEventRepository {
    private events;
    private eventIdIndex;
    private idempotencyKeyIndex;
    insertProviderCallbackEvent(record: Omit<ProviderCallbackRecord, 'id'>): Promise<ProviderCallbackRecord>;
    getProviderCallbackEventById(id: string): Promise<ProviderCallbackRecord | null>;
    findProviderCallbackEventByProviderEventId(providerDomain: string, providerName: string, providerEventId: string): Promise<ProviderCallbackRecord | null>;
    findProviderCallbackEventByIdempotencyKey(providerDomain: string, providerName: string, idempotencyKey: string): Promise<ProviderCallbackRecord | null>;
    markProviderCallbackEventProcessed(id: string, processingStatus: ProviderCallbackProcessingStatus, processedAt?: Date): Promise<ProviderCallbackRecord | null>;
    listProviderCallbackEventsByProcessingStatus(processingStatus: ProviderCallbackProcessingStatus, limit?: number): Promise<ProviderCallbackRecord[]>;
}
export declare class PostgresProviderCallbackEventRepository implements ProviderCallbackEventRepository {
    constructor();
    insertProviderCallbackEvent(record: Omit<ProviderCallbackRecord, 'id'>): Promise<ProviderCallbackRecord>;
    getProviderCallbackEventById(id: string): Promise<ProviderCallbackRecord | null>;
    findProviderCallbackEventByProviderEventId(providerDomain: string, providerName: string, providerEventId: string): Promise<ProviderCallbackRecord | null>;
    findProviderCallbackEventByIdempotencyKey(providerDomain: string, providerName: string, idempotencyKey: string): Promise<ProviderCallbackRecord | null>;
    markProviderCallbackEventProcessed(id: string, processingStatus: ProviderCallbackProcessingStatus, processedAt?: Date): Promise<ProviderCallbackRecord | null>;
    listProviderCallbackEventsByProcessingStatus(processingStatus: ProviderCallbackProcessingStatus, limit?: number): Promise<ProviderCallbackRecord[]>;
}
export declare function getProviderCallbackEventRepository(): ProviderCallbackEventRepository;
//# sourceMappingURL=provider-callback.d.ts.map