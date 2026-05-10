import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  closePool,
  PostgresProviderCallbackEventRepository,
} from '../../../packages/persistence/dist';
import type {
  ProviderCallbackProcessingStatus,
  ProviderCallbackRecord,
} from '../../../packages/contracts/dist/provider';
import { createProviderBoundaryFlags } from '../../../packages/contracts/dist/provider';
import type { SmokeSuite } from './provider-callback-foundation';

const suiteName = 'Provider Callback Postgres Idempotency';

function createRecord(
  overrides: Partial<Omit<ProviderCallbackRecord, 'id'>> = {}
): Omit<ProviderCallbackRecord, 'id'> {
  return {
    providerDomain: 'payment',
    providerName: `postgres-smoke-${randomUUID()}`,
    providerMode: 'sandbox',
    callbackType: 'test.callback.received',
    providerEventId: `evt_${randomUUID()}`,
    idempotencyKey: `idem_${randomUUID()}`,
    rawPayload: { version: 'initial' },
    normalizedPayload: { normalized: true },
    signatureVerified: false,
    verificationStatus: 'not_required',
    processingStatus: 'received',
    replayStatus: 'first_seen',
    replayDetected: false,
    receivedAt: new Date(),
    boundary: createProviderBoundaryFlags(),
    ...overrides,
  };
}

export const providerCallbackPostgresSmoke: SmokeSuite = {
  name: suiteName,
  run: async () => {
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

      const repository = new PostgresProviderCallbackEventRepository();
      const providerName = `postgres-smoke-${randomUUID()}`;
      const providerEventId = `evt_${randomUUID()}`;
      const idempotencyKey = `idem_${randomUUID()}`;

      const initialRecord = createRecord({
        providerName,
        providerEventId,
        idempotencyKey,
      });

      const insertedRecord =
        await repository.insertProviderCallbackEvent(initialRecord);
      assert.ok(insertedRecord.id, 'Inserted record should have an id');
      assert.equal(insertedRecord.providerEventId, providerEventId);
      assert.equal(insertedRecord.idempotencyKey, idempotencyKey);
      assert.equal(insertedRecord.boundary.businessTruthMutated, false);
      assert.equal(insertedRecord.boundary.ownerStateMutated, false);
      assert.equal(insertedRecord.boundary.providerTruth, false);
      console.log('  [+] OK: Initial insert returned persisted record');

      const duplicateProviderEvent =
        await repository.insertProviderCallbackEvent(
          createRecord({
            providerName,
            providerEventId,
            idempotencyKey: `idem_${randomUUID()}`,
            callbackType: 'test.callback.overwrite-attempt',
            rawPayload: { version: 'duplicate-provider-event' },
            verificationStatus: 'failed',
            processingStatus: 'rejected',
          })
        );
      assert.equal(
        duplicateProviderEvent.id,
        insertedRecord.id,
        'Duplicate providerEventId should return the existing record'
      );
      assert.equal(duplicateProviderEvent.callbackType, initialRecord.callbackType);
      assert.deepEqual(duplicateProviderEvent.rawPayload, initialRecord.rawPayload);
      assert.equal(
        duplicateProviderEvent.processingStatus,
        initialRecord.processingStatus
      );
      assert.equal(
        duplicateProviderEvent.verificationStatus,
        initialRecord.verificationStatus
      );
      console.log('  [+] OK: Duplicate providerEventId returns existing record');

      const duplicateIdempotencyKey =
        await repository.insertProviderCallbackEvent(
          createRecord({
            providerName,
            providerEventId: `evt_${randomUUID()}`,
            idempotencyKey,
            callbackType: 'test.callback.idempotency-overwrite-attempt',
            rawPayload: { version: 'duplicate-idempotency-key' },
            verificationStatus: 'verified',
            processingStatus: 'accepted',
          })
        );
      assert.equal(
        duplicateIdempotencyKey.id,
        insertedRecord.id,
        'Duplicate idempotencyKey should return the existing record'
      );
      assert.equal(duplicateIdempotencyKey.callbackType, initialRecord.callbackType);
      assert.deepEqual(duplicateIdempotencyKey.rawPayload, initialRecord.rawPayload);
      assert.equal(
        duplicateIdempotencyKey.processingStatus,
        initialRecord.processingStatus
      );
      assert.equal(
        duplicateIdempotencyKey.verificationStatus,
        initialRecord.verificationStatus
      );
      console.log('  [+] OK: Duplicate idempotencyKey returns existing record');

      const foundByProviderEventId =
        await repository.findProviderCallbackEventByProviderEventId(
          initialRecord.providerDomain,
          providerName,
          providerEventId
        );
      assert.equal(foundByProviderEventId?.id, insertedRecord.id);

      const foundByIdempotencyKey =
        await repository.findProviderCallbackEventByIdempotencyKey(
          initialRecord.providerDomain,
          providerName,
          idempotencyKey
        );
      assert.equal(foundByIdempotencyKey?.id, insertedRecord.id);
      console.log('  [+] OK: Find checks returned the initial record');

      const updatedRecord = await repository.markProviderCallbackEventProcessed(
        insertedRecord.id,
        'accepted' as ProviderCallbackProcessingStatus
      );
      assert.ok(updatedRecord, 'Processed update should return a record');
      assert.equal(updatedRecord?.processingStatus, 'accepted');
      assert.ok(updatedRecord?.processedAt, 'processedAt should be set');
      console.log('  [+] OK: Processing status update works');

      return { result: 'PASS', message: `SUCCESS: ${suiteName}` };
    } catch (error) {
      console.error(error);
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
