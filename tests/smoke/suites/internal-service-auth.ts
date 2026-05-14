import { randomUUID } from 'crypto';
import { getAdminHeaders, getInternalServiceHeaders, issueDevAuthToken } from '../auth-utils';
import { SmokeRunner } from '../types';

export const internalServiceAuthSmoke: SmokeRunner = {
  name: 'internal-service-auth',
  run: async (baseUrl: string) => {
    try {
      const adminHeaders = getAdminHeaders('admin-1');
      const actorId = 'risk-owner-internal-auth-smoke';
      const unsignedInternalHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${issueDevAuthToken(actorId, 'INTERNAL_SERVICE')}`,
      };
      const wrongAudienceHeaders = getInternalServiceHeaders(actorId, ['/fraud/review']);
      const signedInternalHeaders = getInternalServiceHeaders(actorId, ['/risk/case/review']);

      const createCaseRes = await fetch(`${baseUrl}/risk/case`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          target: { targetId: `auth-risk-${randomUUID()}`, targetType: 'PAYOUT' },
          level: 'HIGH',
          source: 'ADMIN_REVIEW',
          reasonCode: 'AUTH_SMOKE',
          signals: [],
          notes: 'Internal auth smoke case',
          correlationId: `auth-case-corr-${randomUUID()}`,
          idempotencyKey: `auth-case-idem-${randomUUID()}`,
        }),
      });
      if (!createCaseRes.ok) throw new Error(`Create risk case failed: ${createCaseRes.status}`);
      const createCaseJson = await createCaseRes.json() as any;
      const caseId = createCaseJson.data?.caseId;
      if (!caseId) throw new Error('Risk case id missing');

      const body = {
        caseId,
        decision: 'RECOMMEND_HOLD',
        reasonCode: 'AUTH_SMOKE',
        reviewerId: actorId,
        notes: 'Signed internal route smoke',
        correlationId: `auth-review-corr-${randomUUID()}`,
        idempotencyKey: `auth-review-idem-${randomUUID()}`,
      };

      const adminReviewRes = await fetch(`${baseUrl}/risk/case/review`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ ...body, reviewerId: 'admin-1' }),
      });
      if (adminReviewRes.status !== 403) {
        throw new Error(`Admin owner-domain review should be forbidden, got ${adminReviewRes.status}`);
      }

      const unsignedRes = await fetch(`${baseUrl}/risk/case/review`, {
        method: 'POST',
        headers: unsignedInternalHeaders,
        body: JSON.stringify({ ...body, idempotencyKey: `auth-unsigned-${randomUUID()}` }),
      });
      if (unsignedRes.status !== 403) {
        throw new Error(`Unsigned internal service review should be forbidden, got ${unsignedRes.status}`);
      }

      const wrongAudienceRes = await fetch(`${baseUrl}/risk/case/review`, {
        method: 'POST',
        headers: wrongAudienceHeaders,
        body: JSON.stringify({ ...body, idempotencyKey: `auth-wrong-aud-${randomUUID()}` }),
      });
      if (wrongAudienceRes.status !== 403) {
        throw new Error(`Wrong-audience internal service review should be forbidden, got ${wrongAudienceRes.status}`);
      }

      const signedRes = await fetch(`${baseUrl}/risk/case/review`, {
        method: 'POST',
        headers: signedInternalHeaders,
        body: JSON.stringify({ ...body, idempotencyKey: `auth-signed-${randomUUID()}` }),
      });
      if (!signedRes.ok) throw new Error(`Signed internal service review failed: ${signedRes.status}`);
      const signedJson = await signedRes.json() as any;
      if (signedJson.data?.routeClassification !== 'owner-domain internal route') {
        throw new Error('Signed internal review missing owner-domain route classification');
      }
      if (signedJson.data?.enforcementExecuted !== false || signedJson.data?.payoutBlockedTruth !== false) {
        throw new Error('Signed internal review must not execute enforcement or payout truth');
      }

      return {
        result: 'PASS',
        message: 'Signed internal service auth, route audience, admin denial, and non-enforcement boundaries passed.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    }
  },
};
