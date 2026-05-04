import { RefundResponse } from '@hx/contracts';

export interface IRefundRepository {
  save(refund: RefundResponse, idempotencyKey?: string): Promise<void>;
  getById(refundId: string): Promise<RefundResponse | undefined>;
  getByIdempotencyKey(key: string): Promise<RefundResponse | undefined>;
  getByCancelReturnRequestId(requestId: string): Promise<RefundResponse | undefined>;
}
