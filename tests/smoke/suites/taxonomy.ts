export const taxonomySmoke = {
  name: 'Taxonomy Smoke',
  run: async (baseUrl: string) => {
    try {
      const res = await fetch(`${baseUrl}/category/list`);
      if (!res.ok) return { result: 'FAIL', message: 'Taxonomy tree route unreachable' };
      const responseData = await res.json();
      const data = responseData.data || responseData;
      
      const hasTruthFalse = data.items.every((c: any) => c.taxonomyTruth === false);
      if (!hasTruthFalse) return { result: 'FAIL', message: 'Taxonomy response missing taxonomyTruth: false marker' };

      // Parent/child deterministic Check
      const firstParent = data.items.find((c: any) => c.childCategoryIds?.length > 0);
      if (firstParent) {
          const childId = firstParent.childCategoryIds[0];
          const childRes = await fetch(`${baseUrl}/category/list?parentCategoryId=${firstParent.categoryId}`);
          const childResponseData = await childRes.json();
          const childData = childResponseData.data || childResponseData;
          if (!childData.items.some((c: any) => c.categoryId === childId)) {
             return { result: 'FAIL', message: 'Parent/child relationship not deterministic' };
          }
      }

      return { result: 'PASS', message: 'Taxonomy deterministic, truth boundary marked' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};