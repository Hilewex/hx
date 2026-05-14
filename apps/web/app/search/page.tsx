import { SearchResultsFoundation } from '../../src/components/discovery-surface';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <SearchResultsFoundation query={q} />;
}
