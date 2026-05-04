import { PdpResponse } from '@hx/contracts';

export type PdpViewState = 
  | { state: 'LOADING' }
  | { state: 'ERROR'; error: 'NOT_FOUND' | 'UNAVAILABLE' | 'SYSTEM_ERROR' }
  | { state: 'SUCCESS'; data: PdpResponse };

export function renderPdpShell(viewState: PdpViewState) {
  switch (viewState.state) {
    case 'LOADING':
      console.log('[Web PDP] Rendering Loading Skeleton...');
      break;
    case 'ERROR':
      if (viewState.error === 'NOT_FOUND') {
        console.log('[Web PDP] Rendering 404 Not Found Page');
      } else if (viewState.error === 'UNAVAILABLE') {
        console.log('[Web PDP] Rendering Product Unavailable / Discontinued Notice');
      } else {
        console.log('[Web PDP] Rendering Generic Error Fallback');
      }
      break;
    case 'SUCCESS':
      const { product, storefrontContext } = viewState.data;
      console.log(`[Web PDP] Rendering Product: ${product.name} (${product.brand})`);
      
      // Storefront Context alignment
      console.log(`[Web PDP] Storefront Context: ${storefrontContext.name}`);
      if (storefrontContext.creatorNote) {
        console.log(`[Web PDP] Creator's Note: ${storefrontContext.creatorNote}`);
      }

      // Commercial Projections
      if (product.price) {
        console.log(`[Web PDP] Price: ${product.price.current} ${product.price.currency} (Was: ${product.price.original})`);
      }
      if (product.stock) {
        console.log(`[Web PDP] Stock Status: ${product.stock.status} - ${product.stock.label || ''}`);
      }

      console.log(`[Web PDP] Rendering ${product.media.length} media items placeholder`);
      console.log(`[Web PDP] Rendering ${product.variants.length} variants placeholder`);
      break;
  }
}

export function simulatePdpLoad(productId: string, storefrontId: string = 's_feno_1'): PdpViewState {
  // In a real app, this would fetch from BFF with storefrontId
  if (productId === 'p_valid') {
    return { 
      state: 'SUCCESS', 
      data: { 
        product: {
          productId: 'p_valid', slug: 'valid', name: 'Valid', brand: 'HX', status: 'ACTIVE',
          description: 'Desc', categories: [], media: [], variants: [],
          price: { current: 100, currency: 'TRY' },
          stock: { status: 'IN_STOCK' }
        },
        storefrontContext: {
          storefrontId: storefrontId,
          name: 'Mock Store'
        }
      }
    };
  }
  if (productId === 'p_unavailable') {
    return { state: 'ERROR', error: 'UNAVAILABLE' };
  }
  return { state: 'ERROR', error: 'NOT_FOUND' };
}
