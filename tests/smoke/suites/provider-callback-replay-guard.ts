import { strict as assert } from 'node:assert';
import { createHmac, randomUUID } from 'node:crypto';
import {
  closePool,
  PostgresProviderCallbackEventRepository,
} from '../../../packages/persistence/dist';
import type { SmokeSuite } from './provider-callback-foundation';

const suiteName = 'Provider Callback Replay Idempotency Guard Foundation';
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

function signatureHeaders(body: Record<string, unknown>): Record<string, string> {
  return {
    'x-provider-signature-algorithm': 'hmac_sha256',
    'x-provider-signature': signPayload(body),
    'x-provider-timestamp': new Date().toISOString(),
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

export const providerCallbackReplayGuardSmoke: SmokeSuite = {
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

      const firstSeenPayload = {
        callbackType: 'payment.replay.first-seen',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
        amount: 1000,
      };
      const firstSeenResponse = await postCallback(baseUrl, firstSeenPayload);
      assert.equal(firstSeenResponse.status, 202);
      const firstSeenBody = await firstSeenResponse.json();
      assert.equal(firstSeenBody.data.processingStatus, 'received');
      assert.equal(firstSeenBody.data.replayStatus, 'first_seen');
      assert.equal(firstSeenBody.data.replayDetected, false);
      assert.equal(
        Object.prototype.hasOwnProperty.call(firstSeenBody.data, 'rawPayload'),
        false,
        'Response must not expose rawPayload'
      );

      const firstSeenPersisted =
        await repository.getProviderCallbackEventById(firstSeenBody.data.id);
      assert.ok(firstSeenPersisted, 'First seen callback should be persisted');
      assert.equal(firstSeenPersisted?.replayStatus, 'first_seen');
      assert.equal(firstSeenPersisted?.replayDetected, false);
      assert.deepEqual(firstSeenPersisted?.rawPayload, firstSeenPayload);
      assertBoundaryFlagsFalse(firstSeenPersisted!.boundary);
      console.log('  [+] OK: First seen callback is marked first_seen');

      const duplicateProviderEventPayload = {
        ...firstSeenPayload,
        idempotencyKey: `idem_${randomUUID()}`,
        callbackType: 'payment.replay.provider-event-overwrite-attempt',
        amount: 9999,
      };
      const duplicateProviderEventResponse =
        await postCallback(baseUrl, duplicateProviderEventPayload);
      assert.equal(duplicateProviderEventResponse.status, 202);
      const duplicateProviderEventBody =
        await duplicateProviderEventResponse.json();
      assert.equal(duplicateProviderEventBody.data.id, firstSeenBody.data.id);
      assert.equal(duplicateProviderEventBody.data.processingStatus, 'duplicate');
      assert.equal(
        duplicateProviderEventBody.data.originalProcessingStatus,
        'received'
      );
      assert.equal(duplicateProviderEventBody.data.replayStatus, 'duplicate_event');
      assert.equal(duplicateProviderEventBody.data.replayDetected, true);

      const afterProviderEventDuplicate =
        await repository.getProviderCallbackEventById(firstSeenBody.data.id);
      assert.equal(
        afterProviderEventDuplicate?.callbackType,
        'payment.replay.first-seen'
      );
      assert.deepEqual(afterProviderEventDuplicate?.rawPayload, firstSeenPayload);
      assertBoundaryFlagsFalse(afterProviderEventDuplicate!.boundary);
      console.log('  [+] OK: Duplicate providerEventId is visible and no-op');

      const duplicateIdempotencyPayload = {
        ...firstSeenPayload,
        providerEventId: `evt_${randomUUID()}`,
        callbackType: 'payment.replay.idempotency-overwrite-attempt',
        amount: 8888,
      };
      const duplicateIdempotencyResponse =
        await postCallback(baseUrl, duplicateIdempotencyPayload);
      assert.equal(duplicateIdempotencyResponse.status, 202);
      const duplicateIdempotencyBody = await duplicateIdempotencyResponse.json();
      assert.equal(duplicateIdempotencyBody.data.id, firstSeenBody.data.id);
      assert.equal(duplicateIdempotencyBody.data.processingStatus, 'duplicate');
      assert.equal(
        duplicateIdempotencyBody.data.originalProcessingStatus,
        'received'
      );
      assert.equal(duplicateIdempotencyBody.data.replayStatus, 'duplicate_event');
      assert.equal(duplicateIdempotencyBody.data.replayDetected, true);

      const afterIdempotencyDuplicate =
        await repository.getProviderCallbackEventById(firstSeenBody.data.id);
      assert.equal(afterIdempotencyDuplicate?.callbackType, 'payment.replay.first-seen');
      assert.deepEqual(afterIdempotencyDuplicate?.rawPayload, firstSeenPayload);
      assertBoundaryFlagsFalse(afterIdempotencyDuplicate!.boundary);
      console.log('  [+] OK: Duplicate idempotencyKey is visible and no-op');

      const invalidFirstSeenPayload = {
        callbackType: 'payment.replay.invalid-first-seen',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
        amount: 2000,
      };
      const invalidFirstSeenResponse =
        await postCallback(baseUrl, invalidFirstSeenPayload, {
          'x-provider-signature-algorithm': 'hmac_sha256',
          'x-provider-signature': '00',
        });
      assert.equal(invalidFirstSeenResponse.status, 202);
      const invalidFirstSeenBody = await invalidFirstSeenResponse.json();
      const invalidFirstSeenPersisted =
        await repository.getProviderCallbackEventById(invalidFirstSeenBody.data.id);
      assert.equal(invalidFirstSeenPersisted?.verificationStatus, 'failed');
      assert.equal(invalidFirstSeenPersisted?.processingStatus, 'rejected');
      assert.equal(invalidFirstSeenPersisted?.replayStatus, 'first_seen');
      assert.equal(invalidFirstSeenPersisted?.replayDetected, false);
      assertBoundaryFlagsFalse(invalidFirstSeenPersisted!.boundary);
      console.log('  [+] OK: Invalid first seen signature is rejected and first_seen');

      const validSignedPayload = {
        callbackType: 'payment.replay.valid-signed-original',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
        amount: 3000,
      };
      const validSignedResponse = await postCallback(
        baseUrl,
        validSignedPayload,
        signatureHeaders(validSignedPayload)
      );
      assert.equal(validSignedResponse.status, 202);
      const validSignedBody = await validSignedResponse.json();
      const validSignedPersisted =
        await repository.getProviderCallbackEventById(validSignedBody.data.id);
      assert.equal(validSignedPersisted?.verificationStatus, 'verified');
      assert.equal(validSignedPersisted?.processingStatus, 'received');

      const invalidDuplicatePayload = {
        ...validSignedPayload,
        callbackType: 'payment.replay.invalid-duplicate-overwrite-attempt',
        amount: 7777,
      };
      const invalidDuplicateResponse =
        await postCallback(baseUrl, invalidDuplicatePayload, {
          'x-provider-signature-algorithm': 'hmac_sha256',
          'x-provider-signature': '00',
        });
      assert.equal(invalidDuplicateResponse.status, 202);
      const invalidDuplicateBody = await invalidDuplicateResponse.json();
      assert.equal(invalidDuplicateBody.data.id, validSignedBody.data.id);
      assert.equal(invalidDuplicateBody.data.processingStatus, 'duplicate');
      assert.equal(invalidDuplicateBody.data.originalProcessingStatus, 'received');
      assert.equal(invalidDuplicateBody.data.verificationStatus, 'verified');
      assert.equal(invalidDuplicateBody.data.replayStatus, 'duplicate_event');
      assert.equal(invalidDuplicateBody.data.replayDetected, true);

      const afterInvalidDuplicate =
        await repository.getProviderCallbackEventById(validSignedBody.data.id);
      assert.equal(afterInvalidDuplicate?.callbackType, 'payment.replay.valid-signed-original');
      assert.deepEqual(afterInvalidDuplicate?.rawPayload, validSignedPayload);
      assert.equal(afterInvalidDuplicate?.verificationStatus, 'verified');
      assert.equal(afterInvalidDuplicate?.processingStatus, 'received');
      assert.equal(afterInvalidDuplicate?.signatureVerified, true);
      assertBoundaryFlagsFalse(afterInvalidDuplicate!.boundary);
      console.log('  [+] OK: Invalid duplicate does not overwrite verified original');

      const conflictPayloadA = {
        callbackType: 'payment.replay.conflict-a',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const conflictPayloadB = {
        callbackType: 'payment.replay.conflict-b',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const conflictResponseA = await postCallback(baseUrl, conflictPayloadA);
      const conflictResponseB = await postCallback(baseUrl, conflictPayloadB);
      assert.equal(conflictResponseA.status, 202);
      assert.equal(conflictResponseB.status, 202);
      const conflictBodyA = await conflictResponseA.json();
      const conflictBodyB = await conflictResponseB.json();

      const identityConflictPayload = {
        callbackType: 'payment.replay.identity-conflict',
        providerEventId: conflictPayloadA.providerEventId,
        idempotencyKey: conflictPayloadB.idempotencyKey,
      };
      const identityConflictResponse =
        await postCallback(baseUrl, identityConflictPayload);
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
      console.log('  [+] OK: Identity conflict is rejected without overwrite');

      return { result: 'PASS', message: `SUCCESS: ${suiteName}` };
    } catch (error) {
      console.error(error);
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
