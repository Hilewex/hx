import * as assert from 'assert';
import {
  buildPanelProtectedActionAuditEvidence,
  validatePanelMakerCheckerDecision
} from '@hx/contracts';
import { issueDevAuthToken } from '../auth-utils';

const suffix = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function authHeaders(actorId: string, role: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${issueDevAuthToken(actorId, role)}`
  };
}

function assertCommonPanelEvidence(evidence: any) {
  for (const field of ['actorId', 'actionType', 'targetType', 'targetId', 'reasonCode', 'correlationId', 'idempotencyKey', 'decision']) {
    assert.ok(evidence[field], `Missing evidence field ${field}`);
  }
  assert.strictEqual(evidence.auditEvidenceRequired, true);
  assert.strictEqual(evidence.reasonCodeRequired, true);
  assert.strictEqual(evidence.permissionChecked, true);
  assert.strictEqual(evidence.bffTruthMutated, false);
  assert.strictEqual(evidence.uiTruthMutated, false);
  assert.strictEqual(evidence.businessTruthMutated, false);
  assert.ok('ownerDomainHandoff' in evidence);
}

function assertPanelAuditFoundation(evidence: any, actorRole: string) {
  const panelEvidence = buildPanelProtectedActionAuditEvidence({
    actorId: evidence.actorId,
    actorRole,
    actionType: evidence.actionType,
    targetType: evidence.targetType,
    targetId: evidence.targetId,
    reasonCode: evidence.reasonCode,
    correlationId: evidence.correlationId,
    idempotencyKey: evidence.idempotencyKey,
    requestedAt: new Date().toISOString(),
    decision: evidence.decision,
    ownerDomainHandoff: evidence.ownerDomainHandoff,
    permissionChecked: evidence.permissionChecked
  });

  assert.strictEqual(panelEvidence.auditRequired, true);
  assert.strictEqual(panelEvidence.auditEvidenceRequired, true);
  assert.strictEqual(panelEvidence.reasonCodeRequired, true);
  assert.strictEqual(panelEvidence.permissionChecked, true);
  assert.strictEqual(panelEvidence.bffTruthMutated, false);
  assert.strictEqual(panelEvidence.uiTruthMutated, false);
  assert.strictEqual(panelEvidence.businessTruthMutated, false);
  assert.strictEqual(panelEvidence.ownerTruthMutatedByPanel, false);
}

async function postJson(baseUrl: string, path: string, payload: any, actorId: string, role: string) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: authHeaders(actorId, role),
    body: JSON.stringify(payload)
  });
}

function adminPayload(idempotencyKey = `panel-admin-${suffix()}`) {
  return {
    actorId: 'panel-admin-1',
    actorRole: 'ADMIN',
    actionType: 'PAYOUT_HOLD_REQUEST',
    targetType: 'PAYOUT',
    targetId: `payout-${suffix()}`,
    reasonCode: 'HIGH_RISK_PAYOUT_REVIEW',
    correlationId: `corr-${suffix()}`,
    idempotencyKey,
    requestedAt: new Date().toISOString(),
    scopeId: 'FINANCE_DOMAIN',
    ownerId: 'FINANCE_DOMAIN'
  };
}

function creatorPayload() {
  const creatorId = `creator-${suffix()}`;
  const storefrontId = `storefront-${creatorId}`;
  return {
    actorId: creatorId,
    actorRole: 'CREATOR',
    creatorId,
    storefrontId,
    ownerId: creatorId,
    scopeId: storefrontId,
    actionType: 'REQUEST_STORE_CONTENT_REVIEW',
    targetType: 'STORE_CONTENT',
    targetId: `store-content-${suffix()}`,
    reasonCode: 'CREATOR_CONTENT_REVIEW',
    correlationId: `corr-${suffix()}`,
    idempotencyKey: `panel-creator-${suffix()}`,
    requestedAt: new Date().toISOString(),
    permissionCode: 'CAN_REQUEST_STORE_CONTENT_REVIEW'
  };
}

function supplierPayload() {
  const supplierId = `supplier-${suffix()}`;
  return {
    actorId: supplierId,
    actorRole: 'SUPPLIER',
    supplierId,
    ownerId: supplierId,
    scopeId: supplierId,
    actionType: 'REQUEST_PRODUCT_INTAKE_REVIEW',
    targetType: 'SUPPLIER_PRODUCT',
    targetId: `supplier-product-${suffix()}`,
    productId: `product-${suffix()}`,
    poolProductId: `pool-${suffix()}`,
    reasonCode: 'SUPPLIER_PRODUCT_REVIEW',
    correlationId: `corr-${suffix()}`,
    idempotencyKey: `panel-supplier-${suffix()}`,
    requestedAt: new Date().toISOString(),
    permissionCode: 'CAN_REQUEST_PRODUCT_INTAKE_REVIEW'
  };
}

function supportPayload(idempotencyKey = `panel-support-${suffix()}`) {
  const actorId = `support-${suffix()}`;
  const orderId = `order-${suffix()}`;
  return {
    actorId,
    actorRole: 'OPERATOR',
    supportRole: 'SUPPORT_L2',
    supportTeam: 'ORDER_SUPPORT',
    actionType: 'REQUEST_ESCALATION_REVIEW',
    targetType: 'ESCALATION',
    targetId: orderId,
    customerId: `customer-${suffix()}`,
    orderId,
    ticketId: `ticket-${suffix()}`,
    reasonCode: 'SUPPORT_ESCALATION_REVIEW',
    correlationId: `corr-${suffix()}`,
    idempotencyKey,
    requestedAt: new Date().toISOString(),
    scopeId: orderId,
    ownerId: orderId,
    permissionCode: 'CAN_REQUEST_ESCALATION_REVIEW'
  };
}

async function expectFailure(baseUrl: string, payload: any, missingField: string, expectedError: string) {
  const broken = { ...payload };
  delete broken[missingField];
  const response = await postJson(baseUrl, '/admin/protected-action/validate', broken, payload.actorId, 'ADMIN');
  assert.strictEqual(response.status, 403, `Expected missing ${missingField} to fail`);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, expectedError);
  assert.strictEqual(data.evidence.bffTruthMutated, false);
  assert.strictEqual(data.evidence.uiTruthMutated, false);
  assert.strictEqual(data.evidence.businessTruthMutated, false);
}

async function validateDomainEvidence(baseUrl: string) {
  const admin = adminPayload();
  const adminResponse = await postJson(baseUrl, '/admin/protected-action/validate', admin, admin.actorId, 'ADMIN');
  assert.strictEqual(adminResponse.status, 200);
  const adminData = await adminResponse.json();
  assertCommonPanelEvidence(adminData.evidence);
  assert.strictEqual(adminData.evidence.adminDirectWrite, false);
  assert.strictEqual(adminData.evidence.ownerTruthMutatedByAdmin, false);
  assertPanelAuditFoundation(adminData.evidence, 'ADMIN');

  const creator = creatorPayload();
  const creatorResponse = await postJson(baseUrl, '/creator/protected-action/validate', creator, creator.actorId, 'CREATOR');
  assert.strictEqual(creatorResponse.status, 200);
  const creatorData = await creatorResponse.json();
  assertCommonPanelEvidence(creatorData.evidence);
  assert.strictEqual(creatorData.evidence.creatorDirectWrite, false);
  assert.strictEqual(creatorData.evidence.ownerTruthMutatedByCreator, false);
  assertPanelAuditFoundation(creatorData.evidence, 'CREATOR');

  const supplier = supplierPayload();
  const supplierResponse = await postJson(baseUrl, '/supplier/protected-action/validate', supplier, supplier.actorId, 'SUPPLIER');
  assert.strictEqual(supplierResponse.status, 200);
  const supplierData = await supplierResponse.json();
  assertCommonPanelEvidence(supplierData.evidence);
  assert.strictEqual(supplierData.evidence.supplierDirectWrite, false);
  assert.strictEqual(supplierData.evidence.ownerTruthMutatedBySupplier, false);
  assertPanelAuditFoundation(supplierData.evidence, 'SUPPLIER');

  const support = supportPayload();
  const supportResponse = await postJson(baseUrl, '/support/protected-action/validate', support, support.actorId, 'OPERATOR');
  assert.strictEqual(supportResponse.status, 200);
  const supportData = await supportResponse.json();
  assertCommonPanelEvidence(supportData.evidence);
  assert.strictEqual(supportData.evidence.supportDirectWrite, false);
  assert.strictEqual(supportData.evidence.orderTruthMutated, false);
  assert.strictEqual(supportData.evidence.customerTruthMutated, false);
  assertPanelAuditFoundation(supportData.evidence, 'OPERATOR');
}

function validateMakerCheckerFoundation() {
  const base = {
    actionType: 'PAYOUT_HOLD_RELEASE_APPROVAL' as const,
    targetType: 'PAYOUT',
    targetId: `payout-${suffix()}`,
    makerActorId: `maker-${suffix()}`,
    checkerActorId: `checker-${suffix()}`,
    checkerActorRole: 'ADMIN',
    reasonCode: 'PAYOUT_RELEASE_REVIEW',
    correlationId: `corr-${suffix()}`,
    idempotencyKey: `panel-mc-${suffix()}`,
    requestedAt: new Date().toISOString(),
    ownerDomainHandoff: 'PAYOUT_DOMAIN'
  };

  const sameActor = validatePanelMakerCheckerDecision({
    ...base,
    checkerActorId: base.makerActorId,
    idempotencyKey: `panel-mc-same-${suffix()}`
  });
  assert.strictEqual(sameActor.success, false);
  assert.strictEqual(sameActor.error, 'MAKER_CHECKER_SAME_ACTOR_FORBIDDEN');
  assert.strictEqual(sameActor.sameActorBlocked, true);
  assert.strictEqual(sameActor.ownerTruthMutatedByPanel, false);

  const accepted = validatePanelMakerCheckerDecision(base);
  assert.strictEqual(accepted.success, true);
  assert.strictEqual(accepted.decision, 'APPROVED_FOR_OWNER_HANDOFF');
  assert.strictEqual(accepted.resultStatus, 'PENDING_OWNER_DOMAIN');
  assert.strictEqual(accepted.permissionChecked, true);
  assert.strictEqual(accepted.auditEvidenceRequired, true);
  assert.strictEqual(accepted.reasonCodeRequired, true);
  assert.strictEqual(accepted.bffTruthMutated, false);
  assert.strictEqual(accepted.uiTruthMutated, false);
  assert.strictEqual(accepted.businessTruthMutated, false);
  assert.strictEqual(accepted.ownerTruthMutatedByPanel, false);

  const duplicate = validatePanelMakerCheckerDecision(base);
  assert.strictEqual(duplicate.success, false);
  assert.strictEqual(duplicate.decision, 'DUPLICATE_IDEMPOTENCY_KEY');
  assert.strictEqual(duplicate.reasonCode, 'ALREADY_PROCESSED');
}

export const panelAuditEvidenceMakerCheckerReadinessSmoke = {
  name: 'Panel Audit / Evidence / Maker-Checker Readiness',
  run: async (baseUrl: string) => {
    try {
      const validAudit = buildPanelProtectedActionAuditEvidence({
        actorId: 'panel-auditor-1',
        actorRole: 'ADMIN',
        actionType: 'HIGH_RISK_ADMIN_ACTION_APPROVAL',
        targetType: 'ADMIN_ACTION',
        targetId: `target-${suffix()}`,
        reasonCode: 'PANEL_AUDIT_FOUNDATION',
        correlationId: `corr-${suffix()}`,
        idempotencyKey: `audit-${suffix()}`,
        requestedAt: new Date().toISOString(),
        decision: 'PENDING_OWNER_DOMAIN',
        ownerDomainHandoff: 'ADMIN_DOMAIN',
        permissionChecked: true
      });
      assert.strictEqual(validAudit.auditRequired, true);
      assert.strictEqual(validAudit.ownerTruthMutatedByPanel, false);

      const admin = adminPayload();
      await expectFailure(baseUrl, admin, 'reasonCode', 'Missing reasonCode');
      await expectFailure(baseUrl, admin, 'correlationId', 'Missing correlationId');
      await expectFailure(baseUrl, admin, 'idempotencyKey', 'Missing idempotencyKey');

      await validateDomainEvidence(baseUrl);
      validateMakerCheckerFoundation();

      return { result: 'PASS' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};
