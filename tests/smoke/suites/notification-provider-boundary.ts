import { randomUUID } from 'node:crypto';
import { closePool } from '@hx/persistence';
import { getCustomerHeaders } from '../auth-utils';
import { SmokeRunner } from '../types';

type JsonResponse = { status: number; body: any };

export const notificationProviderBoundarySmoke: SmokeRunner = {
  name: 'notification-provider-boundary',
  run: async (baseUrl: string) => {
    try {
      const customerId = `notification-provider-customer-${randomUUID()}`;
      const correlationId = randomUUID();

      const createNotification = await postJson(baseUrl, '/notification/create', getCustomerHeaders(customerId), {
        category: 'TRANSACTION',
        priority: 'NORMAL',
        title: 'Provider Boundary Test',
        body: 'This tests the HARDENING-09A provider envelope.',
        channels: ['EMAIL', 'SMS', 'PUSH'],
        correlationId,
      });

      assertStatus([201], createNotification, 'Notification creation for provider boundary test must be allowed');
      const record = createNotification.body.data.record;

      assertProviderEnvelope(record, 'EMAIL', 'sandbox');
      assertProviderEnvelope(record, 'SMS', 'not_configured');
      assertProviderEnvelope(record, 'PUSH', 'parked');

      await closePool();
      return {
        result: 'PASS',
        message: 'Notification provider boundary envelopes for EMAIL (sandbox), SMS (not_configured), and PUSH (parked) verified successfully.',
      };
    } catch (error: any) {
      await closePool().catch(() => undefined);
      return { result: 'FAIL', message: error.message };
    }
  },
};

async function postJson(baseUrl: string, path: string, headers: Record<string, string>, body: any): Promise<JsonResponse> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

function assertStatus(expected: number[], response: JsonResponse, message: string): void {
  if (!expected.includes(response.status)) {
    throw new Error(`${message}: expected ${expected.join('/')} got ${response.status} ${JSON.stringify(response.body)}`);
  }
}

function assertProviderEnvelope(record: any, channel: 'EMAIL' | 'SMS' | 'PUSH', expectedMode: 'sandbox' | 'not_configured' | 'parked'): void {
  const attempt = record?.deliveryAttempts?.find((a: any) => a.providerEnvelope?.operation === `send-${channel.toLowerCase()}`);
  if (!attempt) {
    throw new Error(`Delivery attempt for ${channel} not found.`);
  }

  const envelope = attempt.providerEnvelope;
  if (!envelope) {
    throw new Error(`Provider envelope for ${channel} is missing.`);
  }

  const expectedProviderName = {
    EMAIL: process.env.NOTIFICATION_EMAIL_PROVIDER_NAME || 'email_sandbox',
    SMS: process.env.NOTIFICATION_SMS_PROVIDER_NAME || 'none',
    PUSH: process.env.NOTIFICATION_PUSH_PROVIDER_NAME || 'push_parked',
  }[channel];

  if (envelope.providerDomain !== 'notification') {
    throw new Error(`[${channel}] providerDomain must be 'notification', got '${envelope.providerDomain}'`);
  }

  if (envelope.providerName !== expectedProviderName) {
    throw new Error(`[${channel}] providerName must be '${expectedProviderName}', got '${envelope.providerName}'`);
  }

  if (envelope.providerMode !== expectedMode) {
    throw new Error(`[${channel}] providerMode must be '${expectedMode}', got '${envelope.providerMode}'`);
  }

  if (envelope.boundary?.providerTruth !== false) {
    throw new Error(`[${channel}] boundary.providerTruth must be false.`);
  }

  if (envelope.boundary?.businessTruthMutated !== false) {
    throw new Error(`[${channel}] boundary.businessTruthMutated must be false.`);
  }
  
  if (attempt.actualProviderDeliveryPerformed !== false) {
      throw new Error(`[${channel}] actualProviderDeliveryPerformed must be false.`);
  }
}
