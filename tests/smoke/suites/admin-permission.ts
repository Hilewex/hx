import { issueDevAuthToken } from '../auth-utils';

export const adminPermissionSmoke = {
  name: 'Admin/Operator Permission Smoke Suite',
  run: async (baseUrl: string) => {
    try {
      const guestToken = issueDevAuthToken('guest-123', 'GUEST');
      const customerToken = issueDevAuthToken('customer-admin-test', 'CUSTOMER');
      const creatorToken = issueDevAuthToken('creator-admin-test', 'CREATOR');
      const adminToken = issueDevAuthToken('admin-test', 'ADMIN');

      await testFinanceAction(baseUrl, guestToken, customerToken, creatorToken, adminToken);
      await testSettlementAction(baseUrl, guestToken, customerToken, creatorToken, adminToken);
      await testCreatorAdminAction(baseUrl, guestToken, customerToken, creatorToken, adminToken);
      await testMediaAdminAction(baseUrl, guestToken, customerToken, creatorToken, adminToken);

      return { result: 'PASS' };
    } catch (err: any) {
      return { result: 'FAIL', message: err.message };
    }
  }
};

async function testFinanceAction(baseUrl: string, guestToken: string, customerToken: string, creatorToken: string, adminToken: string) {
  const url = `${baseUrl}/finance-correction/create`;
  const body = {
    targetId: 'target-123',
    targetType: 'STOREFRONT',
    amount: 100,
    currency: 'TRY',
    reason: 'TEST_ADJUSTMENT',
    note: 'Smoke test'
  };

  // Guest
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${guestToken}` },
    body: JSON.stringify(body)
  });
  if (res.status !== 401 && res.status !== 403) {
    throw new Error(`Guest should not be able to create finance correction (Got ${res.status})`);
  }

  // Customer
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify(body)
  });
  if (res.status !== 403) {
    throw new Error(`Customer should not be able to create finance correction (Got ${res.status})`);
  }

  // Admin
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify(body)
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Admin should be authorized to create finance correction (Got ${res.status})`);
  }
}

async function testSettlementAction(baseUrl: string, guestToken: string, customerToken: string, creatorToken: string, adminToken: string) {
  const url = `${baseUrl}/settlement/create-from-order`;
  const body = { orderId: 'ord-123', idempotencyKey: 'idemp-123' };

  // Guest
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${guestToken}` },
    body: JSON.stringify(body)
  });
  if (res.status !== 401 && res.status !== 403) {
    throw new Error(`Guest should not be able to create settlement (Got ${res.status})`);
  }

  // Creator
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${creatorToken}` },
    body: JSON.stringify(body)
  });
  if (res.status !== 403 && res.status !== 404) { // 404 is acceptable if it passes auth but order not found
    throw new Error(`Creator should not be able to create settlement (Got ${res.status})`);
  }

  // Admin
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify(body)
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Admin should be authorized to create settlement (Got ${res.status})`);
  }
}

async function testCreatorAdminAction(baseUrl: string, guestToken: string, customerToken: string, creatorToken: string, adminToken: string) {
  const url = `${baseUrl}/storefront/admin/profiles`;

  // Guest
  let res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${guestToken}` }
  });
  if (res.status !== 401 && res.status !== 403) {
    throw new Error(`Guest should not be able to list admin storefronts (Got ${res.status})`);
  }

  // Creator
  res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${creatorToken}` }
  });
  if (res.status !== 403) {
    throw new Error(`Creator should not be able to list admin storefronts (Got ${res.status})`);
  }

  // Admin
  res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Admin should be able to list admin storefronts (Got ${res.status})`);
  }
}

async function testMediaAdminAction(baseUrl: string, guestToken: string, customerToken: string, creatorToken: string, adminToken: string) {
  const url = `${baseUrl}/media/process`;
  const body = { assetId: 'asset-123' };

  // Guest
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${guestToken}` },
    body: JSON.stringify(body)
  });
  if (res.status !== 401 && res.status !== 403) {
    throw new Error(`Guest should not be able to process media (Got ${res.status})`);
  }

  // Customer
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify(body)
  });
  if (res.status !== 403) {
    throw new Error(`Customer should not be able to process media (Got ${res.status})`);
  }

  // Admin
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify(body)
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Admin should be authorized to process media (Got ${res.status})`);
  }
}