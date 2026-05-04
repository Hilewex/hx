import { 
  NotificationRecord, 
  CreateNotificationCommand, 
  NotificationListResponse,
  NotificationMutationResult
} from '@hx/contracts';

export type NotificationUIState = 
  | 'IDLE' 
  | 'CREATING' 
  | 'CREATED' 
  | 'LIST_LOADING' 
  | 'LIST_READY' 
  | 'MARKING_READ' 
  | 'READ' 
  | 'ARCHIVING' 
  | 'ARCHIVED' 
  | 'NOT_FOUND' 
  | 'ERROR';

export function renderNotificationShell(state: NotificationUIState, data?: any) {
  console.log(`[UI] Notification State: ${state}`, data ? data : '');
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`http://localhost:3000${path}`, options);
  return res.json();
}

export async function simulateNotificationFlow() {
  console.log('\n--- P19 NOTIFICATION SIMULATION START ---');

  // SCENARIO-1: Customer mandatory transaction notification
  renderNotificationShell('CREATING', 'Scenario 1: Customer Mandatory');
  const scenario1: CreateNotificationCommand = {
    actorType: 'CUSTOMER',
    actorId: 'usr_1',
    category: 'TRANSACTION',
    priority: 'MANDATORY',
    title: 'Siparişiniz Alındı',
    body: 'Siparişiniz başarıyla oluşturulmuştur.',
    idempotencyKey: 'idem_s1'
  };
  const res1: NotificationMutationResult = await apiFetch('/notification/create', {
    method: 'POST',
    body: JSON.stringify(scenario1)
  });
  renderNotificationShell('CREATED', res1);

  // SCENARIO-2: Creator social digest notification
  renderNotificationShell('CREATING', 'Scenario 2: Creator Social Digest');
  const scenario2: CreateNotificationCommand = {
    actorType: 'CREATOR',
    actorId: 'cre_1',
    category: 'SOCIAL',
    priority: 'DIGEST',
    title: 'Yeni Takipçi',
    body: 'Kanalınızı takip eden yeni kişiler var.',
    idempotencyKey: 'idem_s2'
  };
  const res2: NotificationMutationResult = await apiFetch('/notification/create', {
    method: 'POST',
    body: JSON.stringify(scenario2)
  });
  renderNotificationShell('CREATED', res2);

  // SCENARIO-3: Supplier critical operation notification
  renderNotificationShell('CREATING', 'Scenario 3: Supplier Critical Operation');
  const scenario3: CreateNotificationCommand = {
    actorType: 'SUPPLIER',
    actorId: 'sup_1',
    category: 'OPERATION',
    priority: 'CRITICAL',
    title: 'Stok Uyarısı',
    body: 'Kritik stok seviyesine ulaşıldı.',
    idempotencyKey: 'idem_s3'
  };
  const res3: NotificationMutationResult = await apiFetch('/notification/create', {
    method: 'POST',
    body: JSON.stringify(scenario3)
  });
  renderNotificationShell('CREATED', res3);

  // SCENARIO-4: Duplicate idempotency
  renderNotificationShell('CREATING', 'Scenario 4: Duplicate Idempotency');
  const res4: NotificationMutationResult = await apiFetch('/notification/create', {
    method: 'POST',
    body: JSON.stringify(scenario1) // reusing scenario1
  });
  console.log('[Simulation] Duplicate Check:', res1.record?.notificationId === res4.record?.notificationId ? 'PASS' : 'FAIL');

  // SCENARIO-5: Actor list / unread count
  renderNotificationShell('LIST_LOADING', 'Scenario 5: Customer List');
  const listRes: NotificationListResponse = await apiFetch('/notification/list?actorType=CUSTOMER&actorId=usr_1');
  renderNotificationShell('LIST_READY', listRes);

  const ntf = listRes.items[0];

  // SCENARIO-6: Mark read
  if (ntf) {
    renderNotificationShell('MARKING_READ', ntf.notificationId);
    const readRes: NotificationMutationResult = await apiFetch('/notification/read', {
      method: 'POST',
      body: JSON.stringify({ notificationId: ntf.notificationId })
    });
    renderNotificationShell('READ', readRes);
  }

  // SCENARIO-7: Archive
  if (ntf) {
    renderNotificationShell('ARCHIVING', ntf.notificationId);
    const archiveRes: NotificationMutationResult = await apiFetch('/notification/archive', {
      method: 'POST',
      body: JSON.stringify({ notificationId: ntf.notificationId })
    });
    renderNotificationShell('ARCHIVED', archiveRes);
  }

  // SCENARIO-8: Unknown notification
  renderNotificationShell('IDLE', 'Scenario 8: Unknown Notification');
  const unknownRes = await apiFetch('/notification/ntf_unknown');
  renderNotificationShell('NOT_FOUND', unknownRes);

  // SCENARIO-9: Provider channel warning
  renderNotificationShell('CREATING', 'Scenario 9: Provider Channel Warning');
  const scenario9: CreateNotificationCommand = {
    actorType: 'CUSTOMER',
    actorId: 'usr_1',
    category: 'SECURITY',
    priority: 'CRITICAL',
    title: 'Giriş Yapıldı',
    body: 'Hesabınıza yeni bir cihazdan giriş yapıldı.',
    channels: ['IN_APP', 'PUSH', 'EMAIL']
  };
  const res9: NotificationMutationResult = await apiFetch('/notification/create', {
    method: 'POST',
    body: JSON.stringify(scenario9)
  });
  renderNotificationShell('CREATED', res9);

  console.log('--- P19 NOTIFICATION SIMULATION END ---\n');
}
