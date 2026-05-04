import { listCategories, getCategoryDetail } from '@hx/category';
import { CategoryListQuery, CategoryDetailQuery } from '@hx/contracts';
import * as response from './response';

export async function handleListCategories(context: any, query: CategoryListQuery) {
  const result = await listCategories(query);
  return response.ok(result);
}

export async function handleGetCategoryDetail(context: any, query: CategoryDetailQuery) {
  const result = await getCategoryDetail(query);
  if (result.errors?.includes('CATEGORY_NOT_FOUND')) {
    return response.notFound('CATEGORY_NOT_FOUND', 'Category not found');
  }
  return response.ok(result);
}
