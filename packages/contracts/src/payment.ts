import { CartContext } from './cart';
import { ProviderResultEnvelope } from './provider';

export type PaymentState = 'CREATED' | 'INITIATED' | 'FAILED' | 'CANCELLED' | 'SUCCEEDED';


export type PaymentAttemptState =
  | 'CREATED'
  | 'PROVIDER_REDIRECT_READY'
  | 'INITIATION_FAILED'
  | 'SUCCEEDED';

export type PaymentMethodType = 'CARD';

export interface InitiatePaymentCommand {
  checkoutId: string;
  cartContext: {
    actorType: 'GUEST' | 'CUSTOMER';
    actorId: string;
  };
  amount?: number;
  currency?: string;
  paymentMethod: PaymentMethodType;
  idempotencyKey?: string;
  simulationScenario?: 'succeeded' | 'pending' | 'unknown_result'; // HARDENING-09C
}

export interface PaymentAttempt {
  paymentAttemptId: string;
  checkoutId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  state: PaymentAttemptState;
  providerSimulationRef?: string;
  idempotencyKey: string;
}

export interface PaymentInitiationResponse {
  paymentId: string;
  cartContext: CartContext;
  checkoutId: string;
  state: PaymentState;
  attempt: PaymentAttempt;
  redirectUrl?: string;
  errors: string[];
  warnings: string[];
  providerEnvelope?: ProviderResultEnvelope;
}

export interface SimulatePaymentSuccessResponse {
  paymentId: string;
  paymentAttemptId: string;
  state: PaymentState;
  attemptState: PaymentAttemptState;
  errors: string[];
}
