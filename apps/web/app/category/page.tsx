import { CategoryFoundation } from '../../src/components/discovery-surface';

export default async function CategoryPage({ searchParams }: { searchParams: Promise<{ surface?: string }> }) {
  const { surface } = await searchParams;
  return <CategoryFoundation surface={surface} />;
}
