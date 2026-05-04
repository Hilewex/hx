import { ICancelReturnRepository } from './interface';
import { CancelReturnResponse } from '@hx/contracts';

export class InMemoryCancelReturnRepository implements ICancelReturnRepository {
  private requests = new Map<string, CancelReturnResponse>();
  private idempotencyMap = new Map<string, CancelReturnResponse>();

  async save(request: CancelReturnResponse, idempotencyKey?: string): Promise<void> {
    this.requests.set(request.requestId, { ...request });
    if (idempotencyKey) {
      this.idempotencyMap.set(idempotencyKey, { ...request });
    }
  }

  async getById(requestId: string): Promise<CancelReturnResponse | undefined> {
    const req = this.requests.get(requestId);
    return req ? { ...req } : undefined;
  }

  async getByIdempotencyKey(key: string): Promise<CancelReturnResponse | undefined> {
    const req = this.idempotencyMap.get(key);
    return req ? { ...req } : undefined;
  }

  async getByOrderId(orderId: string): Promise<CancelReturnResponse[]> {
    const result: CancelReturnResponse[] = [];
    for (const req of this.requests.values()) {
      if (req.orderId === orderId) {
        result.push({ ...req });
      }
    }
    return result;
  }
}
