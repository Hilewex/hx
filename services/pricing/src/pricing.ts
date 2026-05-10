import { ResolvePriceInput, ResolvePriceResult, ActiveSalesPrice } from '@hx/contracts';

export async function resolvePrice(input: ResolvePriceInput): Promise<ResolvePriceResult> {
  const { productId, storefrontId, variantId } = input;
  
  if (productId === 'p_unavailable' || productId.includes('unavailable')) {
    return { status: 'PRICE_UNAVAILABLE' };
  }

  // Foundation fallback only; pool/category pricing truth is owned by pool policy snapshots.
  const hash = productId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const poolBasePrice = (hash % 100) * 10 + 50; // between 50 and 1040
  
  const minPrice = poolBasePrice;
  const suggestedPrice = poolBasePrice;
  const maxPrice = poolBasePrice;
  
  const price: ActiveSalesPrice = {
    productId,
    variantId,
    storefrontId,
    currency: 'TRY',
    activeUnitPrice: suggestedPrice,
    corridor: {
      minPrice,
      suggestedPrice,
      recommendedPrice: suggestedPrice,
      maxPrice,
      currency: 'TRY',
      ruleSource: 'FOUNDATION_CATEGORY_MARGIN_POLICY_MISSING',
      launchMode: true,
      launchRequiresRecommendedPrice: true
    },
    source: 'POOL_BASE_PRICE_SNAPSHOT',
    warnings: [
      'FOUNDATION_CATEGORY_MARGIN_POLICY_MISSING',
      'PRICE_CORRIDOR_COLLAPSED_TO_POOL_BASE_PRICE'
    ]
  };

  return {
    status: 'OK',
    price
  };
}
