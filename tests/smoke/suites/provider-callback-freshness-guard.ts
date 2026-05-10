import { strict as assert } from 'node:assert';
import { createHmac, randomUUID } from 'node:crypto';
import {
  closePool,
  PostgresProviderCallbackEventRepository,
} from '../../../packages/persistence/dist';
import type { SmokeSuite } from './provider-callback-foundation';

const suiteName = 'Provider Callback Timestamp Nonce Freshness Guard Foundation';
const testProviderName = 'signature-test-provider';
const testSecret = 'test-callback-secret';

function signPayload(body: Record<string, unknown>): string {
  return createHmac('sha256', testSecret)
    .update(JSON.stringify(body))
    .digest('hex');
}

async function postCallback(
  baseUrl: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return fetch(`${baseUrl}/provider-callback/payment/${testProviderName}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': `req_${randomUUID()}`,
      'x-correlation-id': `corr_${randomUUID()}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function signedHeaders(
  body: Record<string, unknown>,
  timestamp?: string
): Record<string, string> {
  return {
    'x-provider-signature-algorithm': 'hmac_sha256',
    'x-provider-signature': signPayload(body),
    ...(timestamp ? { 'x-provider-timestamp': timestamp } : {}),
    'x-provider-nonce': `nonce_${randomUUID()}`,
  };
}

function assertBoundaryFlagsFalse(boundary: {
  providerTruth: boolean;
  businessTruthMutated: boolean;
  ownerStateMutated: boolean;
  eventTruthMutated: boolean;
  outboxDeliveryGuaranteed: boolean;
}) {
  assert.equal(boundary.providerTruth, false);
  assert.equal(boundary.businessTruthMutated, false);
  assert.equal(boundary.ownerStateMutated, false);
  assert.equal(boundary.eventTruthMutated, false);
  assert.equal(boundary.outboxDeliveryGuaranteed, false);
}

async function assertFreshnessRejected(
  repository: PostgresProviderCallbackEventRepository,
  id: string
) {
  const persisted = await repository.getProviderCallbackEventById(id);
  assert.ok(persisted, 'Freshness rejected callback should be persisted');
  assert.equal(persisted?.processingStatus, 'rejected');
  assert.equal(persisted?.replayStatus, 'replay_detected');
  assert.equal(persisted?.replayDetected, true);
  assertBoundaryFlagsFalse(persisted!.boundary);
  return persisted;
}

export const providerCallbackFreshnessGuardSmoke: SmokeSuite = {
  name: suiteName,
  run: async (baseUrl: string) => {
    try {
      console.log(`[+] Running smoke suite: ${suiteName}`);

      assert.equal(
        process.env.PERSISTENCE_MODE,
        'postgres',
        'PERSISTENCE_MODE=postgres and DATABASE_URL required'
      );
      assert.ok(
        process.env.DATABASE_URL,
        'PERSISTENCE_MODE=postgres and DATABASE_URL required'
      );

      const health = await fetch(`${baseUrl}/health`);
      assert.equal(health.status, 200, 'BFF /health should return 200');
      console.log('  [+] OK: BFF health endpoint is reachable');

      const repository = new PostgresProviderCallbackEventRepository();

      const validPayload = {
        callbackType: 'payment.freshness.valid-current',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
        amount: 1000,
      };
      const validResponse = await postCallback(
        baseUrl,
        validPayload,
        signedHeaders(validPayload, new Date().toISOString())
      );
      assert.equal(validResponse.status, 202);
      const validBody = await validResponse.json();
      assert.equal(validBody.data.processingStatus, 'received');
      assert.equal(validBody.data.verificationStatus, 'verified');
      assert.equal(validBody.data.replayStatus, 'first_seen');
      assert.equal(validBody.data.replayDetected, false);
      assert.equal(
        Object.prototype.hasOwnProperty.call(validBody.data, 'rawPayload'),
        false,
        'Response must not expose rawPayload'
      );
      const validPersisted =
        await repository.getProviderCallbackEventById(validBody.data.id);
      assert.equal(validPersisted?.processingStatus, 'received');
      assert.equal(validPersisted?.replayStatus, 'first_seen');
      assert.equal(validPersisted?.replayDetected, false);
      assertBoundaryFlagsFalse(validPersisted!.boundary);
      console.log('  [+] OK: Current timestamp keeps first_seen behavior');

      const missingTimestampPayload = {
        callbackType: 'payment.freshness.missing-timestamp',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const missingTimestampResponse = await postCallback(
        baseUrl,
        missingTimestampPayload,
        signedHeaders(missingTimestampPayload)
      );
      assert.equal(missingTimestampResponse.status, 202);
      const missingTimestampBody = await missingTimestampResponse.json();
      assert.equal(missingTimestampBody.data.processingStatus, 'received');
      assert.equal(missingTimestampBody.data.replayStatus, 'first_seen');
      assert.equal(missingTimestampBody.data.replayDetected, false);
      const missingTimestampPersisted =
        await repository.getProviderCallbackEventById(missingTimestampBody.data.id);
      assert.equal(missingTimestampPersisted?.processingStatus, 'received');
      assert.equal(missingTimestampPersisted?.replayStatus, 'first_seen');
      assert.equal(missingTimestampPersisted?.replayDetected, false);
      assertBoundaryFlagsFalse(missingTimestampPersisted!.boundary);
      console.log('  [+] OK: Missing timestamp does not block ingestion');

      const oldTimestampPayload = {
        callbackType: 'payment.freshness.old-timestamp',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const oldTimestampResponse = await postCallback(
        baseUrl,
        oldTimestampPayload,
        signedHeaders(oldTimestampPayload, oldTimestamp)
      );
      assert.equal(oldTimestampResponse.status, 202);
      const oldTimestampBody = await oldTimestampResponse.json();
      assert.equal(oldTimestampBody.data.processingStatus, 'rejected');
      assert.equal(oldTimestampBody.data.replayStatus, 'replay_detected');
      assert.equal(oldTimestampBody.data.replayDetected, true);
      await assertFreshnessRejected(repository, oldTimestampBody.data.id);
      console.log('  [+] OK: Old timestamp is rejected as replay_detected');

      const futureTimestampPayload = {
        callbackType: 'payment.freshness.future-timestamp',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const futureTimestamp = new Date(Date.now() + 2 * 60 * 1000).toISOString();
      const futureTimestampResponse = await postCallback(
        baseUrl,
        futureTimestampPayload,
        signedHeaders(futureTimestampPayload, futureTimestamp)
      );
      assert.equal(futureTimestampResponse.status, 202);
      const futureTimestampBody = await futureTimestampResponse.json();
      assert.equal(futureTimestampBody.data.processingStatus, 'rejected');
      assert.equal(futureTimestampBody.data.replayStatus, 'replay_detected');
      assert.equal(futureTimestampBody.data.replayDetected, true);
      await assertFreshnessRejected(repository, futureTimestampBody.data.id);
      console.log('  [+] OK: Future timestamp outside tolerance is rejected');

      const invalidTimestampPayload = {
        callbackType: 'payment.freshness.invalid-timestamp',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const invalidTimestampResponse = await postCallback(
        baseUrl,
        invalidTimestampPayload,
        signedHeaders(invalidTimestampPayload, 'not-a-date')
      );
      assert.equal(invalidTimestampResponse.status, 202);
      const invalidTimestampBody = await invalidTimestampResponse.json();
      assert.equal(invalidTimestampBody.data.processingStatus, 'rejected');
      assert.equal(invalidTimestampBody.data.replayStatus, 'replay_detected');
      assert.equal(invalidTimestampBody.data.replayDetected, true);
      await assertFreshnessRejected(repository, invalidTimestampBody.data.id);
      console.log('  [+] OK: Invalid timestamp is rejected as replay_detected');

      const duplicateOldTimestampPayload = {
        ...validPayload,
        callbackType: 'payment.freshness.duplicate-old-overwrite-attempt',
        amount: 9999,
      };
      const duplicateOldTimestampResponse = await postCallback(
        baseUrl,
        duplicateOldTimestampPayload,
        signedHeaders(duplicateOldTimestampPayload, oldTimestamp)
      );
      assert.equal(duplicateOldTimestampResponse.status, 202);
      const duplicateOldTimestampBody = await duplicateOldTimestampResponse.json();
      assert.equal(duplicateOldTimestampBody.data.id, validBody.data.id);
      assert.equal(duplicateOldTimestampBody.data.processingStatus, 'duplicate');
      assert.equal(
        duplicateOldTimestampBody.data.originalProcessingStatus,
        'received'
      );
      assert.equal(duplicateOldTimestampBody.data.replayStatus, 'duplicate_event');
      assert.equal(duplicateOldTimestampBody.data.replayDetected, true);
      const afterDuplicateOldTimestamp =
        await repository.getProviderCallbackEventById(validBody.data.id);
      assert.equal(
        afterDuplicateOldTimestamp?.callbackType,
        'payment.freshness.valid-current'
      );
      assert.deepEqual(afterDuplicateOldTimestamp?.rawPayload, validPayload);
      assert.equal(afterDuplicateOldTimestamp?.processingStatus, 'received');
      assert.equal(afterDuplicateOldTimestamp?.replayStatus, 'first_seen');
      assert.equal(afterDuplicateOldTimestamp?.replayDetected, false);
      assertBoundaryFlagsFalse(afterDuplicateOldTimestamp!.boundary);
      console.log('  [+] OK: Duplicate old timestamp does not overwrite original');

      const conflictPayloadA = {
        callbackType: 'payment.freshness.conflict-a',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const conflictPayloadB = {
        callbackType: 'payment.freshness.conflict-b',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const conflictResponseA = await postCallback(
        baseUrl,
        conflictPayloadA,
        signedHeaders(conflictPayloadA, new Date().toISOString())
      );
      const conflictResponseB = await postCallback(
        baseUrl,
        conflictPayloadB,
        signedHeaders(conflictPayloadB, new Date().toISOString())
      );
      assert.equal(conflictResponseA.status, 202);
      assert.equal(conflictResponseB.status, 202);
      const conflictBodyA = await conflictResponseA.json();
      const conflictBodyB = await conflictResponseB.json();

      const identityConflictPayload = {
        callbackType: 'payment.freshness.identity-conflict',
        providerEventId: conflictPayloadA.providerEventId,
        idempotencyKey: conflictPayloadB.idempotencyKey,
      };
      const identityConflictResponse = await postCallback(
        baseUrl,
        identityConflictPayload,
        signedHeaders(identityConflictPayload, new Date().toISOString())
      );
      assert.equal(identityConflictResponse.status, 202);
      const identityConflictBody = await identityConflictResponse.json();
      assert.equal(identityConflictBody.data.id, conflictBodyA.data.id);
      assert.equal(identityConflictBody.data.processingStatus, 'rejected');
      assert.equal(identityConflictBody.data.replayStatus, 'replay_detected');
      assert.equal(identityConflictBody.data.replayDetected, true);
      assert.equal(
        identityConflictBody.data.errorCode,
        'CALLBACK_IDENTITY_CONFLICT'
      );
      const afterConflictA =
        await repository.getProviderCallbackEventById(conflictBodyA.data.id);
      const afterConflictB =
        await repository.getProviderCallbackEventById(conflictBodyB.data.id);
      assert.deepEqual(afterConflictA?.rawPayload, conflictPayloadA);
      assert.deepEqual(afterConflictB?.rawPayload, conflictPayloadB);
      assertBoundaryFlagsFalse(afterConflictA!.boundary);
      assertBoundaryFlagsFalse(afterConflictB!.boundary);
      console.log('  [+] OK: Identity conflict behavior is preserved');

      return { result: 'PASS', message: `SUCCESS: ${suiteName}` };
    } catch (error) {
      console.error(error);
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
