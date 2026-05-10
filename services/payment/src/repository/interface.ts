import { PaymentInitiationResponse } from '@hx/contracts';

export interface IPaymentRepository {
  save(payment: PaymentInitiationResponse): Promise<void>;
  getById(paymentId: string): Promise<PaymentInitiationResponse | undefined>;
  getByPaymentAttemptId(paymentAttemptId: string): Promise<PaymentInitiationResponse | undefined>;
  getByProviderReference(providerName: string, providerReference: string): Promise<PaymentInitiationResponse | undefined>;
  getByIdempotencyKey(namespace: string, key: string): Promise<PaymentInitiationResponse | undefined>;
  saveWithIdempotency(namespace: string, key: string, payment: PaymentInitiationResponse): Promise<void>;
}
