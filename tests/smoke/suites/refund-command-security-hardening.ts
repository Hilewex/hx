import { strict as assert } from 'node:assert';
import { ActorContext, RefundResponse } from '../../../packages/contracts/src';
import {
  handleManualRefundEscalation,
  handleProcessRefund,
  handleReviewRefund,
  handleTransitionRefund,
  resetRefundOperationalIdempotencyForTesting,
} from '../../../apps/bff/src/server/refund';
import { resetRefundRepository } from '../../../services/refund/src/repository';
import { SmokeResult, SmokeRunner } from '../types';

const financeActor: ActorContext = {
  role: 'FINANCE',
  isAuthenticated: true,
  actorId: 'finance-refund-smoke',
  sessionId: 'session-refund-smoke',
};

const customerActor: ActorContext = {
  role: 'CUSTOMER',
  isAuthenticated: true,
  actorId: 'customer-refund-smoke',
  sessionId: 'session-customer-smoke',
};

const refund: RefundResponse = {
  refundId: 'refund-security-smoke',
  cancelReturnRequestId: 'return-security-smoke',
  sourceType: 'RETURN',
  state: 'CREATED',
  lines: [],
  amountSummary: {
    requestedAmount: 0,
    approvedAmount: 0,
    refundedAmount: 0,
    currency: 'TRY',
  },
  paymentSummary: {
    simulationOnly: true,
    actualProviderRefundPerformed: false,
  },
  settlementImpactSummary: {
    settlementAdjustmentRequired: true,
    actualSettlementMutationPerformed: false,
  },
  payoutImpactSummary: {
    payoutAdjustmentRequired: true,
    actualPayoutMutationPerformed: false,
  },
  errors: [],
  warnings: [],
};

function seedRefundRepository() {
  let currentRefund = { ...refund };
  resetRefundRepository({
    async save(nextRefund: RefundResponse) {
      currentRefund = { ...nextRefund };
    },
    async getById(refundId: string) {
      return refundId === currentRefund.refundId ? { ...currentRefund } : undefined;
    },
    async getByIdempotencyKey() {
      return undefined;
    },
    async getByCancelReturnRequestId(requestId: string) {
      return requestId === currentRefund.cancelReturnRequestId ? { ...currentRefund } : undefined;
    },
  });
}

export const refundCommandSecurityHardeningSmoke: SmokeRunner = {
  name: 'refund-command-security-hardening',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      resetRefundOperationalIdempotencyForTesting();
      seedRefundRepository();

      const forbidden = await handleProcessRefund(customerActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-process-forbidden',
        evidenceRefs: ['case:forbidden'],
      });
      assert.equal(forbidden.status, 403);

      const missingIdempotency = await handleProcessRefund(financeActor, {
        refundId: refund.refundId,
        evidenceRefs: ['case:missing-idempotency'],
      });
      assert.equal(missingIdempotency.status, 400);

      const reviewMissingReason = await handleReviewRefund(financeActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-review-missing-reason',
        evidenceRefs: ['case:review'],
      });
      assert.equal(reviewMissingReason.status, 400);

      const escalationMissingEvidence = await handleManualRefundEscalation(financeActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-escalation-missing-evidence',
        reasonCode: 'MANUAL_REVIEW',
      });
      assert.equal(escalationMissingEvidence.status, 400);

      const processAccepted = await handleProcessRefund(financeActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-process-hardening',
        reasonCode: 'MANUAL_REVIEW',
        evidenceRefs: ['case:process'],
      });
      assert.equal(processAccepted.status, 200);
      assert.equal(processAccepted.body.data.idempotencyKey, 'refund-process-hardening');
      assert.equal(processAccepted.body.data.boundary.providerRefundExecuted, false);
      assert.equal(processAccepted.body.data.boundary.completedRefundTruthCreated, false);
      assert.equal(processAccepted.body.data.auditIntent.persisted, true);

      const replay = await handleProcessRefund(financeActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-process-hardening',
        reasonCode: 'MANUAL_REVIEW',
        evidenceRefs: ['case:process'],
      });
      assert.equal(replay.status, 200);
      assert.equal(replay.body.data.idempotentReplay, true);

      const completedTransition = await handleTransitionRefund(financeActor, {
        refundId: refund.refundId,
        targetState: 'SUCCEEDED',
        idempotencyKey: 'refund-transition-succeeded-blocked',
        reasonCode: 'MANUAL_REVIEW',
        evidenceRefs: ['case:transition'],
      });
      assert.equal(completedTransition.status, 400);

      return {
        result: 'PASS',
        message:
          'refund command hardening passed with role guard, persistent idempotent replay, audit intent, evidence checks, and completed truth block.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetRefundOperationalIdempotencyForTesting();
      resetRefundRepository();
    }
  },
};
