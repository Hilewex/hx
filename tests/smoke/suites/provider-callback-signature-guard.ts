import { strict as assert } from 'node:assert';
import { createHmac, randomUUID } from 'node:crypto';
import {
  closePool,
  PostgresProviderCallbackEventRepository,
} from '../../../packages/persistence/dist';
import type { SmokeSuite } from './provider-callback-foundation';

const suiteName = 'Provider Callback Signature Guard Foundation';
const testProviderName = 'signature-test-provider';
const testSecret = 'test-callback-secret';

function signPayload(body: Record<string, unknown>): string {
  return createHmac('sha256', testSecret)
    .update(JSON.stringify(body))
    .digest('hex');
}

async function postCallback(
  baseUrl: string,
  providerName: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return fetch(`${baseUrl}/provider-callback/payment/${providerName}`, {
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

export const providerCallbackSignatureGuardSmoke: SmokeSuite = {
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

      const validProviderEventId = `evt_${randomUUID()}`;
      const validIdempotencyKey = `idem_${randomUUID()}`;
      const validPayload = {
        callbackType: 'payment.signature.valid',
        providerEventId: validProviderEventId,
        idempotencyKey: validIdempotencyKey,
        amount: 4200,
      };

      const validResponse = await postCallback(baseUrl, testProviderName, validPayload, {
        'x-provider-signature-algorithm': 'hmac_sha256',
        'x-provider-signature': signPayload(validPayload),
        'x-provider-timestamp': new Date().toISOString(),
        'x-provider-nonce': `nonce_${randomUUID()}`,
        'x-provider-event-id': validProviderEventId,
        'idempotency-key': validIdempotencyKey,
      });
      assert.equal(validResponse.status, 202, 'Valid signature should return 202');
      const validBody = await validResponse.json();
      assert.equal(validBody.data.verificationStatus, 'verified');
      assert.equal(validBody.data.processingStatus, 'received');
      assert.equal(validBody.data.replayStatus, 'first_seen');
      assert.equal(validBody.data.replayDetected, false);
      assert.equal(
        Object.prototype.hasOwnProperty.call(validBody.data, 'rawPayload'),
        false,
        'Response must not expose rawPayload'
      );

      const validPersisted =
        await repository.getProviderCallbackEventById(validBody.data.id);
      assert.ok(validPersisted, 'Valid signed callback should be persisted');
      assert.equal(validPersisted?.signatureVerified, true);
      assert.equal(validPersisted?.verificationStatus, 'verified');
      assert.equal(validPersisted?.processingStatus, 'received');
      assert.equal(validPersisted?.replayDetected, false);
      assert.equal(validPersisted?.replayStatus, 'first_seen');
      assertBoundaryFlagsFalse(validPersisted!.boundary);
      console.log('  [+] OK: Valid hmac_sha256 signature is persisted as verified');

      const invalidPayload = {
        callbackType: 'payment.signature.invalid',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
        amount: 5100,
      };
      const invalidResponse = await postCallback(baseUrl, testProviderName, invalidPayload, {
        'x-provider-signature-algorithm': 'hmac_sha256',
        'x-provider-signature': '00',
        'x-provider-timestamp': new Date().toISOString(),
        'x-provider-nonce': `nonce_${randomUUID()}`,
        'x-provider-event-id': invalidPayload.providerEventId,
        'x-idempotency-key': invalidPayload.idempotencyKey,
      });
      assert.equal(invalidResponse.status, 202, 'Invalid signature should still return 202');
      const invalidBody = await invalidResponse.json();
      const invalidPersisted =
        await repository.getProviderCallbackEventById(invalidBody.data.id);
      assert.equal(invalidPersisted?.verificationStatus, 'failed');
      assert.equal(invalidPersisted?.processingStatus, 'rejected');
      assert.equal(invalidPersisted?.signatureVerified, false);
      assert.equal(invalidPersisted?.replayStatus, 'first_seen');
      assertBoundaryFlagsFalse(invalidPersisted!.boundary);
      console.log('  [+] OK: Invalid hmac_sha256 signature is persisted as rejected');

      const unsupportedPayload = {
        callbackType: 'payment.signature.unsupported',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const unsupportedResponse = await postCallback(
        baseUrl,
        testProviderName,
        unsupportedPayload,
        {
          'x-provider-signature-algorithm': 'hmac_sha512',
          'x-provider-signature': 'unsupported_signature',
          'x-provider-event-id': unsupportedPayload.providerEventId,
          'idempotency-key': unsupportedPayload.idempotencyKey,
        }
      );
      assert.equal(unsupportedResponse.status, 202);
      const unsupportedBody = await unsupportedResponse.json();
      const unsupportedPersisted =
        await repository.getProviderCallbackEventById(unsupportedBody.data.id);
      assert.equal(unsupportedPersisted?.verificationStatus, 'unsupported');
      assert.equal(unsupportedPersisted?.processingStatus, 'received');
      assert.equal(unsupportedPersisted?.signatureVerified, false);
      assert.equal(unsupportedPersisted?.replayStatus, 'first_seen');
      assertBoundaryFlagsFalse(unsupportedPersisted!.boundary);
      console.log('  [+] OK: Unsupported algorithm is persisted without domain processing');

      const missingSignaturePayload = {
        callbackType: 'payment.signature.missing',
        providerEventId: `evt_${randomUUID()}`,
        idempotencyKey: `idem_${randomUUID()}`,
      };
      const missingSignatureResponse = await postCallback(
        baseUrl,
        testProviderName,
        missingSignaturePayload
      );
      assert.equal(missingSignatureResponse.status, 202);
      const missingSignatureBody = await missingSignatureResponse.json();
      const missingSignaturePersisted =
        await repository.getProviderCallbackEventById(missingSignatureBody.data.id);
      assert.equal(missingSignaturePersisted?.verificationStatus, 'unsupported');
      assert.equal(missingSignaturePersisted?.processingStatus, 'received');
      assert.equal(missingSignaturePersisted?.signatureVerified, false);
      assert.equal(missingSignaturePersisted?.replayStatus, 'first_seen');
      assertBoundaryFlagsFalse(missingSignaturePersisted!.boundary);
      console.log('  [+] OK: Missing signature is persisted as unsupported');

      const duplicateResponse = await postCallback(baseUrl, testProviderName, {
        ...validPayload,
        callbackType: 'payment.signature.duplicate-overwrite-attempt',
        amount: 9999,
      }, {
        'x-provider-signature-algorithm': 'hmac_sha256',
        'x-provider-signature': signPayload({
          ...validPayload,
          callbackType: 'payment.signature.duplicate-overwrite-attempt',
          amount: 9999,
        }),
        'x-provider-event-id': validProviderEventId,
        'idempotency-key': validIdempotencyKey,
      });
      assert.equal(duplicateResponse.status, 202);
      const duplicateBody = await duplicateResponse.json();
      assert.equal(
        duplicateBody.data.id,
        validBody.data.id,
        'Duplicate valid callback should return existing record id'
      );
      assert.equal(duplicateBody.data.processingStatus, 'duplicate');
      assert.equal(duplicateBody.data.originalProcessingStatus, 'received');
      assert.equal(duplicateBody.data.verificationStatus, 'verified');
      assert.equal(duplicateBody.data.replayStatus, 'duplicate_event');
      assert.equal(duplicateBody.data.replayDetected, true);
      const afterDuplicate =
        await repository.getProviderCallbackEventById(validBody.data.id);
      assert.equal(afterDuplicate?.callbackType, 'payment.signature.valid');
      assert.deepEqual(afterDuplicate?.rawPayload, validPayload);
      assert.equal(afterDuplicate?.verificationStatus, 'verified');
      assert.equal(afterDuplicate?.processingStatus, 'received');
      assert.equal(afterDuplicate?.signatureVerified, true);
      assertBoundaryFlagsFalse(afterDuplicate!.boundary);
      console.log('  [+] OK: Duplicate valid callback is idempotent and does not overwrite');

      return { result: 'PASS', message: `SUCCESS: ${suiteName}` };
    } catch (error) {
      console.error(error);
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
