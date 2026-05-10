import * as assert from 'assert';
import { issueDevAuthToken } from '../auth-utils';

const suffix = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function headers(actorId: string, role = 'OPERATOR') {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${issueDevAuthToken(actorId, role)}`
  };
}

function validActionPayload(idempotencyKey = `support-idemp-${suffix()}`) {
  const actorId = `support-actor-${suffix()}`;
  const orderId = `order-${suffix()}`;
  return {
    actorId,
    actorRole: 'OPERATOR',
    supportRole: 'SUPPORT_L1',
    supportTeam: 'ORDER_SUPPORT',
    actionType: 'REQUEST_ORDER_OWNER_REVIEW',
    targetType: 'ORDER',
    targetId: orderId,
    customerId: `customer-${suffix()}`,
    orderId,
    ticketId: `ticket-${suffix()}`,
    reasonCode: 'SUPPORT_ORDER_TRIAGE',
    correlationId: `corr-${suffix()}`,
    idempotencyKey,
    requestedAt: new Date().toISOString(),
    scopeId: orderId,
    ownerId: orderId,
    permissionCode: 'CAN_REQUEST_ORDER_OWNER_REVIEW',
    metadata: { surface: 'support_panel_foundation' }
  };
}

function validVisibilityPayload() {
  const actorId = `support-actor-${suffix()}`;
  const orderId = `order-${suffix()}`;
  return {
    actorId,
    actorRole: 'OPERATOR',
    supportRole: 'SUPPORT_L1',
    supportTeam: 'ORDER_SUPPORT',
    visibilityScope: 'ORDER_SUPPORT_CONTEXT',
    targetType: 'ORDER',
    targetId: orderId,
    customerId: `customer-${suffix()}`,
    orderId,
    ticketId: `ticket-${suffix()}`,
    reasonCode: 'SUPPORT_MASKED_VISIBILITY',
    correlationId: `corr-${suffix()}`,
    idempotencyKey: `support-visibility-idemp-${suffix()}`,
    requestedAt: new Date().toISOString(),
    scopeId: orderId,
    permissionCode: 'CAN_VIEW_ORDER_SUPPORT_CONTEXT',
    metadata: { surface: 'support_visibility_foundation' }
  };
}

async function postAction(baseUrl: string, payload: any, actorId = payload.actorId, role = 'OPERATOR') {
  return fetch(`${baseUrl}/support/protected-action/validate`, {
    method: 'POST',
    headers: headers(actorId, role),
    body: JSON.stringify(payload)
  });
}

async function postVisibility(baseUrl: string, payload: any, actorId = payload.actorId, role = 'OPERATOR') {
  return fetch(`${baseUrl}/support/visibility/check`, {
    method: 'POST',
    headers: headers(actorId, role),
    body: JSON.stringify(payload)
  });
}

function assertSupportBoundary(evidence: any) {
  assert.strictEqual(evidence.supportDirectWrite, false);
  assert.strictEqual(evidence.orderTruthMutated, false);
  assert.strictEqual(evidence.refundTruthMutated, false);
  assert.strictEqual(evidence.financeTruthMutated, false);
  assert.strictEqual(evidence.payoutTruthMutated, false);
  assert.strictEqual(evidence.customerTruthMutated, false);
  assert.strictEqual(evidence.customerPiiExposed, false);
  assert.strictEqual(evidence.piiMasked, true);
  assert.strictEqual(evidence.piiMinimized, true);
  assert.strictEqual(evidence.bffTruthMutated, false);
  assert.strictEqual(evidence.uiTruthMutated, false);
  assert.strictEqual(evidence.businessTruthMutated, false);
  assert.strictEqual(evidence.auditEvidenceRequired, true);
  assert.strictEqual(evidence.reasonCodeRequired, true);
}

async function testValidProtectedAction(baseUrl: string) {
  const payload = validActionPayload();
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 200, `Expected valid support action status 200, got ${response.status}`);
  const data = await response.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.evidence.permissionChecked, true);
  assert.strictEqual(data.evidence.visibilityScopeChecked, true);
  assert.strictEqual(data.evidence.roleSpoofingBlocked, true);
  assert.strictEqual(data.evidence.ownerDomainHandoff, 'ORDER_OPERATIONS_DOMAIN');
  assert.strictEqual(data.evidence.permissionCode, 'CAN_REQUEST_ORDER_OWNER_REVIEW');
  assertSupportBoundary(data.evidence);
  return payload;
}

async function testValidVisibility(baseUrl: string) {
  const payload = validVisibilityPayload();
  const response = await postVisibility(baseUrl, payload);
  assert.strictEqual(response.status, 200, `Expected valid support visibility status 200, got ${response.status}`);
  const data = await response.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.evidence.decision, 'ALLOWED_MASKED_VISIBILITY');
  assert.strictEqual(data.evidence.permissionChecked, true);
  assert.strictEqual(data.evidence.visibilityScopeChecked, true);
  assert.strictEqual(data.evidence.piiPolicy, 'MASKED_MINIMIZED_ONLY');
  assert.strictEqual(data.maskedContext.piiPolicy, 'MASKED_MINIMIZED_ONLY');
  assert.ok(!('email' in data.maskedContext));
  assert.ok(!('phone' in data.maskedContext));
  assert.ok(!('address' in data.maskedContext));
  assert.ok(!('payment' in data.maskedContext));
  assertSupportBoundary(data.evidence);
}

async function testMissingReasonCode(baseUrl: string) {
  const payload = validActionPayload();
  delete (payload as any).reasonCode;
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Missing reasonCode');
  assertSupportBoundary(data.evidence);
}

async function testMissingSupportRole(baseUrl: string) {
  const payload = validActionPayload();
  delete (payload as any).supportRole;
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Missing supportRole');
  assertSupportBoundary(data.evidence);
}

async function testRoleSpoofing(baseUrl: string) {
  const payload = validActionPayload();
  payload.actorRole = 'ADMIN';
  const response = await postAction(baseUrl, payload, payload.actorId, 'OPERATOR');
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Role spoofing blocked');
  assert.strictEqual(data.evidence.roleSpoofingBlocked, true);
  assertSupportBoundary(data.evidence);
}

async function testUnauthorizedVisibility(baseUrl: string) {
  const payload = validVisibilityPayload();
  payload.scopeId = `other-order-${suffix()}`;
  const response = await postVisibility(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Unauthorized visibility scope');
  assert.strictEqual(data.evidence.visibilityScopeChecked, true);
  assertSupportBoundary(data.evidence);
}

async function testDuplicateIdempotencyKey(baseUrl: string, payload: any) {
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Duplicate idempotency key');
  assert.strictEqual(data.evidence.decision, 'DUPLICATE_IDEMPOTENCY_KEY');
  assert.strictEqual(data.evidence.reasonCode, 'ALREADY_PROCESSED');
  assertSupportBoundary(data.evidence);
}

export const supportVisibilityOrderAccessPiiGuardSmoke = {
  name: 'Support Visibility / Order Access / PII Guard',
  run: async (baseUrl: string) => {
    try {
      const valid = await testValidProtectedAction(baseUrl);
      await testValidVisibility(baseUrl);
      await testMissingReasonCode(baseUrl);
      await testMissingSupportRole(baseUrl);
      await testRoleSpoofing(baseUrl);
      await testUnauthorizedVisibility(baseUrl);
      await testDuplicateIdempotencyKey(baseUrl, valid);
      return { result: 'PASS' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};
