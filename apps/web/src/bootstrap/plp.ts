import { config } from '../config';
import { PlpResponse } from '@hx/contracts';

export async function simulatePlpFlow() {
  console.log('\n--- PLP Flow Simulation ---');

  // 1. Get PLP for electronics
  console.log('Loading PLP for electronics...');
  const plpRes: PlpResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/plp?slug=electronics`)
    .then(r => r.json());
  
  if (plpRes.category) {
    console.log(`Success: Loaded PLP for ${plpRes.category.name}`);
    console.log(`Found ${plpRes.productCards.length} products.`);
    
    // Check classic card projection
    if (plpRes.productCards.length > 0) {
      const card = plpRes.productCards[0];
      console.log('Card canShare:', card.actions.canShare === false ? 'FALSE (Success)' : 'TRUE (Error)');
      console.log('Card Truth:', card.cardTruth === false ? 'FALSE (Success)' : 'TRUE (Error)');
    }

    // Check hidden/unavailable products
    const hasHiddenOrUnavailable = plpRes.productCards.some(p => p.productId === 'p_hidden' || p.productId === 'p_unavailable');
    console.log('Hidden/Unavailable products in PLP?', hasHiddenOrUnavailable ? 'YES (Error)' : 'NO (Success)');
  }
  console.log('PLP Warnings:', plpRes.warnings);

  // 2. Get PLP for fashion (video rail check)
  console.log('\nLoading PLP for fashion (checking video rail)...');
  const fashionRes: PlpResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/plp?slug=fashion`)
    .then(r => r.json());
  
  if (fashionRes.videoRail && fashionRes.videoRail.length > 0) {
    console.log(`Found ${fashionRes.videoRail.length} items in video rail.`);
    const videoItem = fashionRes.videoRail[0];
    console.log('Video Rail supportOnly:', videoItem.supportOnly === true ? 'TRUE (Success)' : 'FALSE (Error)');
    console.log('Video Rail discoveryFeed:', videoItem.discoveryFeed === false ? 'FALSE (Success)' : 'TRUE (Error)');
  }

  // 3. Get PLP for unknown category
  console.log('\nLoading PLP for unknown category...');
  const unknownRes: PlpResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/plp?slug=unknown`)
    .then(r => r.json());
  console.log('Unknown PLP emptyState code:', unknownRes.emptyState?.code === 'CATEGORY_NOT_FOUND' ? 'CATEGORY_NOT_FOUND (Success)' : 'Error');

  // 4. Get PLP with sort
  console.log('\nLoading PLP with PRICE_ASC sort...');
  const sortedRes: PlpResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/plp?slug=electronics&sort=PRICE_ASC`)
    .then(r => r.json());
  console.log('Active sort:', sortedRes.activeSort);

  // 5. Get PLP with video filter
  console.log('\nLoading PLP with video filter...');
  const filteredRes: PlpResponse = await fetch(`${config.NEXT_PUBLIC_BFF_URL}/plp?slug=fashion&filters=%7B"video_available":true%7D`)
    .then(r => r.json());
  console.log(`Filtered PLP found ${filteredRes.productCards.length} products.`);
}
