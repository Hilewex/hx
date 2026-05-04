import { SmokeRunner, SmokeResult } from '../types';
import { issueDevAuthToken } from '../auth-utils';

export const authPermissionSmoke: SmokeRunner = {
  name: 'auth-permission',
  run: async (baseUrl: string): Promise<{ result: SmokeResult; message?: string }> => {
    let passed = 0;
    let failed = 0;
    const errors: string[] = [];

    function assert(condition: boolean, msg: string) {
      if (condition) {
        passed++;
      } else {
        errors.push(`FAIL: ${msg}`);
        failed++;
      }
    }

    try {
      // --- Tokens ---
      const customer1Token = issueDevAuthToken('customer-1', 'CUSTOMER');
      const customer2Token = issueDevAuthToken('customer-2', 'CUSTOMER');
      const creator1Token = issueDevAuthToken('creator-1', 'CREATOR');

      // 1. Customer: Guest protected mutation -> 401
      const guestCustomerRes = await fetch(`${baseUrl}/customer/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Guest', lastName: 'User' })
      });
      assert(guestCustomerRes.status === 401, `Guest profile creation is unauthorized (expected 401, got ${guestCustomerRes.status})`);

      // 2. Customer: Ownership mismatch -> 403
      const c1UpdateC2Res = await fetch(`${baseUrl}/customer/profile/customer-2`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customer1Token}` },
        body: JSON.stringify({ firstName: 'Hacked' })
      });
      assert(c1UpdateC2Res.status === 403, `Customer 1 cannot update Customer 2 profile (expected 403, got ${c1UpdateC2Res.status})`);

      // 3. Post: Guest post create -> 401
      const guestPostRes = await fetch(`${baseUrl}/post/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storefrontId: 'sf-1', postType: 'STORE_UPDATE', title: 'Hello', body: 'World' })
      });
      assert(guestPostRes.status === 401, `Guest post creation is unauthorized (expected 401, got ${guestPostRes.status})`);

      // 4. Post: Customer post create -> 403
      const customerPostRes = await fetch(`${baseUrl}/post/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customer1Token}` },
        body: JSON.stringify({ storefrontId: 'sf-1', postType: 'STORE_UPDATE', title: 'Hello', body: 'World' })
      });
      assert(customerPostRes.status === 403, `Customer post creation is forbidden (expected 403, got ${customerPostRes.status})`);

      // 5. UGC: Guest UGC create -> 401
      const guestUgcRes = await fetch(`${baseUrl}/ugc/user-product-story/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'p-1', rating: 5 })
      });
      assert(guestUgcRes.status === 401, `Guest UGC creation is unauthorized (expected 401, got ${guestUgcRes.status})`);

      // 6. UGC: Creator UGC create -> 403
      const creatorUgcRes = await fetch(`${baseUrl}/ugc/user-product-story/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${creator1Token}` },
        body: JSON.stringify({ productId: 'p-1', rating: 5 })
      });
      assert(creatorUgcRes.status === 403, `Creator UGC creation is forbidden (expected 403, got ${creatorUgcRes.status})`);

      // 7. Media: Guest upload -> 401
      const guestMediaRes = await fetch(`${baseUrl}/media/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerType: 'UGC', ownerId: 'u-1', mediaType: 'IMAGE', sourceType: 'USER_UPLOAD', fileName: 'test.jpg', mimeType: 'image/jpeg', fileSizeBytes: 100 })
      });
      assert(guestMediaRes.status === 401, `Guest media upload is unauthorized (expected 401, got ${guestMediaRes.status})`);

      // 8. Media: Actor/source mismatch -> 403
      const mismatchMediaRes = await fetch(`${baseUrl}/media/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customer1Token}` },
        body: JSON.stringify({ ownerType: 'STOREFRONT', ownerId: 's-1', mediaType: 'IMAGE', sourceType: 'CREATOR_PANEL', fileName: 'test.jpg', mimeType: 'image/jpeg', fileSizeBytes: 100 })
      });
      assert(mismatchMediaRes.status === 403, `Customer cannot use CREATOR_PANEL source (expected 403, got ${mismatchMediaRes.status})`);

      if (failed > 0) {
        return { result: 'FAIL', message: errors.join(', ') };
      }

      return { result: 'PASS', message: `${passed} permission checks passed` };
    } catch (e: any) {
      return { result: 'FAIL', message: `Auth Permission Smoke Exception: ${e.message}` };
    }
  }
};

