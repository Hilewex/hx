import * as assert from 'assert';
import { issueDevAuthToken } from '../auth-utils';

const suffix = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function headers(actorId: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${issueDevAuthToken(actorId, 'SUPPLIER')}`
  };
}

function validPayload(idempotencyKey = `supplier-idemp-${suffix()}`) {
  const supplierId = `supplier-${suffix()}`;
  return {
    actorId: supplierId,
    actorRole: 'SUPPLIER',
    supplierId,
    ownerId: supplierId,
    scopeId: supplierId,
    actionType: 'REQUEST_STOCK_UPDATE',
    targetType: 'STOCK_ITEM',
    targetId: `stock-item-${suffix()}`,
    productId: `supplier-product-${suffix()}`,
    poolProductId: `pool-product-${suffix()}`,
    reasonCode: 'SUPPLIER_STOCK_RECONCILIATION',
    correlationId: `corr-${suffix()}`,
    idempotencyKey,
    requestedAt: new Date().toISOString(),
    permissionCode: 'CAN_REQUEST_STOCK_UPDATE',
    metadata: { surface: 'supplier_panel_foundation' }
  };
}

async function postAction(baseUrl: string, payload: any, actorId = payload.actorId) {
  return fetch(`${baseUrl}/supplier/protected-action/validate`, {
    method: 'POST',
    headers: headers(actorId),
    body: JSON.stringify(payload)
  });
}

function assertNoTruthMutation(evidence: any) {
  assert.strictEqual(evidence.supplierDirectWrite, false);
  assert.strictEqual(evidence.ownerTruthMutatedBySupplier, false);
  assert.strictEqual(evidence.productTruthMutated, false);
  assert.strictEqual(evidence.platformSalePriceTruthMutated, false);
  assert.strictEqual(evidence.creatorMarginTruthMutated, false);
  assert.strictEqual(evidence.stockTruthDirectlyMutated, false);
  assert.strictEqual(evidence.basePriceTruthDirectlyMutated, false);
  assert.strictEqual(evidence.financeTruthMutated, false);
  assert.strictEqual(evidence.payoutTruthMutated, false);
  assert.strictEqual(evidence.settlementTruthMutated, false);
  assert.strictEqual(evidence.customerPiiExposed, false);
  assert.strictEqual(evidence.bffTruthMutated, false);
  assert.strictEqual(evidence.uiTruthMutated, false);
  assert.strictEqual(evidence.businessTruthMutated, false);
}

async function testValidSupplierProtectedAction(baseUrl: string) {
  const payload = validPayload();
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 200, `Expected valid supplier action status 200, got ${response.status}`);
  const data = await response.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.evidence.supplierScopeChecked, true);
  assert.strictEqual(data.evidence.ownerScopeChecked, true);
  assert.strictEqual(data.evidence.auditEvidenceRequired, true);
  assert.strictEqual(data.evidence.reasonCodeRequired, true);
  assert.strictEqual(data.evidence.permissionChecked, true);
  assert.strictEqual(data.evidence.actorSpoofingBlocked, true);
  assert.strictEqual(data.evidence.productId, payload.productId);
  assert.strictEqual(data.evidence.poolProductId, payload.poolProductId);
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

async function testMissingSupplierId(baseUrl: string) {
  const payload = validPayload();
  delete (payload as any).supplierId;
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Missing supplierId');
  assertNoTruthMutation(data.evidence);
}

async function testActorSpoofing(baseUrl: string) {
  const payload = validPayload();
  payload.actorId = 'spoofed-supplier';
  const response = await postAction(baseUrl, payload, payload.supplierId);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Actor spoofing blocked');
  assert.strictEqual(data.evidence.actorSpoofingBlocked, true);
  assertNoTruthMutation(data.evidence);
}

async function testCrossSupplierAction(baseUrl: string) {
  const payload = validPayload();
  payload.scopeId = `other-supplier-${suffix()}`;
  const response = await postAction(baseUrl, payload);
  assert.strictEqual(response.status, 403);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Supplier scope mismatch');
  assert.strictEqual(data.evidence.supplierScopeChecked, true);
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

export const supplierScopeProductIntakeStockPriceGuardSmoke = {
  name: 'Supplier Scope / Product Intake / Stock / Price Guard',
  run: async (baseUrl: string) => {
    try {
      const valid = await testValidSupplierProtectedAction(baseUrl);
      await testMissingReasonCode(baseUrl);
      await testMissingSupplierId(baseUrl);
      await testActorSpoofing(baseUrl);
      await testCrossSupplierAction(baseUrl);
      await testDuplicateIdempotencyKey(baseUrl, valid);
      return { result: 'PASS' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};
