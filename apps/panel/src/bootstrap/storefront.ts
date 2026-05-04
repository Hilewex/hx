import { 
  createCreatorStorefront,
  updateCreatorStorefrontProfile,
  getCreatorStorefront,
  getCreatorStorefrontBySlug,
  listCreatorStorefronts,
  suspendCreatorStorefront,
  reactivateCreatorStorefront
} from '@hx/service-storefront';
import { StorefrontVisibility, StorefrontErrorCode } from '@hx/contracts';

async function smokeTest() {
  console.log('🚀 Starting Storefront Identity Smoke Test (Service Level)\n');

  const creator1Id = 'creator_1';
  const creator2Id = 'creator_2';

  // 1. Creator create profile
  console.log('--- 1. Creator Create Profile ---');
  const createResult = await createCreatorStorefront({
    creatorId: creator1Id,
    slug: 'fayton-store',
    title: 'Fayton Store',
    bio: 'Best store ever'
  });
  console.log('Create Result:', JSON.stringify(createResult, null, 2));
  
  if (!createResult.success) throw new Error('Create failed');
  const storefrontId = createResult.data.id;

  // 2. Creator update own profile
  console.log('\n--- 2. Creator Update Own Profile ---');
  const updateResult = await updateCreatorStorefrontProfile({
    storefrontId,
    creatorId: creator1Id,
    title: 'Fayton Store Updated'
  });
  console.log('Update Own Result:', JSON.stringify(updateResult, null, 2));

  // 3. Creator update other profile fail
  console.log('\n--- 3. Creator Update Other Profile (Fail) ---');
  const updateOtherResult = await updateCreatorStorefrontProfile({
    storefrontId,
    creatorId: creator2Id,
    title: 'Hacked Title'
  });
  console.log('Update Other Result:', JSON.stringify(updateOtherResult, null, 2));

  // 4. Public active storefront by slug pass
  console.log('\n--- 4. Public Active Storefront Pass ---');
  const publicGetResult = await getCreatorStorefrontBySlug('fayton-store');
  console.log('Public Get Result:', JSON.stringify(publicGetResult, null, 2));

  // 5. Hidden storefront public fail
  console.log('\n--- 5. Hidden Storefront Public Fail ---');
  await updateCreatorStorefrontProfile({
    storefrontId,
    creatorId: creator1Id,
    visibility: StorefrontVisibility.HIDDEN
  });
  const hiddenGetResult = await getCreatorStorefrontBySlug('fayton-store');
  console.log('Public Get Hidden Result (should be error):', JSON.stringify(hiddenGetResult, null, 2));

  // 6. Admin suspend
  console.log('\n--- 6. Admin Suspend ---');
  await updateCreatorStorefrontProfile({
    storefrontId,
    creatorId: creator1Id,
    visibility: StorefrontVisibility.PUBLIC
  });
  const suspendResult = await suspendCreatorStorefront({
    storefrontId,
    reason: 'Policy violation'
  });
  console.log('Admin Suspend Result:', JSON.stringify(suspendResult, null, 2));

  // 7. Suspended storefront public fail
  console.log('\n--- 7. Suspended Storefront Public Fail ---');
  const suspendedGetResult = await getCreatorStorefrontBySlug('fayton-store');
  console.log('Public Get Suspended Result (should be error):', JSON.stringify(suspendedGetResult, null, 2));

  // 8. Admin reactivate
  console.log('\n--- 8. Admin Reactivate ---');
  const reactivateResult = await reactivateCreatorStorefront({
    storefrontId
  });
  console.log('Admin Reactivate Result:', JSON.stringify(reactivateResult, null, 2));

  // 9. Public active storefront pass
  console.log('\n--- 9. Public Active Storefront Pass Again ---');
  const finalGetResult = await getCreatorStorefrontBySlug('fayton-store');
  console.log('Public Get Final Result:', JSON.stringify(finalGetResult, null, 2));

  console.log('\n✅ Storefront Identity Smoke Test Completed');
}

smokeTest().catch(console.error);
