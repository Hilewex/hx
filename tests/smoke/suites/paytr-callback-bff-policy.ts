import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  closePool,
  PostgresProviderCallbackEventRepository,
} from '../../../packages/persistence/dist';
import type { SmokeSuite } from './provider-callback-foundation';

const suiteName = 'PayTR Callback BFF Response Policy Bridge';

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
    'Non-PayTR response should remain application/json'
  );
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

function createPaytrPayload(merchantOid: string) {
  return {
    merchant_oid: merchantOid,
    status: 'success',
    total_amount: '3456',
    hash: 'dummy-not-verified-in-10c3',
    payment_amount: '3456',
    currency: 'TL',
    test_mode: '1',
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

export const paytrCallbackBffPolicySmoke: SmokeSuite = {
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
      assertJson(health.headers.get('content-type'));
      const healthBody = await health.json();
      assert.equal(healthBody.data?.status, 'ok');
      console.log('  [+] OK: /health remains JSON');

      const repository = new PostgresProviderCallbackEventRepository();
      const merchantOid = `HX10C3_${randomUUID()}`;
      const payload = createPaytrPayload(merchantOid);

      const paytrResponse = await postCallback(baseUrl, 'paytr', payload);
      assert.equal(paytrResponse.status, 200, 'PayTR callback should return 200');
      assertTextPlain(paytrResponse.headers.get('content-type'));
      const paytrBody = await paytrResponse.text();
      assert.equal(paytrBody, 'OK', 'PayTR callback body should be exactly OK');
      assert.equal(paytrBody.includes('merchant_oid'), false, 'Response must not leak rawPayload');
      assert.equal(paytrBody.trim().startsWith('{'), false, 'PayTR response must not be JSON');
      console.log('  [+] OK: PayTR accepted callback returns text/plain OK');

      const persisted =
        await repository.findProviderCallbackEventByProviderEventId(
          'payment',
          'paytr',
          merchantOid
        );
      assert.ok(persisted, 'PayTR callback should be persisted by merchant_oid');
      assert.equal(persisted?.providerDomain, 'payment');
      assert.equal(persisted?.providerName, 'paytr');
      assert.equal(persisted?.providerEventId, merchantOid);
      assert.equal(persisted?.providerReference, merchantOid);
      assert.equal(persisted?.processingStatus, 'received');
      assert.equal(persisted?.verificationStatus, 'unsupported');
      assert.equal(persisted?.signatureVerified, false);
      assert.deepEqual(persisted?.rawPayload, payload);
      if (persisted?.normalizedPayload) {
        const normalizedPayload = persisted.normalizedPayload as {
          candidate?: {
            boundary?: {
              providerTruth: boolean;
              businessTruthMutated: boolean;
              ownerStateMutated: boolean;
              eventTruthMutated: boolean;
              outboxDeliveryGuaranteed: boolean;
            };
          };
          boundary?: {
            providerTruth: boolean;
            businessTruthMutated: boolean;
            ownerStateMutated: boolean;
            eventTruthMutated: boolean;
            outboxDeliveryGuaranteed: boolean;
          };
        };
        if (normalizedPayload.candidate?.boundary) {
          assertBoundaryFlagsFalse(normalizedPayload.candidate.boundary);
        }
        if (normalizedPayload.boundary) {
          assertBoundaryFlagsFalse(normalizedPayload.boundary);
        }
      }
      assertBoundaryFlagsFalse(persisted!.boundary);
      console.log('  [+] OK: PayTR callback persisted without domain mutation');

      const duplicateResponse = await postCallback(baseUrl, 'paytr', payload);
      assert.equal(duplicateResponse.status, 200, 'Duplicate PayTR callback should return 200');
      assertTextPlain(duplicateResponse.headers.get('content-type'));
      assert.equal(await duplicateResponse.text(), 'OK');
      const afterDuplicate =
        await repository.findProviderCallbackEventByProviderEventId(
          'payment',
          'paytr',
          merchantOid
        );
      assert.equal(afterDuplicate?.id, persisted?.id);
      assert.equal(afterDuplicate?.processingStatus, 'received');
      assertBoundaryFlagsFalse(afterDuplicate!.boundary);
      console.log('  [+] OK: Duplicate PayTR callback returns OK and reuses merchant_oid identity');

      const rateLimitProviderName = 'paytr';
      const rateLimitClient = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
      for (let index = 0; index < 20; index += 1) {
        const accepted = await postCallback(
          baseUrl,
          rateLimitProviderName,
          createPaytrPayload(`HX10C3_RATE_${index}_${randomUUID()}`),
          { 'x-forwarded-for': rateLimitClient }
        );
        assert.equal(accepted.status, 200, `PayTR rate-limit warmup ${index + 1} should return 200`);
        assert.equal(await accepted.text(), 'OK');
      }

      const limitedMerchantOid = `HX10C3_RATE_LIMITED_${randomUUID()}`;
      const limitedResponse = await postCallback(
        baseUrl,
        rateLimitProviderName,
        createPaytrPayload(limitedMerchantOid),
        { 'x-forwarded-for': rateLimitClient }
      );
      assert.equal(limitedResponse.status, 429, 'Rate limited PayTR request should return 429');
      assertJson(limitedResponse.headers.get('content-type'));
      const limitedBody = await limitedResponse.json();
      assert.equal(limitedBody.errors?.[0]?.code, 'PROVIDER_CALLBACK_RATE_LIMITED');
      const limitedPersisted =
        await repository.findProviderCallbackEventByProviderEventId(
          'payment',
          'paytr',
          limitedMerchantOid
        );
      assert.equal(limitedPersisted, null, 'Rate limited PayTR request should not be persisted');
      console.log('  [+] OK: Rate limited PayTR request does not receive OK');

      const iyzicoResponse = await postCallback(baseUrl, `iyzico-${randomUUID()}`, {
        callbackType: 'payment.callback.received',
        providerEventId: `evt_${randomUUID()}`,
        providerMode: 'sandbox',
      });
      assert.equal(iyzicoResponse.status, 202, 'Non-PayTR callback should keep handler status');
      assertJson(iyzicoResponse.headers.get('content-type'));
      const iyzicoBody = await iyzicoResponse.json();
      assert.ok(iyzicoBody.data?.id, 'Non-PayTR JSON envelope should include data.id');
      assert.equal(
        Object.prototype.hasOwnProperty.call(iyzicoBody.data, 'rawPayload'),
        false,
        'Non-PayTR response must not expose rawPayload'
      );
      console.log('  [+] OK: Non-PayTR provider keeps JSON envelope behavior');

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
