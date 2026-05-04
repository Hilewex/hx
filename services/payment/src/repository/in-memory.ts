import { PaymentInitiationResponse } from '@hx/contracts';
import { IPaymentRepository } from './interface';

export class InMemoryPaymentRepository implements IPaymentRepository {
  private payments: Map<string, PaymentInitiationResponse> = new Map();
  private idempotency: Map<string, PaymentInitiationResponse> = new Map();

  async save(payment: PaymentInitiationResponse): Promise<void> {
    this.payments.set(payment.paymentId, payment);
  }

  async getById(paymentId: string): Promise<PaymentInitiationResponse | undefined> {
    return this.payments.get(paymentId);
  }

  async getByPaymentAttemptId(paymentAttemptId: string): Promise<PaymentInitiationResponse | undefined> {
    return Array.from(this.payments.values()).find(p => p.attempt.paymentAttemptId === paymentAttemptId);
  }

  async getByIdempotencyKey(namespace: string, key: string): Promise<PaymentInitiationResponse | undefined> {
    return this.idempotency.get(`${namespace}:${key}`);
  }

  async saveWithIdempotency(namespace: string, key: string, payment: PaymentInitiationResponse): Promise<void> {
    await this.save(payment);
    this.idempotency.set(`${namespace}:${key}`, payment);
  }
}
