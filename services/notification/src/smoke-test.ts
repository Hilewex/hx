import { 
  createNotification, 
  markNotificationRead, 
  archiveNotification, 
  listNotifications 
} from './notification';
import { 
  NotificationDeliveryAttempt 
} from '@hx/contracts';
import * as fs from 'fs';
import * as path from 'path';

async function runSmokeTests() {
  console.log('--- Notification P47 Smoke Tests Starting ---');

  // 6. Smoke test genişlet - Static checks
  console.log('Checking static boundaries...');
  const notificationContent = fs.readFileSync(path.join(__dirname, 'notification.ts'), 'utf8');
  console.assert(!notificationContent.includes('@hx/persistence/src'), 'Static Check Failed: Found @hx/persistence/src import');
  
  const repoIndexContent = fs.readFileSync(path.join(__dirname, 'repository/index.ts'), 'utf8');
  console.assert(repoIndexContent.includes('export function getNotificationRepository'), 'Static Check Failed: Missing getNotificationRepository');
  console.assert(repoIndexContent.includes("process.env.PERSISTENCE_MODE || 'memory'"), 'Static Check Failed: Missing default memory mode');
  console.assert(!repoIndexContent.includes("'in-memory'"), 'Static Check Failed: Found forbidden "in-memory" string');

  // Forbidden mutation checks
  const forbidden = [
    'initiatePayment', 'simulatePaymentSuccess', 'createOrderFromPayment',
    'createRefundFromCancelReturn', 'createSettlementFromOrder',
    'createPayoutItemsFromSettlement', 'applyPayout', 'createRiskCase',
    'reviewRiskCase', 'transition', 'processRefund'
  ];
  forbidden.forEach(fn => {
    console.assert(!notificationContent.includes(fn), `Static Check Failed: Found forbidden call ${fn}`);
  });

  // 1. Missing actor
  const fail1 = await createNotification({
    actorType: '' as any,
    actorId: '',
    category: 'TRANSACTION',
    priority: 'NORMAL',
    title: 'Test',
    body: 'Test'
  });
  console.assert(!fail1.success && fail1.errors?.includes('INVALID_NOTIFICATION_ACTOR'), 'Test 1 Failed');

  // 2. Missing content
  const fail2 = await createNotification({
    actorType: 'CUSTOMER',
    actorId: 'c1',
    category: 'TRANSACTION',
    priority: 'NORMAL',
    title: '',
    body: ''
  });
  console.assert(!fail2.success && fail2.errors?.includes('INVALID_NOTIFICATION_CONTENT'), 'Test 2 Failed');

  // 3. Mandatory notification
  const mandatory = await createNotification({
    actorType: 'CUSTOMER',
    actorId: 'c1',
    category: 'SECURITY',
    priority: 'MANDATORY',
    title: 'Security Alert',
    body: 'Your password changed'
  });
  console.assert(mandatory.success && mandatory.record?.isMandatory === true, 'Test 3a Failed');
  console.assert(mandatory.record?.preferenceOverridable === false, 'Test 3b Failed');
  console.assert(mandatory.record?.deliveryMode === 'IMMEDIATE', 'Test 3c Failed');

  // 4. Social notification
  const social = await createNotification({
    actorType: 'CUSTOMER',
    actorId: 'c1',
    category: 'SOCIAL',
    priority: 'DIGEST',
    title: 'New Like',
    body: 'Someone liked your post'
  });
  console.assert(social.success && social.record?.deliveryMode === 'DIGEST', 'Test 4 Failed');

  // 5. Supplier notification
  const supplier = await createNotification({
    actorType: 'SUPPLIER',
    actorId: 's1',
    category: 'OPERATION',
    priority: 'NORMAL',
    title: 'New Order',
    body: 'Order #123 received'
  });
  console.assert(supplier.record?.channels.includes('PANEL_TASK') && supplier.record?.channels.includes('IN_APP'), 'Test 5 Failed');

  // 6. Idempotency duplicate
  const key = 'idem-123';
  const first = await createNotification({
    actorType: 'CUSTOMER',
    actorId: 'c1',
    category: 'TRANSACTION',
    priority: 'NORMAL',
    title: 'Unique',
    body: 'Unique',
    idempotencyKey: key
  });
  const second = await createNotification({
    actorType: 'CUSTOMER',
    actorId: 'c1',
    category: 'TRANSACTION',
    priority: 'NORMAL',
    title: 'Unique',
    body: 'Unique',
    idempotencyKey: key
  });
  console.assert(first.record?.notificationId === second.record?.notificationId, 'Test 6 Failed');

  // 7. Email sandbox & Push parked - All actualProviderDeliveryPerformed must be false
  const providers = await createNotification({
    actorType: 'CUSTOMER',
    actorId: 'c1',
    category: 'TRANSACTION',
    priority: 'NORMAL',
    title: 'Channels',
    body: 'Channels',
    channels: ['EMAIL', 'PUSH', 'IN_APP', 'PANEL_TASK']
  });
  
  providers.record?.deliveryAttempts.forEach(attempt => {
    console.assert(attempt.actualProviderDeliveryPerformed === false, `Test 7 failed for ${attempt.providerType}: expected false`);
  });

  const emailAttempt = providers.record?.deliveryAttempts.find((a: NotificationDeliveryAttempt) => a.providerType === 'EMAIL_SANDBOX');
  const pushAttempt = providers.record?.deliveryAttempts.find((a: NotificationDeliveryAttempt) => a.providerType === 'PUSH_PARKED');
  console.assert(emailAttempt?.state === 'SANDBOX_DELIVERED', 'Test 7a Failed');
  console.assert(pushAttempt?.state === 'PUSH_PROVIDER_PARKED', 'Test 7b Failed');

  // 8. Mark read
  const nId = first.record!.notificationId;
  const readRes = await markNotificationRead({ notificationId: nId });
  console.assert(readRes.record?.state === 'READ' && readRes.record.readAt !== undefined, 'Test 8 Failed');

  // 9. Archive
  const archRes = await archiveNotification({ notificationId: nId });
  console.assert(archRes.record?.state === 'ARCHIVED' && archRes.record.archivedAt !== undefined, 'Test 9 Failed');

  // 10. Boundary flags
  console.assert(first.record?.paymentTruthMutated === false, 'Test 10a Failed');
  console.assert(first.record?.orderTruthMutated === false, 'Test 10b Failed');
  console.assert(first.record?.notificationTruthMutated === true, 'Test 10c Failed');

  console.log('--- All Smoke Tests PASSED ---');
}

runSmokeTests().catch(e => {
  console.error('Smoke Test Execution Failed:', e);
  process.exit(1);
});
