import { CancelReturnResponse } from '@hx/contracts';

export interface ICancelReturnRepository {
  save(request: CancelReturnResponse, idempotencyKey?: string): Promise<void>;
  getById(requestId: string): Promise<CancelReturnResponse | undefined>;
  getByIdempotencyKey(key: string): Promise<CancelReturnResponse | undefined>;
  getByOrderId(orderId: string): Promise<CancelReturnResponse[]>;
}
