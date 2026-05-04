import { getPlp } from '@hx/category';
import { PlpQuery } from '@hx/contracts';
import * as response from './response';

export async function handleGetPlp(context: any, query: any) {
  const normalizedQuery = { ...query };

  if (typeof normalizedQuery.filters === 'string') {
    try {
      normalizedQuery.filters = JSON.parse(normalizedQuery.filters);
    } catch {
      return response.badRequest('INVALID_FILTERS_JSON', 'Filtre formatı geçersiz');
    }
  }

  const result = await getPlp(normalizedQuery as PlpQuery);
  
  if (result.emptyState?.code === 'CATEGORY_NOT_FOUND') {
    return response.notFound('CATEGORY_NOT_FOUND', 'Category not found');
  }

  return response.ok(result);
}
