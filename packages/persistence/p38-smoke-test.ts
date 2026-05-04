import { config } from 'dotenv';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import {
  closePool,
  getAuditEventRepositories,
  resetAuditEventRepositories,
} from './src';

config();

const defaultDatabaseUrl = 'postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db';
const requireFromSmoke = createRequire(__filename);

function requireFrom<T = any>(request: string, fromDir: string): T {
  const resolved = requireFromSmoke.resolve(request, {
    paths: [path.resolve(__dirname, fromDir)],
  });
  return requireFromSmoke(resolved) as T;
}

async function verifyMemoryFoundation() {
  console.log('--- P38 Memory Audit/Event Foundation ---');
  process.env.PERSISTENCE_MODE = 'memory';
  resetAuditEventRepositories();

  const repos = getAuditEventRepositories();
  const audit = await repos.audit.appendAuditLog({
    actorType: 'SYSTEM',
    actorId: 'p38-memory',
    actionType: 'p38.memory_audit',
    ownerService: 'persistence',
    entityType: 'smoke',
    entityId: 'memory-1',
    metadata: { mode: 'memory' },
  });
  const event = await repos.outbox.appendOutboxEvent({
    topic: 'p38.memory_event',
    payloadSchema: 'p38.memory_event.v1',
    payload: { ok: true },
    ownerService: 'persistence',
    entityType: 'smoke',
    entityId: 'memory-1',
    idempotencyKey: 'p38-memory-event',
  });
  const duplicate = await repos.outbox.appendOutboxEvent({
    topic: 'p38.memory_event',
    payloadSchema: 'p38.memory_event.v1',
    payload: { ok: true },
    ownerService: 'persistence',
    entityType: 'smoke',
    entityId: 'memory-1',
    idempotencyKey: 'p38-memory-event',
  });

  if (!audit.auditId || !event.eventId || duplicate.eventId !== event.eventId) {
    throw new Error('Memory audit/event append or idempotency failed');
  }
  console.log('Memory foundation append validated.');
}

async function verifyPilotIntegrations() {
  console.log('--- P38 Pilot Integrations ---');
  process.env.PERSISTENCE_MODE = 'memory';
  resetAuditEventRepositories();

  const moderation = await import('../../services/moderation/src/moderation');
  const paymentCheckout = requireFrom('@hx/checkout/src/checkout', '../../services/payment');
  const orderCheckout = requireFrom('@hx/checkout/src/checkout', '../../services/order');
  const payment = requireFrom('@hx/payment/src/payment', '../../services/order');
  const paymentRepo = requireFrom('@hx/payment/src/repository', '../../services/order');
  const order = requireFrom('@hx/order/src/order', '../../services/order');
  const orderRepo = requireFrom('@hx/order/src/repository', '../../services/order');

  paymentRepo.resetPaymentRepository();
  orderRepo.resetOrderRepository();

  const created = await moderation.createModerationCase({
    target: {
      targetType: 'UGC',
      targetId: 'ugc-p38',
      ownerActorId: 'creator-p38',
    },
    source: 'ADMIN_REVIEW',
    reasonCodes: ['POLICY_VIOLATION'],
    contentText: 'p38 moderation content',
    idempotencyKey: 'p38-mod-create',
  });
  if (!created.success || !created.caseId) {
    throw new Error('Moderation create failed');
  }

  const reviewed = await moderation.reviewModerationCase({
    caseId: created.caseId,
    decision: 'APPROVE',
    note: 'p38 review',
  });
  if (!reviewed.success) {
    throw new Error('Moderation review failed');
  }

  const repos = getAuditEventRepositories();
  const moderationLogs = await repos.audit.listAuditLogsByEntity('moderation', 'moderation_case', created.caseId);
  if (moderationLogs.length < 2) {
    throw new Error('Moderation audit records were not appended after truth write');
  }

  const context = {
    actorType: 'CUSTOMER' as const,
    actorId: 'p38-customer',
  };
  const checkout = {
    checkoutId: 'p38-checkout',
    cartContext: context,
    state: 'REVIEW_READY' as const,
    validationState: 'VALID' as const,
    lines: [{
      lineId: 'p38-line',
      productId: 'p38_product',
      storefrontId: 'p38_store',
      quantity: 1,
      validationState: 'VALID' as const,
      unitPrice: 120,
      lineTotal: 120,
      warnings: [],
      errors: [],
    }],
    summary: { totalQuantity: 1, subTotal: 120, grandTotal: 120, currency: 'TRY' },
    errors: [],
    warnings: [],
  };
  const checkoutRepository = {
    async save() {},
    async getById(checkoutId: string) {
      return checkoutId === checkout.checkoutId ? checkout : undefined;
    },
  };
  paymentCheckout.resetRepository(checkoutRepository);
  orderCheckout.resetRepository(checkoutRepository);

  const initiated = await payment.initiatePayment({
    checkoutId: checkout.checkoutId,
    cartContext: context,
    paymentMethod: 'CARD',
    idempotencyKey: 'p38-payment-init',
  });
  if (initiated.state !== 'INITIATED') {
    throw new Error(`Payment initiation failed: state=${initiated.state}, errors=${initiated.errors.join(',')}`);
  }

  const succeeded = await payment.simulatePaymentSuccess(initiated.attempt.paymentAttemptId);
  if (succeeded.state !== 'SUCCEEDED') {
    throw new Error('Payment success transition failed');
  }

  const paymentLogs = await repos.audit.listAuditLogsByEntity('payment', 'payment', initiated.paymentId);
  if (paymentLogs.length < 2) {
    throw new Error('Payment audit records were not appended after truth write');
  }

  const pendingBeforeOrder = await repos.outbox.listPendingOutboxEvents(100);
  const earlyOrderCreated = pendingBeforeOrder.find(event =>
    event.topic === 'order.created' &&
    event.payload.paymentId === initiated.paymentId
  );
  if (earlyOrderCreated) {
    throw new Error('order.created event exists before order truth write');
  }

  const orderCreated = await order.createOrderFromPayment({
    paymentId: initiated.paymentId,
    paymentAttemptId: initiated.attempt.paymentAttemptId,
    checkoutId: checkout.checkoutId,
    idempotencyKey: 'p38-order-create',
  });
  if (orderCreated.state !== 'CREATED') {
    throw new Error(`Order creation failed: ${orderCreated.errors.join(',')}`);
  }
  const loadedOrder = await order.getOrderById(orderCreated.orderId);
  if (!loadedOrder) {
    throw new Error('Order truth was not persisted');
  }

  const orderEvents = await repos.outbox.listPendingOutboxEvents(100);
  const orderCreatedEvent = orderEvents.find(event =>
    event.topic === 'order.created' &&
    event.entityId === orderCreated.orderId
  );
  if (!orderCreatedEvent) {
    throw new Error('order.created event missing after order truth write');
  }
  console.log('Moderation, payment, and order pilots validated.');
}

async function verifyInvalidConfig() {
  console.log('--- P38 Invalid Config ---');
  const originalMode = process.env.PERSISTENCE_MODE;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  process.env.PERSISTENCE_MODE = 'postgres';
  delete process.env.DATABASE_URL;
  resetAuditEventRepositories();

  try {
    getAuditEventRepositories();
    throw new Error('Expected postgres mode without DATABASE_URL to fail');
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('DATABASE_URL')) {
      throw error;
    }
  } finally {
    if (originalMode) process.env.PERSISTENCE_MODE = originalMode;
    else delete process.env.PERSISTENCE_MODE;
    if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
    else process.env.DATABASE_URL = defaultDatabaseUrl;
    resetAuditEventRepositories();
  }
  console.log('Invalid config behavior validated.');
}

async function verifyPostgresFoundation() {
  console.log('--- P38 Postgres Audit/Event Foundation ---');
  process.env.PERSISTENCE_MODE = 'postgres';
  process.env.DATABASE_URL = process.env.DATABASE_URL || defaultDatabaseUrl;
  resetAuditEventRepositories();

  const repos = getAuditEventRepositories();
  const entityId = `postgres-${Date.now()}`;
  const audit = await repos.audit.appendAuditLog({
    actorType: 'SYSTEM',
    actorId: 'p38-postgres',
    actionType: 'p38.postgres_audit',
    ownerService: 'persistence',
    entityType: 'smoke',
    entityId,
    metadata: { mode: 'postgres' },
  });
  const event = await repos.outbox.appendOutboxEvent({
    topic: 'p38.postgres_event',
    payloadSchema: 'p38.postgres_event.v1',
    payload: { ok: true },
    ownerService: 'persistence',
    entityType: 'smoke',
    entityId,
    idempotencyKey: `p38-postgres-event-${entityId}`,
  });
  const logs = await repos.audit.listAuditLogsByEntity('persistence', 'smoke', entityId);
  if (!audit.auditId || !event.eventId || logs.length !== 1) {
    throw new Error('Postgres audit/event append failed');
  }
  console.log('Postgres foundation append validated.');
}

async function run() {
  try {
    await verifyMemoryFoundation();
    await verifyPilotIntegrations();
    await verifyInvalidConfig();
    await verifyPostgresFoundation();
    await closePool();
    console.log('P38 smoke test completed successfully.');
  } catch (error) {
    console.error('P38 smoke test failed:', error);
    await closePool();
    process.exit(1);
  }
}

run();
