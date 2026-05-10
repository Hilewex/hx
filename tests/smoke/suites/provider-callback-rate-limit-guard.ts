import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  closePool,
  PostgresProviderCallbackEventRepository,
} from '../../../packages/persistence/dist';
import type { SmokeSuite } from './provider-callback-foundation';

const suiteName = 'Provider Callback Public Webhook Rate Limit Abuse Guard Foundation';

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

export const providerCallbackRateLimitGuardSmoke: SmokeSuite = {
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
      const providerName = `rate-limit-smoke-${randomUUID()}`;
      const clientIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
      const acceptedIds: string[] = [];

      for (let index = 0; index < 20; index += 1) {
        const payload = {
          callbackType: 'payment.rate-limit.accepted',
          providerEventId: `evt_${randomUUID()}`,
          idempotencyKey: `idem_${randomUUID()}`,
          sequence: index + 1,
        };
        const burstResponse = await postCallback(baseUrl, providerName, payload, {
          'x-forwarded-for': clientIp,
        });
        assert.equal(
          burstResponse.status,
          202,
          `Request ${index + 1} should be accepted before rate limit`
        );
        const burstBody = await burstResponse.json();
        assert.ok(burstBody.data?.id, 'Accepted response should include id');
        assert.equal(burstBody.data.processingStatus, 'received');
        assert.equal(burstBody.data.replayStatus, 'first_seen');
        assert.equal(burstBody.data.replayDetected, false);
        acceptedIds.push(burstBody.data.id);
      }
      console.log('  [+] OK: First 20 requests from same provider/client returned 202');

      const firstPersisted =
        await repository.getProviderCallbackEventById(acceptedIds[0]);
      assert.ok(firstPersisted, 'Accepted callback should be persisted');
      assert.equal(firstPersisted?.processingStatus, 'received');
      assert.equal(firstPersisted?.replayStatus, 'first_seen');
      assert.equal(firstPersisted?.replayDetected, false);
      assertBoundaryFlagsFalse(firstPersisted!.boundary);
      console.log('  [+] OK: Normal first_seen persistence behavior is preserved');

      const limitedProviderEventId = `evt_${randomUUID()}`;
      const limitedPayload = {
        callbackType: 'payment.rate-limit.blocked',
        providerEventId: limitedProviderEventId,
        idempotencyKey: `idem_${randomUUID()}`,
        sequence: 21,
      };
      const limitedResponse = await postCallback(
        baseUrl,
        providerName,
        limitedPayload,
        { 'x-forwarded-for': clientIp }
      );
      assert.equal(limitedResponse.status, 429, '21st request should be rate limited');
      const limitedBody = await limitedResponse.json();
      assert.equal(
        limitedBody.errors?.[0]?.code,
        'PROVIDER_CALLBACK_RATE_LIMITED'
      );
      assert.equal(
        limitedBody.errors?.[0]?.message,
        'Provider callback rate limit exceeded'
      );
      assert.equal(limitedBody.errors?.[0]?.category, 'transport');
      assert.equal(
        Object.prototype.hasOwnProperty.call(limitedBody, 'data'),
        false,
        'Rate limited response must not include data/id'
      );

      const limitedPersisted =
        await repository.findProviderCallbackEventByProviderEventId(
          'payment',
          providerName,
          limitedProviderEventId
        );
      assert.equal(
        limitedPersisted,
        null,
        'Rate limited callback should not be persisted'
      );
      console.log('  [+] OK: 21st request returned 429 and bypassed persistence');

      const differentProviderName = `rate-limit-smoke-other-${randomUUID()}`;
      const differentProviderResponse = await postCallback(
        baseUrl,
        differentProviderName,
        {
          callbackType: 'payment.rate-limit.provider-isolation',
          providerEventId: `evt_${randomUUID()}`,
          idempotencyKey: `idem_${randomUUID()}`,
        },
        { 'x-forwarded-for': clientIp }
      );
      assert.equal(
        differentProviderResponse.status,
        202,
        'Different providerName should have an isolated rate limit bucket'
      );
      console.log('  [+] OK: Different providerName is isolated');

      const differentClientResponse = await postCallback(
        baseUrl,
        providerName,
        {
          callbackType: 'payment.rate-limit.client-isolation',
          providerEventId: `evt_${randomUUID()}`,
          idempotencyKey: `idem_${randomUUID()}`,
        },
        { 'x-forwarded-for': '203.0.113.44' }
      );
      assert.equal(
        differentClientResponse.status,
        202,
        'Different x-forwarded-for should have an isolated rate limit bucket'
      );
      console.log('  [+] OK: Different x-forwarded-for is isolated');

      return { result: 'PASS', message: `SUCCESS: ${suiteName}` };
    } catch (error) {
      console.error(error);
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
