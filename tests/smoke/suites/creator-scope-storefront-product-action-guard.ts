import * as assert from 'assert';
import { issueDevAuthToken } from '../auth-utils';

const suffix = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function headers(actorId: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${issueDevAuthToken(actorId, 'CREATOR')}`
  };
}

function validPayload(idempotencyKey = `creator-idemp-${suffix()}`) {
  const creatorId = `creator-${suffix()}`;
  const storefrontId = `storefront-${creatorId}`;
  return {
    actorId: creatorId,
    actorRole: 'CREATOR',
    creatorId,
    storefrontId,
    ownerId: creatorId,
    scopeId: storefrontId,
    actionType: 'REORDER_STOREFRONT_PRODUCT_REQUEST',
    targetType: 'STOREFRONT_PRODUCT',
    targetId: `storefront-product-${suffix()}`,
    reasonCode: 'CREATOR_STORE_MERCHANDISING',
    correlationId: `corr-${suffix()}`,
    idempotencyKey,
    requestedAt: new Date().toISOString(),
    permissionCode: 'CAN_REORDER_STOREFRONT_PRODUCTS',
    metadata: { surface: 'creator_panel_foundation' }
  };
}

async function postAction(baseUrl: string, payload: any, actorId = payload.actorId) {
  return fetch(`${baseUrl}/creator/protected-action/validate`, {
    method: 'POST',
    headers: headers(actorId),
    body: JSON.stringify(payload)
  });
}

function assertNoTruthMutation(evidence: any) {
  assert.strictEqual(evidence.creatorDirectWrite, false);
  assert.strictEqual(evidence.ownerTruthMutatedByCreator, false);
  assert.strictEqual(evidence.productTruthMutated, false);
  assert.strictEqual(evidence.priceTruthMutated, false);
  assert.strictEqual(evidence.stockTruthMutated, false);
  assert.strictEqual(evidence.mediaTruthMutated, false);
  assert.strictEqual(evidence.financeTruthMutated, false);
  assert.strictEqual(evidence.payoutTruthMutated, false);
  assert.strictEqual(evidence.bffTruthMutated, false);
  assert.strictEqual(evidence.uiTruthMutated, false);
  assert.strictEqual(evidence.businessTruthMutated, false);
}

async function testValidCreatorProtectedAction(baseUrl: string) {
  const payload = validPayload();
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 200, `Expected valid creator action status 200, got ${response.status}`);
  const data = await response.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.evidence.storefrontScopeChecked, true);
  assert.strictEqual(data.evidence.ownerScopeChecked, true);
  assert.strictEqual(data.evidence.auditEvidenceRequired, true);
  assert.strictEqual(data.evidence.reasonCodeRequired, true);
  assert.strictEqual(data.evidence.permissionChecked, true);
  assert.strictEqual(data.evidence.actorSpoofingBlocked, true);
  assert.ok(data.evidence.ownerDomainHandoff);
  assertNoTruthMutation(data.evidence);
  return payload;
}

async function testMissingReasonCode(baseUrl: string) {
  const payload = validPayload();
  delete (payload as any).reasonCode;
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Missing reasonCode');
  assertNoTruthMutation(data.evidence);
}

async function testMissingStorefrontId(baseUrl: string) {
  const payload = validPayload();
  delete (payload as any).storefrontId;
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Missing storefrontId');
  assertNoTruthMutation(data.evidence);
}

async function testActorSpoofing(baseUrl: string) {
  const payload = validPayload();
  payload.actorId = 'spoofed-creator';
  const response = await postAction(baseUrl, payload, payload.creatorId);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Actor spoofing blocked');
  assert.strictEqual(data.evidence.actorSpoofingBlocked, true);
  assertNoTruthMutation(data.evidence);
}

async function testCrossStorefront(baseUrl: string) {
  const payload = validPayload();
  payload.scopeId = `other-storefront-${suffix()}`;
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Storefront scope mismatch');
  assert.strictEqual(data.evidence.storefrontScopeChecked, true);
  assertNoTruthMutation(data.evidence);
}

async function testDuplicateIdempotencyKey(baseUrl: string, payload: any) {
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Duplicate idempotency key');
  assert.strictEqual(data.evidence.decision, 'DUPLICATE_IDEMPOTENCY_KEY');
  assert.strictEqual(data.evidence.reasonCode, 'ALREADY_PROCESSED');
  assertNoTruthMutation(data.evidence);
}

export const creatorScopeStorefrontProductActionGuardSmoke = {
  name: 'Creator Scope / Storefront / Product Action Guard',
  run: async (baseUrl: string) => {
    try {
      const valid = await testValidCreatorProtectedAction(baseUrl);
      await testMissingReasonCode(baseUrl);
      await testMissingStorefrontId(baseUrl);
      await testActorSpoofing(baseUrl);
      await testCrossStorefront(baseUrl);
      await testDuplicateIdempotencyKey(baseUrl, valid);
      return { result: 'PASS' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};
