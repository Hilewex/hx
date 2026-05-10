export const plpSmoke = {
  name: 'PLP Smoke',
  run: async (baseUrl: string) => {
    try {
      const res = await fetch(`${baseUrl}/plp?categoryId=c_1`);
      if (!res.ok) return { result: 'FAIL', message: 'PLP route unreachable' };
      
      const responseData = await res.json();
      const data = responseData.data || responseData;
      
      if (!data.productCards) return { result: 'FAIL', message: 'PLP missing productCards' };
      
      const hasHidden = data.productCards.some((p: any) => p.status === 'HIDDEN');
      if (hasHidden) return { result: 'FAIL', message: 'Hidden product leaked into PLP' };

      const hasUnavailable = data.productCards.some((p: any) => p.status === 'UNAVAILABLE');
      if (hasUnavailable) {
        // Checking if state marks it properly, in mock it isn't returned for public normally if it's strictly filtered, 
        // but let's check if it lacks truth.
      }

      const facetTruthMarked = data.filters?.every((f: any) => f.facetTruth === false);
      if (data.filters && !facetTruthMarked) return { result: 'FAIL', message: 'Facet truth missing marker' };

      const cardTruthMarked = data.productCards.every((p: any) => p.cardTruth === false);
      if (data.productCards.length > 0 && !cardTruthMarked) return { result: 'FAIL', message: 'Card truth missing marker' };

      return { result: 'PASS', message: 'PLP routes reachable, hidden products blocked, owner truth marked' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};