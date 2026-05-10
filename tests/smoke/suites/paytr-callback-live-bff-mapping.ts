import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  createPaytrCallbackHash,
  PaytrIframeCallbackPayload,
} from '../../../packages/contracts/src/payment';
import {
  closePool,
  PostgresProviderCallbackEventRepository,
} from '../../../packages/persistence/dist';
import type { SmokeSuite } from './provider-callback-foundation';

const suiteName = 'PayTR Callback Live BFF Mapping';
const merchantKey = 'test-key';
const merchantSalt = 'test-salt';

function assertTextPlain(contentType: string | null) {
  assert.ok(contentType, 'Content-Type header should be present');
  assert.equal(
    contentType.split(';')[0].trim().toLowerCase(),
    'text/plain',
    'PayTR callback response should be text/plain'
  );
}

function assertJson(contentType: string | null) {
  assert.ok(contentType, 'Content-Type header should be present');
  assert.equal(
    contentType.split(';')[0].trim().toLowerCase(),
    'application/json',
    'Non-PayTR callback response should remain application/json'
  );
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

function createPaytrPayload(
  merchantOid: string,
  overrides: Partial<PaytrIframeCallbackPayload> = {}
): PaytrIframeCallbackPayload {
  const base: Omit<PaytrIframeCallbackPayload, 'hash'> = {
    merchant_oid: merchantOid,
    status: 'success',
    total_amount: '3456',
    payment_amount: '3456',
    currency: 'TL',
    test_mode: '1',
    ...overrides,
  };

  return {
    ...base,
    hash: createPaytrCallbackHash({
      merchantOid: base.merchant_oid,
      merchantSalt,
      status: base.status,
      totalAmount: base.total_amount,
      merchantKey,
    }),
  };
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
      'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export const paytrCallbackLiveBffMappingSmoke: SmokeSuite = {
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

      const validMerchantOid = `HX10C5_VALID_${randomUUID()}`;
      const validPayload = createPaytrPayload(validMerchantOid);
      const validResponse = await postCallback(baseUrl, 'paytr', validPayload);
      assert.equal(validResponse.status, 200, 'Valid PayTR callback should return 200');
      assertTextPlain(validResponse.headers.get('content-type'));
      assert.equal(await validResponse.text(), 'OK');

      const validPersisted =
        await repository.findProviderCallbackEventByProviderEventId(
          'payment',
          'paytr',
          validMerchantOid
        );
      assert.ok(validPersisted, 'Valid PayTR callback should be persisted');
      assert.deepEqual(validPersisted?.rawPayload, validPayload);
      assert.ok(validPersisted?.normalizedPayload, 'normalizedPayload should be persisted');
      const validNormalized = validPersisted!.normalizedPayload as {
        candidate: {
          normalizedStatus: string;
          signatureVerified: boolean;
          callbackRecordId: string;
          boundary: {
            providerTruth: boolean;
            businessTruthMutated: boolean;
            ownerStateMutated: boolean;
            eventTruthMutated: boolean;
            outboxDeliveryGuaranteed: boolean;
          };
        };
        hashVerified: boolean;
      };
      assert.equal(validNormalized.hashVerified, true);
      assert.equal(validNormalized.candidate.normalizedStatus, 'succeeded');
      assert.equal(validNormalized.candidate.signatureVerified, true);
      assert.equal(validNormalized.candidate.callbackRecordId, 'pending_insert');
      assertBoundaryFlagsFalse(validNormalized.candidate.boundary);
      assertBoundaryFlagsFalse(validPersisted!.boundary);
      console.log('  [+] OK: Valid PayTR callback persisted normalized candidate');

      const badHashMerchantOid = `HX10C5_BAD_HASH_${randomUUID()}`;
      const badHashPayload = {
        ...createPaytrPayload(badHashMerchantOid),
        hash: 'bad-hash',
      };
      const badHashResponse = await postCallback(baseUrl, 'paytr', badHashPayload);
      assert.equal(badHashResponse.status, 200, 'Bad hash PayTR callback should still ACK OK');
      assertTextPlain(badHashResponse.headers.get('content-type'));
      assert.equal(await badHashResponse.text(), 'OK');
      const badHashPersisted =
        await repository.findProviderCallbackEventByProviderEventId(
          'payment',
          'paytr',
          badHashMerchantOid
        );
      assert.ok(badHashPersisted?.normalizedPayload, 'Bad hash normalizedPayload should be persisted');
      const badHashNormalized = badHashPersisted!.normalizedPayload as {
        candidate: {
          normalizedStatus: string;
          shouldProcess: boolean;
          shouldReject: boolean;
          riskFlags: string[];
        };
        hashVerified: boolean;
      };
      assert.equal(badHashNormalized.hashVerified, false);
      assert.equal(badHashNormalized.candidate.normalizedStatus, 'signature_failed');
      assert.equal(badHashNormalized.candidate.shouldProcess, false);
      assert.equal(badHashNormalized.candidate.shouldReject, true);
      assert.equal(badHashNormalized.candidate.riskFlags.includes('PAYTR_HASH_FAILED'), true);
      console.log('  [+] OK: Bad PayTR hash is normalized as signature_failed');

      const duplicatePayload = {
        ...validPayload,
        payment_amount: '9999',
      };
      const duplicateResponse = await postCallback(baseUrl, 'paytr', duplicatePayload);
      assert.equal(duplicateResponse.status, 200, 'Duplicate PayTR callback should return OK');
      assertTextPlain(duplicateResponse.headers.get('content-type'));
      assert.equal(await duplicateResponse.text(), 'OK');
      const afterDuplicate =
        await repository.findProviderCallbackEventByProviderEventId(
          'payment',
          'paytr',
          validMerchantOid
        );
      assert.equal(afterDuplicate?.id, validPersisted?.id);
      assert.deepEqual(afterDuplicate?.rawPayload, validPayload);
      assert.deepEqual(afterDuplicate?.normalizedPayload, validPersisted?.normalizedPayload);
      assertBoundaryFlagsFalse(afterDuplicate!.boundary);
      console.log('  [+] OK: Duplicate PayTR callback did not overwrite normalizedPayload');

      const iyzicoEventId = `evt_${randomUUID()}`;
      const iyzicoResponse = await postCallback(baseUrl, 'iyzico', {
        callbackType: 'payment.callback.received',
        providerEventId: iyzicoEventId,
        providerMode: 'sandbox',
      });
      assert.equal(iyzicoResponse.status, 202, 'Non-PayTR callback should keep generic 202');
      assertJson(iyzicoResponse.headers.get('content-type'));
      const iyzicoBody = await iyzicoResponse.json();
      assert.ok(iyzicoBody.data?.id, 'Non-PayTR JSON envelope should include data.id');
      const iyzicoPersisted =
        await repository.findProviderCallbackEventByProviderEventId(
          'payment',
          'iyzico',
          iyzicoEventId
        );
      assert.ok(iyzicoPersisted, 'Non-PayTR callback should be persisted');
      assert.equal(iyzicoPersisted?.normalizedPayload, undefined);
      assertBoundaryFlagsFalse(iyzicoPersisted!.boundary);
      console.log('  [+] OK: Non-PayTR provider keeps generic JSON behavior');

      return {
        result: 'PASS',
        message: `SUCCESS: ${suiteName}`,
      };
    } catch (error) {
      console.error(error);
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
