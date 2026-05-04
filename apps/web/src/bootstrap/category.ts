import { config } from '../config';
import { CategoryListResponse, CategoryDetailResponse } from '@hx/contracts';

export async function simulateCategoryFlow() {
  console.log('\n--- Category Flow Simulation ---');

  // 1. List ACTIVE categories
  console.log('Listing active categories...');
  const listRes: CategoryListResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/category/list`)
    .then(r => r.json());
  console.log(`Found ${listRes.items.length} active categories.`);
  console.log('Warnings:', listRes.warnings);

  // 2. Hidden category check (should not be in the default list)
  const hasHidden = listRes.items.some(c => c.slug === 'hidden');
  console.log('Hidden category in list?', hasHidden ? 'YES (Error)' : 'NO (Success)');

  // 3. Get category detail - Success case
  console.log('Getting electronics category detail...');
  const detailRes: CategoryDetailResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/category/detail?slug=electronics`)
    .then(r => r.json());
  if (detailRes.category) {
    console.log(`Success: ${detailRes.category.name} found.`);
  }
  console.log('Detail Warnings:', detailRes.warnings);

  // 4. Get category detail - Unknown case
  console.log('Getting unknown category detail...');
  const unknownRes: CategoryDetailResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/category/detail?slug=unknown`)
    .then(r => r.json());
  console.log('Unknown category status:', unknownRes.errors?.includes('CATEGORY_NOT_FOUND') ? '404 (Success)' : 'Error');

  // 5. Get hidden category detail - visibility check
  console.log('Getting hidden category detail (direct access)...');
  const hiddenDetailRes: CategoryDetailResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/category/detail?slug=hidden`)
    .then(r => r.json());
  console.log('Hidden category detail warnings:', hiddenDetailRes.warnings);
}
