import { IRefundRepository } from './interface';
import { RefundResponse } from '@hx/contracts';

export class InMemoryRefundRepository implements IRefundRepository {
  private refunds = new Map<string, RefundResponse>();
  private idempotencyMap = new Map<string, RefundResponse>();

  async save(refund: RefundResponse, idempotencyKey?: string): Promise<void> {
    this.refunds.set(refund.refundId, { ...refund });
    if (idempotencyKey) {
      this.idempotencyMap.set(idempotencyKey, { ...refund });
    }
  }

  async getById(refundId: string): Promise<RefundResponse | undefined> {
    const ref = this.refunds.get(refundId);
    return ref ? { ...ref } : undefined;
  }

  async getByIdempotencyKey(key: string): Promise<RefundResponse | undefined> {
    const ref = this.idempotencyMap.get(key);
    return ref ? { ...ref } : undefined;
  }

  async getByCancelReturnRequestId(requestId: string): Promise<RefundResponse | undefined> {
    for (const ref of this.refunds.values()) {
      if (ref.cancelReturnRequestId === requestId) {
        return { ...ref };
      }
    }
    return undefined;
  }
}
