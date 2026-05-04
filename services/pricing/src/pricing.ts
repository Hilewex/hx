import { ResolvePriceInput, ResolvePriceResult, ActiveSalesPrice } from '@hx/contracts';

export async function resolvePrice(input: ResolvePriceInput): Promise<ResolvePriceResult> {
  const { productId, storefrontId, variantId } = input;
  
  if (productId === 'p_unavailable' || productId.includes('unavailable')) {
    return { status: 'PRICE_UNAVAILABLE' };
  }

  // Deterministic in-memory base price simulation
  const hash = productId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const basePrice = (hash % 100) * 10 + 50; // between 50 and 1040
  
  const platformMarginRate = 0.20; // 20% platform margin
  const poolBasePrice = basePrice * (1 + platformMarginRate);
  
  // Corridor simulation
  const minPrice = Math.round(poolBasePrice * 0.9);
  const suggestedPrice = Math.round(poolBasePrice * 1.1);
  const maxPrice = Math.round(poolBasePrice * 1.5);
  
  const price: ActiveSalesPrice = {
    productId,
    variantId,
    storefrontId,
    currency: 'TRY',
    activeUnitPrice: suggestedPrice,
    corridor: {
      minPrice,
      suggestedPrice,
      maxPrice
    },
    source: 'FOUNDATION_SIMULATED',
    warnings: []
  };

  return {
    status: 'OK',
    price
  };
}
