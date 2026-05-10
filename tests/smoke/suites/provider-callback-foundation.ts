
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { 
    InMemoryProviderCallbackEventRepository 
} from '../../../packages/persistence/dist/provider-callback';
import type { 
    ProviderCallbackRecord,
    ProviderCallbackProcessingStatus
} from '../../../packages/contracts/dist/provider';
import { createProviderBoundaryFlags } from '../../../packages/contracts/dist/provider';

// Define the type for a smoke suite
export type SmokeSuite = {
  name: string;
  run: (baseUrl?: string) => Promise<{ result: 'PASS' | 'FAIL'; message?: string }>;
};

const suiteName = 'Provider Callback Foundation';

export const providerCallbackFoundationSmoke: SmokeSuite = {
  name: suiteName,
  run: async () => {
    try {
      console.log(`[+] Running smoke suite: ${suiteName}`);

      const repository = new InMemoryProviderCallbackEventRepository();
      const providerDomain = 'payment';
      const providerName = 'test-provider';
      const providerEventId = `evt_${randomUUID()}`;
      const idempotencyKey = randomUUID();

      const initialRecord: Omit<ProviderCallbackRecord, 'id'> = {
        providerDomain,
        providerName,
        providerMode: 'sandbox',
        callbackType: 'test.event',
        providerEventId,
        idempotencyKey,
        rawPayload: { data: 'initial' },
        signatureVerified: true,
        verificationStatus: 'verified',
        processingStatus: 'received',
        replayStatus: 'first_seen',
        replayDetected: false,
        receivedAt: new Date(),
        boundary: createProviderBoundaryFlags(),
      };

      // 1. Insert a new record
      const insertedRecord = await repository.insertProviderCallbackEvent(initialRecord);
      assert.ok(insertedRecord.id, 'Should have an ID after insertion');
      assert.equal(insertedRecord.providerEventId, providerEventId);
      assert.equal(insertedRecord.idempotencyKey, idempotencyKey);
      console.log(`  [+] OK: Record inserted with ID: ${insertedRecord.id}`);

      // 2. Read by ID
      const foundById = await repository.getProviderCallbackEventById(insertedRecord.id);
      assert.deepStrictEqual(foundById, insertedRecord, 'Should find the same record by ID');
      console.log('  [+] OK: Record found by ID');

      // 3. Find by providerEventId
      const foundByProviderEventId = await repository.findProviderCallbackEventByProviderEventId(providerDomain, providerName, providerEventId);
      assert.deepStrictEqual(foundByProviderEventId, insertedRecord, 'Should find the same record by providerEventId');
      console.log('  [+] OK: Record found by providerEventId');

      // 4. Find by idempotencyKey
      const foundByIdempotencyKey = await repository.findProviderCallbackEventByIdempotencyKey(providerDomain, providerName, idempotencyKey);
      assert.deepStrictEqual(foundByIdempotencyKey, insertedRecord, 'Should find the same record by idempotencyKey');
      console.log('  [+] OK: Record found by idempotencyKey');

      // 5. List by processingStatus
      const receivedEvents = await repository.listProviderCallbackEventsByProcessingStatus('received');
      assert.ok(receivedEvents.some(event => event.id === insertedRecord.id), 'Should list the record by processingStatus');
      console.log('  [+] OK: Record listed by processingStatus');
      
      // 6. Mark as processed
      const updatedRecord = await repository.markProviderCallbackEventProcessed(insertedRecord.id, 'accepted' as ProviderCallbackProcessingStatus);
      assert.ok(updatedRecord, 'Should return the updated record');
      assert.equal(updatedRecord?.processingStatus, 'accepted', 'Status should be updated');
      assert.ok(updatedRecord?.processedAt, 'processedAt should be set');
      console.log('  [+] OK: Record marked as processed');
      
      // 7. Duplicate providerEventId should not create new record
      const duplicateProviderEventResult = await repository.insertProviderCallbackEvent({
        ...initialRecord,
        idempotencyKey: randomUUID(), // different idempotency key
      });
      assert.equal(duplicateProviderEventResult.id, insertedRecord.id, 'Duplicate providerEventId should return existing record');
      console.log('  [+] OK: Duplicate providerEventId handled correctly');

      // 8. Duplicate idempotencyKey should not create new record
      const duplicateIdempotencyKeyResult = await repository.insertProviderCallbackEvent({
        ...initialRecord,
        providerEventId: `evt_${randomUUID()}`, // different provider event id
      });
      assert.equal(duplicateIdempotencyKeyResult.id, insertedRecord.id, 'Duplicate idempotencyKey should return existing record');
      console.log('  [+] OK: Duplicate idempotencyKey handled correctly');

      // 9. Assert boundary flags remain false
      assert.strictEqual(updatedRecord?.boundary.businessTruthMutated, false, 'businessTruthMutated should be false');
      assert.strictEqual(updatedRecord?.boundary.ownerStateMutated, false, 'ownerStateMutated should be false');
      assert.strictEqual(updatedRecord?.boundary.providerTruth, false, 'providerTruth should be false');
      console.log('  [+] OK: Boundary flags are correctly asserted as false');

      // 10. verificationStatus = FAILED should not imply business mutation
      const failedRecordPayload: Omit<ProviderCallbackRecord, 'id'> = {
          ...initialRecord,
          providerEventId: `evt_${randomUUID()}`,
          idempotencyKey: randomUUID(),
          verificationStatus: 'failed',
      };
      const failedRecord = await repository.insertProviderCallbackEvent(failedRecordPayload);
      assert.strictEqual(failedRecord.boundary.businessTruthMutated, false, 'businessTruthMutated should be false for FAILED verification');
      assert.strictEqual(failedRecord.boundary.ownerStateMutated, false, 'ownerStateMutated should be false for FAILED verification');
      console.log('  [+] OK: FAILED verification status does not mutate business truth');

      return { result: 'PASS', message: `SUCCESS: ${suiteName}` };
    } catch (error) {
      console.error(error);
      return { result: 'FAIL', message: (error as Error).message };
    }
  },
};
