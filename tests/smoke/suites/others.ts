import { SmokeRunner, SmokeResult } from '../types';
import { socialSmoke } from './social';
import { issueDevAuthToken } from '../auth-utils';

export { socialSmoke };

export const commerceSmoke: SmokeRunner = {
  name: 'commerce',
  run: async (baseUrl: string) => {
    try {
      const actorId = `smoke-cart-${Date.now()}`;
      const customerToken = issueDevAuthToken(actorId, 'CUSTOMER');
      
      const addToCartRes = await fetch(`${baseUrl}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          productId: 'p_valid',
          variantId: 'v_1',
          storefrontId: 's_feno_1',
          quantity: 2
        })
      });

      if (!addToCartRes.ok) {
        return { result: 'FAIL', message: `POST /cart/items failed: ${addToCartRes.status}` };
      }
      const addToCartBody: any = await addToCartRes.json();
      const cartData = addToCartBody.data?.data;
      if (!cartData?.lines?.length || cartData.errors?.length) {
        return { result: 'FAIL', message: `POST /cart/items did not create a valid cart line: ${JSON.stringify(addToCartBody)}` };
      }

      const getCartRes = await fetch(`${baseUrl}/cart`, {
        headers: {
          'Authorization': `Bearer ${customerToken}`
        }
      });

      if (!getCartRes.ok) {
        return { result: 'FAIL', message: `GET /cart failed: ${getCartRes.status}` };
      }
      const getCartBody: any = await getCartRes.json();
      if (!getCartBody.data?.data?.lines?.length) {
        return { result: 'FAIL', message: 'GET /cart returned no cart lines after add' };
      }

      return { result: 'PASS', message: 'Cart operations successful' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};

export const customerSmoke: SmokeRunner = {
  name: 'customer',
  run: async (baseUrl: string) => {
    try {
      const actorId = `smoke-customer-${Date.now()}`;
      const customerToken = issueDevAuthToken(actorId, 'CUSTOMER');
      
      const createRes = await fetch(`${baseUrl}/customer/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          id: actorId,
          firstName: 'Smoke',
          lastName: 'Tester',
          email: `${actorId}@example.com`,
          phone: '+905550000000',
          locale: 'tr-TR',
          currency: 'TRY'
        })
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        return { result: 'FAIL', message: `Customer creation failed: ${createRes.status} - ${err}` };
      }

      const createData: any = await createRes.json();
      const profileId = createData.data?.id;

      if (!profileId) {
        return { result: 'FAIL', message: 'Customer creation succeeded but no ID returned' };
      }

      const getRes = await fetch(`${baseUrl}/customer/profile/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${customerToken}`
        }
      });

      if (!getRes.ok) {
        return { result: 'FAIL', message: `Customer retrieval failed: ${getRes.status}` };
      }

      return { result: 'PASS', message: `Customer creation and retrieval successful (ID: ${profileId})` };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};

export const storefrontSmoke: SmokeRunner = {
  name: 'storefront',
  run: async (baseUrl: string) => {
    try {
      const actorId = `smoke-creator-${Date.now()}`;
      const creatorToken = issueDevAuthToken(actorId, 'CREATOR');
      
      const createRes = await fetch(`${baseUrl}/storefront/creator/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`
        },
        body: JSON.stringify({
          handle: `smoke-${Date.now()}`,
          name: 'Smoke Store',
          description: 'Smoke test store'
        })
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        return { result: 'FAIL', message: `Storefront creation failed: ${createRes.status} - ${err}` };
      }

      const createData: any = await createRes.json();
      const storefrontId = createData.data?.id;

      if (!storefrontId) {
        return { result: 'FAIL', message: 'Storefront creation succeeded but no ID returned' };
      }

      const getRes = await fetch(`${baseUrl}/storefront/creator/profile/${storefrontId}`, {
        headers: {
          'Authorization': `Bearer ${creatorToken}`
        }
      });

      if (!getRes.ok) {
        return { result: 'FAIL', message: `Storefront retrieval failed: ${getRes.status}` };
      }

      return { result: 'PASS', message: `Storefront creation and retrieval successful (ID: ${storefrontId})` };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};

export const catalogSmoke: SmokeRunner = {
  name: 'catalog',
  run: async (baseUrl: string) => {
    try {
      const readJson = async (res: Response): Promise<any> => {
        try {
          return await res.json();
        } catch {
          return {};
        }
      };

      const activePdpRes = await fetch(`${baseUrl}/catalog/pdp/p_valid?storefrontId=s_feno_1`);
      const activePdpBody = await readJson(activePdpRes);
      if (!activePdpRes.ok) {
        return { result: 'FAIL', message: `Active PDP failed: ${activePdpRes.status}` };
      }
      const pdpProduct = activePdpBody.data?.product;
      if (!pdpProduct || pdpProduct.productId !== 'p_valid') {
        return { result: 'FAIL', message: 'Active PDP did not return expected product projection' };
      }
      if (
        pdpProduct.catalogReadTruth !== false ||
        pdpProduct.productTruthMutated !== false ||
        pdpProduct.searchIndexTruth !== false ||
        pdpProduct.priceTruth !== false ||
        pdpProduct.stockTruth !== false ||
        pdpProduct.mediaTruth !== false
      ) {
        return { result: 'FAIL', message: 'PDP product missing owner boundary flags' };
      }
      if ('price' in pdpProduct || 'stock' in pdpProduct) {
        return { result: 'FAIL', message: 'PDP exposed price/stock truth from BFF/catalog' };
      }

      const hiddenPdpRes = await fetch(`${baseUrl}/catalog/pdp/p_hidden?storefrontId=s_feno_1`);
      if (hiddenPdpRes.status !== 404) {
        return { result: 'FAIL', message: `Hidden PDP should be 404, got ${hiddenPdpRes.status}` };
      }

      const unavailablePdpRes = await fetch(`${baseUrl}/catalog/pdp/p_unavailable?storefrontId=s_feno_1`);
      if (unavailablePdpRes.status !== 410) {
        return { result: 'FAIL', message: `Unavailable PDP should be 410, got ${unavailablePdpRes.status}` };
      }

      const plpRes = await fetch(`${baseUrl}/plp?categoryId=c_1`);
      const plpBody = await readJson(plpRes);
      if (!plpRes.ok) {
        return { result: 'FAIL', message: `PLP failed: ${plpRes.status}` };
      }
      const productCards = plpBody.data?.productCards || [];
      if (!productCards.some((card: any) => card.productId === 'p_valid')) {
        return { result: 'FAIL', message: 'PLP did not include active catalog product card' };
      }
      const blockedIds = ['p_hidden', 'p_unavailable', 'p_suspended', 'p_archived'];
      if (productCards.some((card: any) => blockedIds.includes(card.productId))) {
        return { result: 'FAIL', message: 'PLP leaked hidden/unavailable/suspended/archived product card' };
      }
      if (!productCards.every((card: any) => card.cardTruth === false && card.productTruthMutated === false)) {
        return { result: 'FAIL', message: 'PLP product card missing card/product truth boundary' };
      }
      if (
        !productCards.every(
          (card: any) =>
            card.catalogReadTruth === false &&
            card.priceTruth === false &&
            card.stockTruth === false &&
            card.mediaTruth === false &&
            card.searchIndexTruth === false
        )
      ) {
        return { result: 'FAIL', message: 'PLP product card missing catalog/search/price/stock/media boundary flags' };
      }
      if (!productCards.every((card: any) => card.activePriceLabel === 'PRICE_OWNED_BY_PRICING')) {
        return { result: 'FAIL', message: 'PLP product card exposed price label as owner truth' };
      }
      if (
        !Array.isArray(plpBody.data?.warnings) ||
        !plpBody.data.warnings.includes('PLP_PRODUCT_CARDS_DELEGATED_TO_CATALOG_READ_PROJECTION')
      ) {
        return { result: 'FAIL', message: 'PLP response missing catalog delegation boundary warning' };
      }

      return { result: 'PASS', message: 'Catalog PDP/PLP read boundaries verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};

export const searchSmoke: SmokeRunner = {
  name: 'search',
  run: async (baseUrl: string) => {
    try {
      const readJson = async (res: Response): Promise<any> => {
        try {
          return await res.json();
        } catch {
          return {};
        }
      };

      const getSearch = async (path: string): Promise<any> => {
        const res = await fetch(`${baseUrl}${path}`);
        const body = await readJson(res);
        if (!res.ok) {
          throw new Error(`${path} failed: ${res.status}`);
        }
        return body.data;
      };

      const assertCandidateBoundaries = (data: any, label: string): SmokeResult | undefined => {
        const candidates = data?.candidates || [];
        for (const candidate of candidates) {
          if (candidate.searchTruth !== false || candidate.rankingFinal !== false) {
            return { result: 'FAIL', message: `${label} candidate missing search/ranking boundary flags` };
          }
          if (candidate.type === 'PRODUCT' && candidate.productTruthMutated !== false) {
            return { result: 'FAIL', message: `${label} product candidate mutated product truth` };
          }
          if (candidate.type === 'CATEGORY' && candidate.taxonomyTruthMutated !== false) {
            return { result: 'FAIL', message: `${label} category candidate mutated taxonomy truth` };
          }
          if (candidate.type === 'STOREFRONT' && candidate.storefrontTruthMutated !== false) {
            return { result: 'FAIL', message: `${label} storefront candidate mutated storefront truth` };
          }
          if (typeof candidate.scoreFoundationOnly !== 'number') {
            return { result: 'FAIL', message: `${label} candidate missing foundation-only score` };
          }
        }
        return undefined;
      };

      const assertNoProductLeak = (data: any, label: string): SmokeResult | undefined => {
        const blockedIds = ['p_hidden', 'p_unavailable', 'p_suspended', 'p_archived'];
        const candidates = data?.candidates || [];
        if (candidates.some((candidate: any) => candidate.type === 'PRODUCT' && blockedIds.includes(candidate.productId))) {
          return { result: 'FAIL', message: `${label} leaked hidden/unavailable/suspended/archived product candidate` };
        }
        return undefined;
      };

      const globalData = await getSearch('/search?q=product&mode=GLOBAL&surface=HEADER&limit=10');
      if (globalData.mode !== 'GLOBAL' || globalData.query !== 'product') {
        return { result: 'FAIL', message: 'GLOBAL search did not preserve canonical query/mode' };
      }
      if (!globalData.candidates?.some((candidate: any) => candidate.type === 'PRODUCT' && candidate.productId === 'p_valid')) {
        return { result: 'FAIL', message: 'GLOBAL search did not return expected active product candidate' };
      }
      let boundaryFailure = assertCandidateBoundaries(globalData, 'GLOBAL');
      if (boundaryFailure) return boundaryFailure;
      let leakFailure = assertNoProductLeak(globalData, 'GLOBAL');
      if (leakFailure) return leakFailure;
      if (!globalData.warnings?.includes('SEARCH_INDEX_IS_PROJECTION_NOT_TRUTH')) {
        return { result: 'FAIL', message: 'GLOBAL search missing index projection boundary warning' };
      }
      if (!globalData.warnings?.includes('M8_RANKING_NOT_IN_SCOPE')) {
        return { result: 'FAIL', message: 'GLOBAL search missing ranking owner boundary warning' };
      }

      const missingQueryData = await getSearch('/search?mode=GLOBAL');
      if (
        missingQueryData.emptyState?.code !== 'QUERY_REQUIRED' ||
        missingQueryData.candidates?.length !== 0 ||
        missingQueryData.intent?.type !== 'UNKNOWN'
      ) {
        return { result: 'FAIL', message: 'Missing query did not return canonical safe search response' };
      }

      const emptyQueryData = await getSearch('/search?q=%20%20&mode=GLOBAL');
      if (emptyQueryData.emptyState?.code !== 'QUERY_REQUIRED' || emptyQueryData.candidates?.length !== 0) {
        return { result: 'FAIL', message: 'Empty query did not return canonical safe search response' };
      }

      const invalidModeData = await getSearch('/search?q=product&mode=INVALID&limit=bad');
      if (
        invalidModeData.mode !== 'GLOBAL' ||
        !invalidModeData.warnings?.includes('SEARCH_MODE_DEFAULTED_TO_GLOBAL') ||
        !invalidModeData.warnings?.includes('SEARCH_LIMIT_DEFAULTED_INVALID')
      ) {
        return { result: 'FAIL', message: 'Invalid mode/limit did not use safe canonical defaults' };
      }

      const catalogData = await getSearch('/search?q=product&mode=CATALOG&surface=CATEGORY_PLP&categoryId=c_1');
      if (catalogData.mode !== 'CATALOG') {
        return { result: 'FAIL', message: 'CATALOG mode was not preserved' };
      }
      boundaryFailure = assertCandidateBoundaries(catalogData, 'CATALOG');
      if (boundaryFailure) return boundaryFailure;
      leakFailure = assertNoProductLeak(catalogData, 'CATALOG');
      if (leakFailure) return leakFailure;
      if (catalogData.candidates?.some((candidate: any) => candidate.rankingFinal !== false)) {
        return { result: 'FAIL', message: 'CATALOG mode produced final ranking' };
      }

      const discoverData = await getSearch('/search?q=video&mode=DISCOVER&surface=DISCOVER');
      if (discoverData.mode !== 'DISCOVER') {
        return { result: 'FAIL', message: 'DISCOVER mode was not preserved' };
      }
      if (discoverData.candidates?.some((candidate: any) => candidate.type !== 'PRODUCT' || candidate.mediaType !== 'VIDEO')) {
        return { result: 'FAIL', message: 'DISCOVER mode produced non-video/feed truth candidate' };
      }
      boundaryFailure = assertCandidateBoundaries(discoverData, 'DISCOVER');
      if (boundaryFailure) return boundaryFailure;
      leakFailure = assertNoProductLeak(discoverData, 'DISCOVER');
      if (leakFailure) return leakFailure;

      const storefrontData = await getSearch('/search?q=product&mode=STOREFRONT&surface=STOREFRONT&storefrontId=s_1');
      if (storefrontData.mode !== 'STOREFRONT') {
        return { result: 'FAIL', message: 'STOREFRONT mode was not preserved' };
      }
      if (storefrontData.candidates?.some((candidate: any) => candidate.type !== 'PRODUCT' || candidate.storefrontId !== 's_1')) {
        return { result: 'FAIL', message: 'STOREFRONT mode did not preserve storefront product scope' };
      }
      if (!storefrontData.warnings?.includes('STOREFRONT_SEARCH_CONTEXT_FOUNDATION_LIMITED')) {
        return { result: 'FAIL', message: 'STOREFRONT mode missing foundation context warning' };
      }
      boundaryFailure = assertCandidateBoundaries(storefrontData, 'STOREFRONT');
      if (boundaryFailure) return boundaryFailure;
      leakFailure = assertNoProductLeak(storefrontData, 'STOREFRONT');
      if (leakFailure) return leakFailure;

      const hiddenData = await getSearch('/search?q=hidden%20product&mode=GLOBAL');
      leakFailure = assertNoProductLeak(hiddenData, 'hidden query');
      if (leakFailure) return leakFailure;
      const unavailableData = await getSearch('/search?q=unavailable%20product&mode=GLOBAL');
      leakFailure = assertNoProductLeak(unavailableData, 'unavailable query');
      if (leakFailure) return leakFailure;

      return { result: 'PASS', message: 'Search BFF candidate boundaries verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
