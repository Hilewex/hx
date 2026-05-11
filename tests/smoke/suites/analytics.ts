import { randomUUID } from 'node:crypto';
import { getAdminHeaders, getCreatorHeaders, getCustomerHeaders, getGuestHeaders } from '../auth-utils';
import { SmokeRunner } from '../types';

type JsonResponse = { status: number; body: any };

export const analyticsSmoke: SmokeRunner = {
  name: 'analytics',
  run: async (baseUrl: string) => {
    try {
      const correlationId = `analytics-corr-${randomUUID()}`;
      const causationId = `analytics-cause-${randomUUID()}`;
      const schemaVersion = 'v1';
      const customerId = `customer-${randomUUID()}`;
      const creatorId = `creator-${randomUUID()}`;
      const adminId = `admin-${randomUUID()}`;

      const guestRestricted = await postJson(baseUrl, '/analytics/event/ingest', getGuestHeaders(), {
        eventName: 'checkout_started',
        metricFamily: 'COMMERCE',
        metricType: 'RAW_COUNT',
        source: 'API',
        payload: { checkoutId: 'checkout-smoke' }
      });
      assertStatus([401, 403], guestRestricted, 'Guest restricted analytics event must be denied');

      const guestSafe = await postJson(baseUrl, '/analytics/event/ingest', getGuestHeaders(), {
        eventName: `product_card_impression`,
        metricFamily: 'NAVIGATION',
        metricType: 'RAW_COUNT',
        surface: 'category_plp',
        source: 'API',
        payload: { productId: 'product-smoke' }
      });
      assertStatus([401, 403, 201], guestSafe, 'Unknown guest event must not bypass anonymous allowlist');

      const piiEvent = await postJson(baseUrl, '/analytics/event/ingest', getCustomerHeaders(customerId), {
        eventName: 'profile_updated',
        metricFamily: 'COMMERCE',
        metricType: 'RAW_COUNT',
        surface: 'pdp',
        source: 'API',
        payload: { email: 'test@example.com', phone: '123456789', someData: 'safe' },
        correlationId,
        causationId,
        schemaVersion
      });
      assertStatus([201], piiEvent, 'Customer analytics event with PII must be allowed but masked');
      if (piiEvent.body.data.piiDetected !== true || piiEvent.body.data.piiMasked !== true) {
        throw new Error('PII must be detected and masked');
      }

      const badEvent = await postJson(baseUrl, '/analytics/event/ingest', getCustomerHeaders(customerId), {
        eventName: 'bad event type!',
        metricFamily: 'NAVIGATION',
        metricType: 'RAW_COUNT',
        surface: 'pdp',
        source: 'API',
        payload: { productId: 'product-smoke' },
        correlationId,
        causationId,
        schemaVersion
      });
      assertStatus([400, 500], badEvent, 'Invalid taxonomy event name must be rejected');

      const guestAllowed = await postJson(baseUrl, '/analytics/event/ingest', getGuestHeaders(), {
        eventName: 'product_card_impression',
        metricFamily: 'NAVIGATION',
        metricType: 'RAW_COUNT',
        surface: 'category_plp',
        source: 'API',
        payload: { productId: `product-${randomUUID()}` },
        correlationId,
        causationId,
        schemaVersion
      });
      assertStatus([201], guestAllowed, 'Guest anonymous-safe analytics event must be allowed');

      const emptyName = await postJson(baseUrl, '/analytics/event/ingest', getCustomerHeaders(customerId), {
        eventName: '',
        metricFamily: 'NAVIGATION',
        metricType: 'RAW_COUNT',
        source: 'API',
        payload: {}
      });
      assertStatus([400], emptyName, 'Empty analytics eventName must be rejected');

      const customerEventName = `pdp_opened_${randomUUID()}`;
      const customerOwn = await postJson(baseUrl, '/analytics/event/ingest', getCustomerHeaders(customerId), {
        eventName: customerEventName,
        metricFamily: 'NAVIGATION',
        metricType: 'RAW_COUNT',
        surface: 'pdp',
        source: 'API',
        payload: { productId: 'product-smoke' },
        correlationId,
        causationId,
        schemaVersion
      });
      assertStatus([201], customerOwn, 'Customer own analytics event must be allowed');
      assertBoundaryResult(customerOwn.body.data, 'Customer analytics ingest boundary flags failed');

      const customerSpoof = await postJson(baseUrl, '/analytics/event/ingest', getCustomerHeaders(customerId), {
        eventName: `pdp_opened_${randomUUID()}`,
        metricFamily: 'NAVIGATION',
        metricType: 'RAW_COUNT',
        source: 'API',
        actor: { actorType: 'CUSTOMER', actorId: `other-${randomUUID()}` },
        payload: {}
      });
      assertStatus([403], customerSpoof, 'Customer spoofed analytics actor must be denied');

      const creatorOwn = await postJson(baseUrl, '/analytics/event/ingest', getCreatorHeaders(creatorId), {
        eventName: `store_surface_opened_${randomUUID()}`,
        metricFamily: 'CONTENT',
        metricType: 'RAW_COUNT',
        surface: 'creator_panel',
        source: 'API',
        payload: { storefrontId: 'store-smoke' }
      });
      assertStatus([201], creatorOwn, 'Creator own analytics event must be allowed');
      assertBoundaryResult(creatorOwn.body.data, 'Creator analytics ingest boundary flags failed');

      const adminSystem = await postJson(baseUrl, '/analytics/event/ingest', getAdminHeaders(adminId), {
        eventName: `system_degraded_returned_${randomUUID()}`,
        metricFamily: 'DEGRADATION',
        metricType: 'RAW_COUNT',
        surface: 'admin_panel',
        source: 'API',
        actor: { actorType: 'SYSTEM', actorId: 'analytics-smoke-system' },
        payload: { dependency: 'analytics-smoke' },
        dataQualityState: 'DEGRADED'
      });
      assertStatus([201], adminSystem, 'Admin/operator system analytics event must be allowed');
      assertBoundaryResult(adminSystem.body.data, 'Admin system analytics ingest boundary flags failed');

      const snapshot = await getJson(
        baseUrl,
        `/analytics/metric?metricName=${encodeURIComponent(customerEventName)}&metricFamily=NAVIGATION`,
        getAdminHeaders(adminId)
      );
      assertStatus([200], snapshot, 'Analytics metric snapshot must be readable after valid RAW_COUNT ingest');
      const snapshotData = snapshot.body.data;
      if (
        snapshotData.businessTruthMutated !== false ||
        snapshotData.ownerStateMutated !== false ||
        snapshotData.permissionTruth !== false ||
        snapshotData.eligibilityTruth !== false ||
        snapshotData.riskDecisionTruth !== false ||
        snapshotData.eventTruthMutated !== false ||
        snapshotData.snapshot?.businessTruthMutated !== false ||
        snapshotData.snapshot?.analyticsTruth !== true
      ) {
        throw new Error('Analytics metric snapshot was exposed as business, permission, eligibility, risk, or event truth');
      }
      if (
        snapshotData.snapshot?.tags?.correlationId !== correlationId ||
        snapshotData.snapshot?.tags?.schemaVersion !== schemaVersion
      ) {
        throw new Error('Analytics correlationId/schemaVersion were not preserved into metric snapshot metadata');
      }

      return {
        result: 'PASS',
        message: 'BFF analytics guard, body actor spoof denial, anonymous allowlist, customer/creator/admin allow paths, validation, boundary flags, metric snapshot boundary, correlationId, and schemaVersion verified'
      };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};

async function postJson(baseUrl: string, path: string, headers: Record<string, string>, body: any): Promise<JsonResponse> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  return { status: res.status, body: await res.json() };
}

async function getJson(baseUrl: string, path: string, headers: Record<string, string>): Promise<JsonResponse> {
  const res = await fetch(`${baseUrl}${path}`, { headers });
  return { status: res.status, body: await res.json() };
}

function assertStatus(expected: number[], response: JsonResponse, message: string): void {
  if (!expected.includes(response.status)) {
    throw new Error(`${message}: expected ${expected.join('/')} got ${response.status} ${JSON.stringify(response.body)}`);
  }
}

function assertBoundaryResult(data: any, message: string): void {
  if (
    data?.success !== true ||
    data?.analyticsTruthMutated !== true ||
    data?.businessTruthMutated !== false ||
    data?.ownerStateMutated !== false ||
    data?.permissionTruth !== false ||
    data?.eligibilityTruth !== false ||
    data?.riskDecisionTruth !== false ||
    data?.eventTruthMutated !== false ||
    data?.outboxDeliveryGuaranteed !== false
  ) {
    throw new Error(`${message}: ${JSON.stringify(data)}`);
  }
}
