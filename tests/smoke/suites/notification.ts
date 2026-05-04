import { randomUUID } from 'node:crypto';
import { closePool, getAuditEventRepositories } from '@hx/persistence';
import { getAdminHeaders, getCreatorHeaders, getCustomerHeaders, getGuestHeaders } from '../auth-utils';
import { SmokeRunner } from '../types';

type JsonResponse = { status: number; body: any };

export const notificationSmoke: SmokeRunner = {
  name: 'notification',
  run: async (baseUrl: string) => {
    try {
      const correlationId = randomUUID();
      const causationId = randomUUID();
      const customerA = `notification-customer-a-${randomUUID()}`;
      const customerB = `notification-customer-b-${randomUUID()}`;
      const creatorId = `notification-creator-${randomUUID()}`;
      const adminId = `notification-admin-${randomUUID()}`;

      const guestCreate = await postJson(baseUrl, '/notification/create', getGuestHeaders(), baseCreateBody({ title: 'guest denied' }));
      assertStatus([401], guestCreate, 'Guest notification create must be denied');

      const guestList = await getJson(baseUrl, '/notification/list', getGuestHeaders());
      assertStatus([401], guestList, 'Guest notification list must be denied');

      const ownCreate = await postJson(baseUrl, '/notification/create', getCustomerHeaders(customerA), {
        ...baseCreateBody({ title: 'customer own provider boundary' }),
        channels: ['EMAIL', 'PUSH', 'SMS'],
        correlationId,
        causationId,
        schemaVersion: 'v1',
      });
      assertStatus([201], ownCreate, 'Customer own notification create must be allowed');
      const ownRecord = ownCreate.body.data.record;
      assertRecordBoundary(ownRecord, customerA, 'CUSTOMER');
      assertProviderBoundary(ownRecord);

      const spoofCreate = await postJson(baseUrl, '/notification/create', getCustomerHeaders(customerA), {
        ...baseCreateBody({ title: 'spoof denied' }),
        actorType: 'CUSTOMER',
        actorId: customerB,
      });
      assertStatus([403], spoofCreate, 'Customer create for another actor must be denied');

      const ownList = await getJson(baseUrl, '/notification/list', getCustomerHeaders(customerA));
      assertStatus([200], ownList, 'Customer own list must be allowed');
      if (!ownList.body.data.items.some((item: any) => item.notificationId === ownRecord.notificationId)) {
        throw new Error('Customer own list did not include own notification');
      }
      if (typeof ownList.body.data.unreadCount !== 'number' || ownList.body.data.unreadCount < 1) {
        throw new Error('Customer unread count is not owner-scoped or was not returned');
      }

      const crossList = await getJson(baseUrl, `/notification/list?actorType=CUSTOMER&actorId=${encodeURIComponent(customerB)}`, getCustomerHeaders(customerA));
      assertStatus([403], crossList, 'Customer list for another actor inbox must be denied');

      const customerBCreate = await postJson(baseUrl, '/notification/create', getCustomerHeaders(customerB), {
        ...baseCreateBody({ title: 'customer b private notification' }),
        correlationId: randomUUID(),
      });
      assertStatus([201], customerBCreate, 'Customer B own notification create must be allowed for cross-owner checks');
      const customerBRecord = customerBCreate.body.data.record;

      const ownGet = await getJson(baseUrl, `/notification/${ownRecord.notificationId}`, getCustomerHeaders(customerA));
      assertStatus([200], ownGet, 'Customer own get must be allowed');

      const crossGet = await getJson(baseUrl, `/notification/${customerBRecord.notificationId}`, getCustomerHeaders(customerA));
      assertStatus([403, 404], crossGet, 'Customer get another actor notification must be denied');

      const ownRead = await postJson(baseUrl, '/notification/read', getCustomerHeaders(customerA), { notificationId: ownRecord.notificationId });
      assertStatus([200], ownRead, 'Customer own mark read must be allowed');
      assertMutationBoundary(ownRead.body.data, 'Customer own mark read boundary failed');

      const crossRead = await postJson(baseUrl, '/notification/read', getCustomerHeaders(customerA), { notificationId: customerBRecord.notificationId });
      assertStatus([403, 404], crossRead, 'Customer read another actor notification must be denied');

      const ownArchive = await postJson(baseUrl, '/notification/archive', getCustomerHeaders(customerA), { notificationId: ownRecord.notificationId });
      assertStatus([200], ownArchive, 'Customer own archive must be allowed');
      assertMutationBoundary(ownArchive.body.data, 'Customer own archive boundary failed');

      const crossArchive = await postJson(baseUrl, '/notification/archive', getCustomerHeaders(customerA), { notificationId: customerBRecord.notificationId });
      assertStatus([403, 404], crossArchive, 'Customer archive another actor notification must be denied');

      const creatorCreate = await postJson(baseUrl, '/notification/create', getCreatorHeaders(creatorId), baseCreateBody({ title: 'creator own notification' }));
      assertStatus([201], creatorCreate, 'Creator own notification create must be allowed by explicit policy');
      assertRecordBoundary(creatorCreate.body.data.record, creatorId, 'CREATOR');

      const adminCreate = await postJson(baseUrl, '/notification/create', getAdminHeaders(adminId), {
        ...baseCreateBody({ title: 'admin creates customer notification' }),
        actorType: 'CUSTOMER',
        actorId: customerB,
        channels: ['IN_APP'],
        correlationId: randomUUID(),
      });
      assertStatus([201], adminCreate, 'Admin create for target recipient must be allowed by explicit override policy');
      const adminRecord = adminCreate.body.data.record;
      assertRecordBoundary(adminRecord, customerB, 'CUSTOMER');
      if (adminRecord.submittedByActorType !== 'ADMIN' || adminRecord.submittedByActorId !== adminId) {
        throw new Error('Admin submittedBy context was not preserved on notification record');
      }

      const adminList = await getJson(baseUrl, `/notification/list?actorType=CUSTOMER&actorId=${encodeURIComponent(customerB)}`, getAdminHeaders(adminId));
      assertStatus([200], adminList, 'Admin list target recipient inbox must be allowed by explicit override policy');

      const adminGet = await getJson(baseUrl, `/notification/${adminRecord.notificationId}`, getAdminHeaders(adminId));
      assertStatus([200], adminGet, 'Admin get target notification must be allowed by explicit override policy');

      const adminRead = await postJson(baseUrl, '/notification/read', getAdminHeaders(adminId), { notificationId: adminRecord.notificationId });
      assertStatus([200], adminRead, 'Admin mark read must be allowed by explicit override policy');

      const adminArchive = await postJson(baseUrl, '/notification/archive', getAdminHeaders(adminId), { notificationId: adminRecord.notificationId });
      assertStatus([200], adminArchive, 'Admin archive must be allowed by explicit override policy');

      await assertAuditOutboxBoundary(ownRecord.notificationId, ['notification.created', 'notification.delivery_attempted', 'notification.delivery_failed', 'notification.provider_parked', 'notification.read', 'notification.archived']);

      await closePool();
      return {
        result: 'PASS',
        message: 'BFF notification guard, recipient spoof denial, owner-scoped inbox/read/archive, admin override, provider sandbox/parked/not-configured boundary, and notification audit/outbox append boundary verified'
      };
    } catch (error: any) {
      await closePool().catch(() => undefined);
      return { result: 'FAIL', message: error.message };
    }
  }
};

function baseCreateBody(overrides: Partial<Record<string, any>> = {}) {
  return {
    category: 'TRANSACTION',
    priority: 'NORMAL',
    title: 'notification smoke',
    body: 'notification smoke body',
    objectType: 'notification_smoke',
    objectId: `object-${randomUUID()}`,
    ...overrides,
  };
}

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

function assertRecordBoundary(record: any, actorId: string, actorType: string): void {
  if (
    record?.actorType !== actorType ||
    record?.actorId !== actorId ||
    record?.recipientActorType !== actorType ||
    record?.recipientActorId !== actorId ||
    record?.notificationTruthMutated !== true ||
    record?.businessTruthMutated !== false ||
    record?.ownerStateMutated !== false ||
    record?.deliveryTruth !== false ||
    record?.actualProviderDeliveryPerformed !== false ||
    record?.outboxDeliveryGuaranteed !== false ||
    record?.paymentTruthMutated !== false ||
    record?.orderTruthMutated !== false
  ) {
    throw new Error(`Notification record boundary failed: ${JSON.stringify(record)}`);
  }
}

function assertMutationBoundary(result: any, message: string): void {
  if (
    result?.success !== true ||
    result?.notificationTruthMutated !== true ||
    result?.businessTruthMutated !== false ||
    result?.ownerStateMutated !== false ||
    result?.deliveryTruth !== false ||
    result?.actualProviderDeliveryPerformed !== false ||
    result?.outboxDeliveryGuaranteed !== false
  ) {
    throw new Error(`${message}: ${JSON.stringify(result)}`);
  }
}

function assertProviderBoundary(record: any): void {
  const attempts = record?.deliveryAttempts || [];
  const email = attempts.find((attempt: any) => attempt.providerType === 'EMAIL_SANDBOX');
  const push = attempts.find((attempt: any) => attempt.providerType === 'PUSH_PARKED');
  const sms = attempts.find((attempt: any) => attempt.providerType === 'SMS_PARKED');
  if (!email || email.state !== 'SANDBOX_DELIVERED' || email.actualProviderDeliveryPerformed !== false || email.providerBoundary !== 'SANDBOX') {
    throw new Error(`Email sandbox delivery boundary failed: ${JSON.stringify(attempts)}`);
  }
  if (!push || push.state !== 'PUSH_PROVIDER_PARKED' || push.actualProviderDeliveryPerformed !== false || push.providerBoundary !== 'PARKED') {
    throw new Error(`Push parked delivery boundary failed: ${JSON.stringify(attempts)}`);
  }
  if (!sms || sms.state !== 'PROVIDER_NOT_CONFIGURED' || sms.actualProviderDeliveryPerformed !== false || sms.providerBoundary !== 'NOT_CONFIGURED') {
    throw new Error(`SMS provider-not-configured delivery boundary failed: ${JSON.stringify(attempts)}`);
  }
}

async function assertAuditOutboxBoundary(notificationId: string, expectedActions: string[]): Promise<void> {

  const { audit, outbox } = getAuditEventRepositories();
  const logs = await audit.listAuditLogsByEntity('notification', 'notification', notificationId);
  for (const action of expectedActions) {
    const log = logs.find(item => item.actionType === action);
    if (!log || log.businessTruthMutated !== false || log.ownerStateMutated !== false || log.auditTruth !== true) {
      throw new Error(`Notification audit boundary missing or invalid for ${action}: ${JSON.stringify(logs)}`);
    }
  }

  const pending = await outbox.listPendingOutboxEvents(10000);
  const events = pending.filter(event => event.ownerService === 'notification' && event.entityType === 'notification' && event.entityId === notificationId);
  for (const action of expectedActions) {
    const event = events.find(item => item.topic === action);
    if (!event || event.businessTruthMutated !== false || event.ownerStateMutated !== false || event.deliveryGuaranteed !== false) {
      throw new Error(`Notification outbox boundary missing or invalid for ${action}: ${JSON.stringify(events)}`);
    }
  }
}
