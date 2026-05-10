import * as assert from 'assert';

async function testValidAdminProtectedAction(baseUrl: string) {
  const payload = {
    actorId: 'admin-123',
    actorRole: 'ADMIN',
    actionType: 'MODERATION_REVIEW_REQUEST',
    targetType: 'PRODUCT',
    targetId: 'prod-123',
    reasonCode: 'POLICY_VIOLATION',
    correlationId: 'corr-123',
    idempotencyKey: 'idemp-' + Date.now()
  };

  const response = await fetch(`${baseUrl}/admin/protected-action/validate`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'x-actor-id': 'admin-123',
      'x-actor-role': 'ADMIN'
    }
  });

  assert.strictEqual(response.status, 200, `Expected status 200, got ${response.status}`);
  
  const data = await response.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.evidence.adminDirectWrite, false, 'adminDirectWrite should be false');
  assert.strictEqual(data.evidence.ownerCommandRequired, true, 'ownerCommandRequired should be true');
  assert.strictEqual(data.evidence.bffTruthMutated, false, 'bffTruthMutated should be false');
  assert.strictEqual(data.evidence.uiTruthMutated, false, 'uiTruthMutated should be false');
  assert.strictEqual(data.evidence.auditEvidenceRequired, true, 'auditEvidenceRequired should be true');
  return payload.idempotencyKey;
}

async function testMissingReasonCode(baseUrl: string) {
  const payload = {
    actorId: 'admin-123',
    actorRole: 'ADMIN',
    actionType: 'MODERATION_REVIEW_REQUEST',
    targetType: 'PRODUCT',
    targetId: 'prod-123',
    // missing reasonCode
    correlationId: 'corr-124',
    idempotencyKey: 'idemp-' + Date.now()
  };

  const response = await fetch(`${baseUrl}/admin/protected-action/validate`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'x-actor-id': 'admin-123',
      'x-actor-role': 'ADMIN'
    }
  });

  assert.strictEqual(response.status, 403, `Expected status 403 for missing reasonCode, got ${response.status}`);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Missing reasonCode');
}

async function testInvalidPermission(baseUrl: string) {
  const payload = {
    actorId: 'user-123',
    actorRole: 'CUSTOMER', // Invalid role
    actionType: 'MODERATION_REVIEW_REQUEST',
    targetType: 'PRODUCT',
    targetId: 'prod-123',
    reasonCode: 'POLICY_VIOLATION',
    correlationId: 'corr-125',
    idempotencyKey: 'idemp-' + Date.now()
  };

  const response = await fetch(`${baseUrl}/admin/protected-action/validate`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'x-actor-id': 'user-123',
      'x-actor-role': 'CUSTOMER'
    }
  });

  assert.strictEqual(response.status, 403, `Expected status 403 for invalid permission, got ${response.status}`);
  const data = await response.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Insufficient permissions');
}

async function testDuplicateIdempotencyKey(baseUrl: string, key: string) {
  const payload = {
    actorId: 'admin-123',
    actorRole: 'ADMIN',
    actionType: 'MODERATION_REVIEW_REQUEST',
    targetType: 'PRODUCT',
    targetId: 'prod-123',
    reasonCode: 'POLICY_VIOLATION',
    correlationId: 'corr-126',
    idempotencyKey: key
  };

  const response = await fetch(`${baseUrl}/admin/protected-action/validate`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'x-actor-id': 'admin-123',
      'x-actor-role': 'ADMIN'
    }
  });

  assert.strictEqual(response.status, 403, `Expected status 403 for duplicate key, got ${response.status}`);
  const data = await response.json();
  console.log('DUPLICATE KEY RESPONSE DATA:', JSON.stringify(data, null, 2));
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Duplicate idempotency key');
  assert.strictEqual(data.evidence.reasonCode, 'POLICY_VIOLATION');
}

export const adminDirectWriteOwnerCommandGuardSmoke = {
  name: 'Admin Direct Write / Owner Command Guard',
  run: async (baseUrl: string) => {
    try {
      const usedKey = await testValidAdminProtectedAction(baseUrl);
      await testMissingReasonCode(baseUrl);
      await testInvalidPermission(baseUrl);
      await testDuplicateIdempotencyKey(baseUrl, usedKey);
      return { result: 'PASS' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};
