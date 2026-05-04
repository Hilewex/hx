import { SmokeRunner } from '../types';

async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export const catalogReadSmoke: SmokeRunner = {
  name: 'catalog-read',
  run: async (baseUrl: string) => {
    try {
      const activeRes = await fetch(`${baseUrl}/catalog/product/p_valid`);
      const activeBody = await readJson(activeRes);
      if (!activeRes.ok) {
        return { result: 'FAIL', message: `Active product read failed: ${activeRes.status}` };
      }
      const activeProduct = activeBody.data?.product;
      if (!activeProduct || activeProduct.catalogReadTruth !== false || activeProduct.searchIndexTruth !== false) {
        return { result: 'FAIL', message: 'Active product missing catalog/search boundary flags' };
      }
      if ('price' in activeProduct || 'stock' in activeProduct) {
        return { result: 'FAIL', message: 'Catalog product read exposed BFF/catalog-owned price or stock truth' };
      }
      if (activeProduct.priceTruth !== false || activeProduct.stockTruth !== false || activeProduct.mediaTruth !== false) {
        return { result: 'FAIL', message: 'Catalog product read missing price/stock/media owner boundary flags' };
      }

      const hiddenRes = await fetch(`${baseUrl}/catalog/product/p_hidden`);
      if (hiddenRes.status !== 404) {
        return { result: 'FAIL', message: `Hidden product should not be public readable, got ${hiddenRes.status}` };
      }

      const unavailableRes = await fetch(`${baseUrl}/catalog/pdp/p_unavailable?storefrontId=s_feno_1`);
      if (unavailableRes.status !== 410) {
        return { result: 'FAIL', message: `Unavailable product PDP/read should be 410, got ${unavailableRes.status}` };
      }

      const cardsRes = await fetch(`${baseUrl}/catalog/product-cards?categoryId=c_1`);
      const cardsBody = await readJson(cardsRes);
      if (!cardsRes.ok) {
        return { result: 'FAIL', message: `Product cards read failed: ${cardsRes.status}` };
      }
      const cards = cardsBody.data?.productCards || [];
      if (!cards.some((card: any) => card.productId === 'p_valid')) {
        return { result: 'FAIL', message: 'Active product card missing from public catalog cards' };
      }
      if (cards.some((card: any) => ['p_hidden', 'p_unavailable', 'p_suspended', 'p_archived'].includes(card.productId))) {
        return { result: 'FAIL', message: 'Non-public product leaked into public catalog cards' };
      }
      if (!cards.every((card: any) => card.cardTruth === false && card.searchIndexTruth === false)) {
        return { result: 'FAIL', message: 'Product card projection missing boundary flags' };
      }
      if (!cards.every((card: any) => card.priceTruth === false && card.stockTruth === false && card.mediaTruth === false)) {
        return { result: 'FAIL', message: 'Product card projection missing price/stock/media boundary flags' };
      }

      return { result: 'PASS', message: 'Catalog read projection boundaries verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
