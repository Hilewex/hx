import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  closePool,
  PostgresProviderCallbackEventRepository,
} from '../../../packages/persistence/dist';
import type { SmokeSuite } from './provider-callback-foundation';

const suiteName = 'Provider Callback BFF Ingestion Boundary';

async function postCallback(
  baseUrl: string,
  providerName: string,
  body: Record<string, unknown>
) {
  return fetch(`${baseUrl}/provider-callback/payment/${providerName}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': `req_${randomUUID()}`,
      'x-correlation-id': `corr_${randomUUID()}`,
    },
    body: JSON.stringify(body),
  });
}

export const providerCallbackIngestionSmoke: SmokeSuite = {
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
      const providerName = `bff-ingestion-${randomUUID()}`;
      const providerEventId = `evt_${randomUUID()}`;
      const idempotencyKey = `idem_${randomUUID()}`;

      const initialPayload = {
        callbackType: 'payment.callback.received',
        providerEventId,
        idempotencyKey,
        providerMode: 'sandbox',
        paymentId: `pay_${randomUUID()}`,
        orderId: `ord_${randomUUID()}`,
        amount: 12345,
      };

      const response = await postCallback(baseUrl, providerName, initialPayload);
      assert.equal(response.status, 202, 'Callback ingestion should return 202');
      const responseBody = await response.json();
      const data = responseBody.data;
      assert.ok(data?.id, 'Response data should include id');
      assert.equal(data.providerDomain, 'payment');
      assert.equal(data.providerName, providerName);
      assert.equal(data.callbackType, 'payment.callback.received');
      assert.equal(data.processingStatus, 'received');
      assert.equal(data.verificationStatus, 'unsupported');
      assert.equal(data.replayStatus, 'first_seen');
      assert.equal(data.replayDetected, false);
      assert.equal(
        Object.prototype.hasOwnProperty.call(data, 'rawPayload'),
        false,
        'Response must not expose rawPayload'
      );
      console.log('  [+] OK: Endpoint returned minimal 202 ingestion response');

      const persisted = await repository.getProviderCallbackEventById(data.id);
      assert.ok(persisted, 'Persisted callback record should exist');
      assert.equal(persisted?.providerDomain, 'payment');
      assert.equal(persisted?.providerName, providerName);
      assert.equal(persisted?.callbackType, 'payment.callback.received');
      assert.equal(persisted?.providerEventId, providerEventId);
      assert.equal(persisted?.idempotencyKey, idempotencyKey);
      assert.equal(persisted?.processingStatus, 'received');
      assert.equal(persisted?.verificationStatus, 'unsupported');
      assert.equal(persisted?.signatureVerified, false);
      assert.equal(persisted?.replayDetected, false);
      assert.equal(persisted?.replayStatus, 'first_seen');
      assert.deepEqual(persisted?.rawPayload, initialPayload);
      assert.equal(persisted?.normalizedPayload, undefined);
      assert.equal(persisted?.error, undefined);
      assert.equal(persisted?.boundary.providerTruth, false);
      assert.equal(persisted?.boundary.businessTruthMutated, false);
      assert.equal(persisted?.boundary.ownerStateMutated, false);
      assert.equal(persisted?.boundary.eventTruthMutated, false);
      assert.equal(persisted?.boundary.outboxDeliveryGuaranteed, false);
      console.log('  [+] OK: Persisted record keeps callback boundary flags false');

      const duplicateProviderEventResponse = await postCallback(baseUrl, providerName, {
        ...initialPayload,
        idempotencyKey: `idem_${randomUUID()}`,
        callbackType: 'payment.callback.overwrite-attempt',
        amount: 99999,
      });
      assert.equal(
        duplicateProviderEventResponse.status,
        202,
        'Duplicate providerEventId should not return a DB error'
      );
      const duplicateProviderEventBody = await duplicateProviderEventResponse.json();
      assert.equal(
        duplicateProviderEventBody.data.id,
        data.id,
        'Duplicate providerEventId should return existing record id'
      );
      assert.equal(duplicateProviderEventBody.data.processingStatus, 'duplicate');
      assert.equal(duplicateProviderEventBody.data.originalProcessingStatus, 'received');
      assert.equal(duplicateProviderEventBody.data.replayStatus, 'duplicate_event');
      assert.equal(duplicateProviderEventBody.data.replayDetected, true);

      const duplicateIdempotencyResponse = await postCallback(baseUrl, providerName, {
        ...initialPayload,
        providerEventId: `evt_${randomUUID()}`,
        callbackType: 'payment.callback.idempotency-overwrite-attempt',
        amount: 88888,
      });
      assert.equal(
        duplicateIdempotencyResponse.status,
        202,
        'Duplicate idempotencyKey should not return a DB error'
      );
      const duplicateIdempotencyBody = await duplicateIdempotencyResponse.json();
      assert.equal(
        duplicateIdempotencyBody.data.id,
        data.id,
        'Duplicate idempotencyKey should return existing record id'
      );
      assert.equal(duplicateIdempotencyBody.data.processingStatus, 'duplicate');
      assert.equal(duplicateIdempotencyBody.data.originalProcessingStatus, 'received');
      assert.equal(duplicateIdempotencyBody.data.replayStatus, 'duplicate_event');
      assert.equal(duplicateIdempotencyBody.data.replayDetected, true);
      console.log('  [+] OK: Duplicate providerEventId and idempotencyKey are idempotent');

      const afterDuplicates = await repository.getProviderCallbackEventById(data.id);
      assert.equal(afterDuplicates?.callbackType, 'payment.callback.received');
      assert.deepEqual(afterDuplicates?.rawPayload, initialPayload);
      assert.equal(afterDuplicates?.processingStatus, 'received');
      assert.equal(afterDuplicates?.verificationStatus, 'unsupported');
      assert.equal(afterDuplicates?.boundary.businessTruthMutated, false);
      assert.equal(afterDuplicates?.boundary.ownerStateMutated, false);
      assert.equal(afterDuplicates?.boundary.eventTruthMutated, false);
      console.log('  [+] OK: Duplicate ingestion did not overwrite business fields');

      const invalidDomain = await fetch(
        `${baseUrl}/provider-callback/commerce/${providerName}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(initialPayload),
        }
      );
      assert.equal(invalidDomain.status, 400, 'Invalid providerDomain should return 400');
      console.log('  [+] OK: Invalid providerDomain is rejected');

      return { result: 'PASS', message: `SUCCESS: ${suiteName}` };
    } catch (error) {
      console.error(error);
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
