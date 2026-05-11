import { createModerationCase, getModerationCase, reviewModerationCase } from '@hx/moderation';
import { createRiskCase, createRiskSignal } from '@hx/risk';
import { SmokeRunner } from '../types';
import { issueDevAuthToken } from '../auth-utils';

const actor = { actorId: 'mod-checker-1', actorType: 'ADMIN', role: 'ADMIN' };

const evidence = (sourceId: string, summary = 'Smoke evidence') => [{
  evidenceId: `ev_${sourceId}`,
  evidenceType: 'SMOKE_ASSERTION',
  sourceType: 'SMOKE',
  sourceId,
  summary,
  createdAt: new Date().toISOString(),
}];

const createCase = async (targetId: string, targetType: any = 'REVIEW') => {
  const result = await createModerationCase({
    target: { targetType, targetId, ownerActorId: `owner-${targetId}` },
    source: 'ADMIN_REVIEW',
    riskLevel: 'MEDIUM',
    reasonCodes: ['POLICY_VIOLATION'],
    contentText: `moderation smoke content ${targetId}`,
    idempotencyKey: `mod-case-${targetId}`,
    correlationId: `corr-${targetId}`,
  });
  if (!result.caseId) throw new Error(`case not created for ${targetId}`);
  return result.caseId;
};

const expectReject = async (label: string, fn: () => Promise<unknown>, expected: string) => {
  try {
    await fn();
  } catch (error: any) {
    if (error?.message === expected) return;
    throw new Error(`${label} expected ${expected}, got ${error?.message || error}`);
  }
  throw new Error(`${label} was accepted`);
};

const json = async (res: Response): Promise<Record<string, any>> => (await res.json()) as Record<string, any>;

export const moderationDecisionAuditMakerCheckerSmoke: SmokeRunner = {
  name: 'moderation-decision-audit-maker-checker',
  run: async (baseUrl: string) => {
    try {
      const suffix = Date.now();

      const noActorCaseId = await createCase(`no-actor-${suffix}`);
      await expectReject('decision without actor', () => reviewModerationCase({
        caseId: noActorCaseId,
        decision: 'APPROVE',
        reasonCode: 'POLICY_VIOLATION',
        evidence: evidence('no-actor'),
      }), 'MODERATION_DECISION_ACTOR_REQUIRED');

      const noEvidenceCaseId = await createCase(`no-evidence-${suffix}`);
      await expectReject('decision without evidence', () => reviewModerationCase({
        caseId: noEvidenceCaseId,
        decision: 'APPROVE',
        actor,
        reasonCode: 'POLICY_VIOLATION',
      }), 'MODERATION_DECISION_EVIDENCE_REQUIRED');

      const approveCaseId = await createCase(`approve-${suffix}`);
      const approveResult = await reviewModerationCase({
        caseId: approveCaseId,
        decision: 'APPROVE',
        actor,
        reasonCode: 'POLICY_VIOLATION',
        evidence: evidence('approve'),
        ownerHandoffCreated: true,
        makerCheckerContext: {
          checkerActorId: actor.actorId,
          submittedByActorId: `owner-approve-${suffix}`,
          requiresSeparateChecker: true,
        },
        idempotencyKey: `decision-approve-${suffix}`,
      });
      if (!approveResult.success || !approveResult.auditRecorded || !approveResult.evidenceRecorded) {
        throw new Error('approve decision did not record audit/evidence');
      }
      if (approveResult.visibilityTruthMutatedByBff !== false || approveResult.ownerHandoffCreated !== true) {
        throw new Error('approve decision boundary flags invalid');
      }

      const rejectCaseId = await createCase(`reject-${suffix}`);
      const rejectResult = await reviewModerationCase({
        caseId: rejectCaseId,
        decision: 'REJECT',
        actor,
        reasonCode: 'ABUSE',
        evidence: evidence('reject'),
        ownerHandoffCreated: true,
        idempotencyKey: `decision-reject-${suffix}`,
      });
      if (!rejectResult.success || rejectResult.decisionType !== 'REJECT') {
        throw new Error('reject decision not accepted');
      }

      const duplicateCaseId = await createCase(`dupe-${suffix}`);
      const duplicateCommand = {
        caseId: duplicateCaseId,
        decision: 'APPROVE' as const,
        actor,
        reasonCode: 'POLICY_VIOLATION',
        evidence: evidence('dupe'),
        idempotencyKey: `decision-dupe-${suffix}`,
      };
      const duplicateFirst = await reviewModerationCase(duplicateCommand);
      const duplicateSecond = await reviewModerationCase(duplicateCommand);
      if (duplicateFirst.decisionId !== duplicateSecond.decisionId) {
        throw new Error('same idempotency key/payload created duplicate decision');
      }
      await expectReject('same key different payload', () => reviewModerationCase({
        ...duplicateCommand,
        reasonCode: 'SPAM',
      }), 'MODERATION_DECISION_IDEMPOTENCY_CONFLICT');

      const makerCheckerCaseId = await createCase(`maker-checker-${suffix}`);
      await expectReject('same actor maker/checker', () => reviewModerationCase({
        caseId: makerCheckerCaseId,
        decision: 'REJECT',
        actor,
        reasonCode: 'ABUSE',
        evidence: evidence('maker-checker'),
        makerCheckerContext: {
          makerActorId: actor.actorId,
          checkerActorId: actor.actorId,
          submittedByActorId: `submitter-${suffix}`,
          requiresSeparateChecker: true,
        },
      }), 'MODERATION_MAKER_CHECKER_SAME_ACTOR_FORBIDDEN');

      const signal = await createRiskSignal({
        target: { targetId: `risk-target-${suffix}`, targetType: 'STORY' },
        type: 'MANUAL_REPORT',
        level: 'HIGH',
        source: 'ADMIN_REVIEW',
        reasonCode: 'UNKNOWN',
        metadata: { smoke: true },
        idempotencyKey: `risk-signal-${suffix}`,
        correlationId: `corr-${suffix}`,
      });
      if (!signal.signalId) throw new Error('risk signal not created');
      const riskCase = await createRiskCase({
        target: { targetId: `risk-target-${suffix}`, targetType: 'STORY' },
        level: 'HIGH',
        source: 'ADMIN_REVIEW',
        reasonCode: 'UNKNOWN',
        signals: [signal.signalId],
        idempotencyKey: `risk-case-${suffix}`,
        correlationId: `corr-${suffix}`,
      });
      if (!riskCase.caseId) throw new Error('risk case not created from signal');

      const checkedCase = await getModerationCase({ caseId: approveCaseId });
      if (checkedCase.data.targetTruthMutated !== false || checkedCase.data.reviewTruthMutated !== false) {
        throw new Error('moderation case claimed owner visibility truth mutation');
      }

      const customerToken = issueDevAuthToken(`mc-customer-${suffix}`, 'CUSTOMER');
      const adminToken = issueDevAuthToken(`mc-admin-${suffix}`, 'ADMIN');
      const productId = `mc-prod-${suffix}`;
      const reviewCreate = await fetch(`${baseUrl}/review/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ productTag: { productId }, rating: 3, body: 'maker checker review' }),
      });
      if (!reviewCreate.ok) throw new Error(`review create failed: ${reviewCreate.status}`);
      const reviewId = (await json(reviewCreate)).data.review.reviewId;
      const pendingList = (await json(await fetch(`${baseUrl}/review/list?productId=${productId}`))).data.items;
      if (pendingList.some((item: any) => item.reviewId === reviewId)) {
        throw new Error('pending review leaked to public list');
      }
      const cases = (await json(await fetch(`${baseUrl}/moderation/list?targetType=REVIEW&limit=100`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }))).data.items;
      const reviewCase = cases.find((item: any) => item.target.targetId === reviewId);
      if (!reviewCase?.caseId) throw new Error('review moderation case not found');
      const rejectRes = await fetch(`${baseUrl}/moderation/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          caseId: reviewCase.caseId,
          decision: 'REJECT',
          reasonCode: 'ABUSE',
          evidence: evidence(`bff-review-${suffix}`, 'BFF protected moderation reject evidence'),
          idempotencyKey: `bff-review-reject-${suffix}`,
        }),
      });
      if (!rejectRes.ok) throw new Error(`BFF moderation reject failed: ${rejectRes.status}`);
      const rejectData = (await json(rejectRes)).data;
      if (rejectData.visibilityTruthMutatedByBff !== false || !rejectData.auditRecorded || !rejectData.evidenceRecorded) {
        throw new Error('BFF moderation result missing audit/evidence/boundary flags');
      }
      const rejectedList = (await json(await fetch(`${baseUrl}/review/list?productId=${productId}`))).data.items;
      if (rejectedList.some((item: any) => item.reviewId === reviewId)) {
        throw new Error('rejected review leaked to public list');
      }

      return {
        result: 'PASS',
        message: 'Decision actor/reason/evidence, audit, idempotency, maker-checker guard, risk boundary, BFF boundary flags, owner handoff path, and public leak regression verified',
      };
    } catch (error: any) {
      console.error('[DEBUG] moderation-decision-audit-maker-checker error:', error);
      return { result: 'FAIL', message: error instanceof Error ? error.message : JSON.stringify(error) };
    }
  },
};
