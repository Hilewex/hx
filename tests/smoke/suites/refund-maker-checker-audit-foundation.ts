import { strict as assert } from 'node:assert';
import { ActorContext, RefundResponse } from '../../../packages/contracts/src';
import {
  handleGetRefundReviewDetailProjection,
  handleManualRefundEscalation,
  handleReviewRefund,
  resetRefundOperationalIdempotencyForTesting,
} from '../../../apps/bff/src/server/refund';
import { resetRefundRepository } from '../../../services/refund/src/repository';
import { SmokeResult, SmokeRunner } from '../types';

const makerActor: ActorContext = {
  role: 'FINANCE',
  isAuthenticated: true,
  actorId: 'finance-maker-smoke',
  sessionId: 'session-finance-maker-smoke',
};

const refund: RefundResponse = {
  refundId: 'refund-maker-checker-smoke',
  cancelReturnRequestId: 'return-maker-checker-smoke',
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

export const refundMakerCheckerAuditFoundationSmoke: SmokeRunner = {
  name: 'refund-maker-checker-audit-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      resetRefundOperationalIdempotencyForTesting();
      seedRefundRepository();

      const missingMaker = await handleReviewRefund(makerActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-review-missing-maker',
        reasonCode: 'MANUAL_REVIEW',
        evidenceRefs: ['case:maker-required'],
      });
      assert.equal(missingMaker.status, 400);

      const selfCheck = await handleReviewRefund(makerActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-review-self-check',
        makerActorId: makerActor.actorId,
        checkerActorId: makerActor.actorId,
        reasonCode: 'MANUAL_REVIEW',
        evidenceRefs: ['case:self-check'],
      });
      assert.equal(selfCheck.status, 403);

      const prepared = await handleReviewRefund(makerActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-review-checker-required',
        makerActorId: makerActor.actorId,
        reasonCode: 'MANUAL_REVIEW',
        evidenceRefs: ['case:prepared'],
        decision: 'APPROVE_FOR_OWNER_REVIEW',
      });
      assert.equal(prepared.status, 200);
      assert.equal(prepared.body.data.reviewWorkflowState, 'checker_required');
      assert.equal(prepared.body.data.auditIntent.persisted, true);
      assert.equal(prepared.body.data.boundary.providerRefundExecuted, false);
      assert.equal(prepared.body.data.boundary.settlementMutated, false);
      assert.equal(prepared.body.data.boundary.payoutMutated, false);
      assert.equal(prepared.body.data.boundary.completedRefundTruthCreated, false);

      const checked = await handleReviewRefund(makerActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-review-checked',
        makerActorId: makerActor.actorId,
        checkerActorId: 'finance-checker-smoke',
        reasonCode: 'MANUAL_REVIEW',
        evidenceRefs: ['case:checked'],
        decision: 'APPROVE_FOR_OWNER_REVIEW',
      });
      assert.equal(checked.status, 200);
      assert.equal(checked.body.data.reviewWorkflowState, 'checked');
      assert.equal(checked.body.data.auditIntent.makerCheckerContext.sameActorApprovalBlocked, true);

      const escalated = await handleManualRefundEscalation(makerActor, {
        refundId: refund.refundId,
        idempotencyKey: 'refund-review-escalated',
        makerActorId: makerActor.actorId,
        reasonCode: 'MANUAL_REVIEW',
        evidenceRefs: ['case:escalated'],
      });
      assert.equal(escalated.status, 200);
      assert.equal(escalated.body.data.reviewWorkflowState, 'escalated');

      const detail = await handleGetRefundReviewDetailProjection(makerActor, refund.refundId);
      assert.equal(detail.status, 200);
      assert.equal(detail.body.data.makerChecker.reviewWorkflowStateProjection, 'escalated');
      assert.equal(detail.body.data.auditEvidence.auditIntentPersistedProjection, true);
      assert.equal(detail.body.data.boundaryFlags.refundExecutionTruth, false);
      assert.equal(detail.body.data.boundaryFlags.providerRefundTruth, false);
      assert.equal(detail.body.data.boundaryFlags.settlementTruth, false);
      assert.equal(detail.body.data.boundaryFlags.payoutTruth, false);

      return {
        result: 'PASS',
        message:
          'refund maker-checker audit foundation passed with maker requirement, self-check block, audit outbox intent, workflow states, and no financial truth mutation.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetRefundOperationalIdempotencyForTesting();
      resetRefundRepository();
    }
  },
};
