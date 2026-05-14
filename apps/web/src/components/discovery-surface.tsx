'use client';

import type {
  CatalogProductCardReadProjection,
  CategoryNode,
  DiscoveryCandidateProjection,
  PublicProjectionEnvelope,
  StoryTrayItem,
} from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { readCategoryDetailProjection, readCategoryListProjection } from '../lib/bff/category';
import { readCatalogProjection } from '../lib/bff/catalog';
import { readDiscoverProjection } from '../lib/bff/discover';
import { readHomeProjection } from '../lib/bff/home';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { readSearchProjection } from '../lib/bff/search';
import { readStorefrontProjection } from '../lib/bff/storefront';
import { readStoryProjection } from '../lib/bff/story';
import { DegradedState } from './degraded-state';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

type CandidateStatus = 'ready' | 'loading' | 'degraded' | 'unavailable';

export function PublicStorefrontHome() {
  const query = useQuery({
    queryKey: projectionQueryKeys.home(),
    queryFn: readHomeProjection,
    staleTime: 30_000,
  });

  if (query.isLoading) {
    return <RouteLoading title="Loading homepage projection" />;
  }

  const projection = query.data;

  return (
    <div className="page-stack discovery-page">
      <HeroIntro projection={projection} />
      <SearchEntry />
      <ProjectionNotice projection={projection} title="Homepage projection state" retry={() => void query.refetch()} />
      <StoryRail items={projection?.data?.stories ?? []} transportStatus={projectionStatus(projection, query.isError)} />
      <DiscoverFeed items={projection?.data?.discoverFeed ?? []} transportStatus={projectionStatus(projection, query.isError)} />
      <ProductRail items={projection?.data?.products ?? []} transportStatus={projectionStatus(projection, query.isError)} />
      <CreatorSpotlight items={projection?.data?.creatorSpotlight ?? []} transportStatus={projectionStatus(projection, query.isError)} />
      <CategoryShortcuts items={projection?.data?.categories ?? []} transportStatus={projectionStatus(projection, query.isError)} />
      <DiscoveryStateGrid />
    </div>
  );
}

export function HeroIntro({ projection }: { projection?: PublicProjectionEnvelope<{ hero?: { title: string; description: string } }> }) {
  return (
    <section className="storefront-hero" aria-labelledby="storefront-hero-title">
      <span className="placeholder-label">Discovery read surface</span>
      <h1 id="storefront-hero-title">{projection?.data?.hero?.title ?? 'Browse creators, stories, and product candidates'}</h1>
      <p>
        {projection?.data?.hero?.description ??
          'Public discovery waits for BFF read projections. The browser does not synthesize commerce, ranking, moderation, availability, or permission truth.'}
      </p>
    </section>
  );
}

export function SearchEntry({ initialQuery = '' }: { initialQuery?: string }) {
  return (
    <section className="search-entry" aria-labelledby="search-entry-title">
      <div>
        <span className="placeholder-label">Search entry</span>
        <h2 id="search-entry-title">Find a creator, story, or product candidate</h2>
      </div>
      <form className="search-form" action="/search">
        <label className="sr-only" htmlFor="global-search">Search query</label>
        <input id="global-search" name="q" defaultValue={initialQuery} placeholder="Search read projections" />
        <button type="submit">Search</button>
      </form>
    </section>
  );
}

export function StoryRail({ items, transportStatus }: { items: StoryTrayItem[]; transportStatus?: CandidateStatus }) {
  return (
    <section className="surface-section" aria-labelledby="story-rail-title">
      <div className="section-heading">
        <span className="placeholder-label">Story rail</span>
        <h2 id="story-rail-title">Stories from projection candidates</h2>
      </div>
      {renderCollectionState(items.length, transportStatus, 'No story projection loaded', 'The story rail is empty until BFF read data supplies visible candidates.') ?? (
        <div className="story-rail" role="list" aria-label="Story candidates">
          {items.map((item) => (
            <article className="story-tile" data-status={candidateStatus(item.warnings)} role="listitem" key={item.trayItemId}>
              <div className="story-media" aria-hidden="true">{item.label.slice(0, 1)}</div>
              <h3>{item.label}</h3>
              <p>{statusCopy(candidateStatus(item.warnings))}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function DiscoverFeed({ items, transportStatus }: { items: DiscoveryCandidateProjection[]; transportStatus?: CandidateStatus }) {
  return (
    <section className="surface-section" aria-labelledby="discover-feed-title">
      <div className="section-heading">
        <span className="placeholder-label">Discover feed</span>
        <h2 id="discover-feed-title">Mixed discovery feed</h2>
      </div>
      {renderCollectionState(items.length, transportStatus, 'No feed candidates', 'No local recommendation or ranking fallback is generated by the browser.') ?? (
        <div className="feed-stack">
          {items.map((item) => (
            <article className="feed-card" data-kind={item.kind} data-status={candidateStatus(item.warnings)} key={item.id}>
              <div className="feed-media" aria-label={`${item.kind} media projection`}>
                <span>{item.kind}</span>
              </div>
              <div className="feed-copy">
                <span className="placeholder-label">Candidate</span>
                <h3>{item.title}</h3>
                <p>{item.context ?? 'Projection candidate'}</p>
                <p className="status-note">{statusCopy(candidateStatus(item.warnings))}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ProductRail({ items, transportStatus }: { items: CatalogProductCardReadProjection[]; transportStatus?: CandidateStatus }) {
  return (
    <section className="surface-section" aria-labelledby="product-rail-title">
      <div className="section-heading">
        <span className="placeholder-label">Product rail</span>
        <h2 id="product-rail-title">Product discovery candidates</h2>
      </div>
      {renderCollectionState(items.length, transportStatus, 'No product projection loaded', 'Product cards render only when read data supplies candidates.') ?? (
        <div className="product-rail" role="list" aria-label="Product discovery candidates">
          {items.map((item) => (
            <ProductDiscoveryCard item={item} key={item.productId} />
          ))}
        </div>
      )}
    </section>
  );
}

export function ProductDiscoveryCard({ item }: { item: CatalogProductCardReadProjection }) {
  const status = candidateStatus(item.warnings);

  return (
    <article className="product-card" data-status={status} role="listitem">
      <div className="product-media" aria-label={status === 'degraded' ? 'Degraded product media fallback' : 'Product media projection'}>
        <span>{item.primaryMedia?.type ?? 'Media projection'}</span>
      </div>
      <div className="product-copy">
        <h3>{item.name}</h3>
        <p>{item.storefrontContext?.name ?? item.brand ?? 'Store context projection unavailable'}</p>
        <p className="price-placeholder">Safe price projection unavailable</p>
        <button type="button" aria-label={`Save ${item.name} candidate`}>Save</button>
      </div>
    </article>
  );
}

export function CreatorSpotlight({ items, transportStatus }: { items: DiscoveryCandidateProjection[]; transportStatus?: CandidateStatus }) {
  return (
    <section className="surface-section" aria-labelledby="creator-spotlight-title">
      <div className="section-heading">
        <span className="placeholder-label">Storefront teaser</span>
        <h2 id="creator-spotlight-title">Creator storefront previews</h2>
      </div>
      {renderCollectionState(items.length, transportStatus, 'No storefront teaser projection', 'Creator teaser cards require storefront/search projection data.') ?? (
        <div className="creator-grid">
          {items.map((item) => (
            <article className="creator-teaser" data-status={candidateStatus(item.warnings)} key={item.id}>
              <div className="creator-cover" aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.context ?? 'Storefront projection teaser without badge, rank, or authority claims.'}</p>
              <Link href={item.href ?? `/store/${item.id}`}>Open storefront</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function CategoryShortcuts({ items, transportStatus }: { items: CategoryNode[]; transportStatus?: CandidateStatus }) {
  return (
    <section className="surface-section" aria-labelledby="category-shortcuts-title">
      <div className="section-heading">
        <span className="placeholder-label">Category shortcuts</span>
        <h2 id="category-shortcuts-title">Browse entry points</h2>
      </div>
      {renderCollectionState(items.length, transportStatus, 'No category projection loaded', 'Category shortcuts require taxonomy read projection data.') ?? (
        <div className="category-shortcuts" role="list" aria-label="Category shortcuts">
          {items.map((item) => (
            <Link role="listitem" href={`/category?surface=${encodeURIComponent(item.slug)}`} key={item.categoryId}>
              <span>{item.name}</span>
              <small>Category projection</small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function DiscoveryStateGrid() {
  return (
    <section className="state-grid" aria-labelledby="state-grid-title">
      <div className="section-heading">
        <span className="placeholder-label">State handling</span>
        <h2 id="state-grid-title">Projection states</h2>
      </div>
      <div className="grid two">
        <EmptyState title="Empty feed" description="Rendered when read projections return no candidates." />
        <DegradedState title="Unavailable section" description="Rendered when a projection source is unavailable without inventing replacement truth." />
        <ErrorState title="Failed projection load" description="Retry is limited to read transport; it is not a business mutation." />
        <LoadingState />
      </div>
    </section>
  );
}

export function SearchResultsFoundation({ query }: { query?: string }) {
  const normalizedQuery = query?.trim() ?? '';
  const search = useQuery({
    queryKey: projectionQueryKeys.search(normalizedQuery),
    queryFn: () => readSearchProjection({ query: normalizedQuery, surface: 'HEADER', limit: 20 }),
    enabled: normalizedQuery.length > 0,
  });
  const discoverItems = search.data?.data?.candidates.map((candidate) => ({
    id: 'productId' in candidate ? candidate.productId : 'categoryId' in candidate ? candidate.categoryId : candidate.storefrontId,
    kind: candidate.type.toLowerCase() as DiscoveryCandidateProjection['kind'],
    title: 'name' in candidate ? candidate.name : 'Search candidate',
    context: 'Search projection candidate',
    source: candidate.type === 'CATEGORY' ? 'category_projection' as const : candidate.type === 'STOREFRONT' ? 'storefront_projection' as const : 'search_projection' as const,
    projectionTruth: false as const,
    rankingFinal: false as const,
    recommendationTruth: false as const,
    commerceTruth: false as const,
    warnings: candidate.warnings,
  })) ?? [];

  return (
    <div className="page-stack discovery-page">
      <section className="route-title">
        <span className="placeholder-label">Search foundation</span>
        <h1>Search</h1>
        <p>Search result containers render BFF search projections without browser-owned ranking truth.</p>
      </section>
      <SearchEntry initialQuery={query ?? ''} />
      {!normalizedQuery ? (
        <EmptyState title="No search query" description="Enter a query to navigate this route. The UI does not synthesize search results." />
      ) : search.isLoading ? (
        <RouteLoading title="Loading search projection" />
      ) : (
        <>
          <ProjectionNotice projection={search.data} title="Search projection state" retry={() => void search.refetch()} />
          <DiscoverFeed items={discoverItems} transportStatus={projectionStatus(search.data, search.isError)} />
        </>
      )}
    </div>
  );
}

export function CategoryFoundation({ surface }: { surface?: string }) {
  const category = useQuery({
    queryKey: projectionQueryKeys.category(surface),
    queryFn: async () => {
      const [detail, list, products, discover] = await Promise.all([
        surface ? readCategoryDetailProjection({ slug: surface }) : Promise.resolve(undefined),
        readCategoryListProjection({ limit: 8 }),
        readCatalogProjection({ categoryId: surface, limit: 8 }),
        readDiscoverProjection({ surface: 'CATEGORY_PLP', categoryId: surface, limit: 8 }),
      ]);

      return { detail, list, products, discover };
    },
  });

  const detail = category.data?.detail;
  const list = category.data?.list;
  const products = category.data?.products;
  const discover = category.data?.discover;
  const status = projectionStatus(products ?? discover ?? list ?? detail, category.isError);

  return (
    <div className="page-stack discovery-page">
      <section className="route-title">
        <span className="placeholder-label">Category foundation</span>
        <h1>{detail?.data?.category?.name ?? 'Category'}</h1>
        <p>Category browsing displays BFF projections; taxonomy and availability truth remain outside the browser.</p>
      </section>
      {category.isLoading ? <RouteLoading title="Loading category projection" /> : null}
      <ProjectionNotice projection={products ?? discover ?? list ?? detail} title="Category projection state" retry={() => void category.refetch()} />
      <CategoryShortcuts items={list?.data?.items ?? []} transportStatus={status} />
      <DiscoverFeed items={discover?.data?.candidates ?? []} transportStatus={status} />
      <ProductRail items={products?.data?.productCards ?? []} transportStatus={status} />
    </div>
  );
}

export function StorefrontFoundation({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: projectionQueryKeys.storefront(slug),
    queryFn: async () => {
      const storefront = await readStorefrontProjection(slug);
      const storefrontId = storefront.data?.storefront && 'id' in storefront.data.storefront ? String(storefront.data.storefront.id) : undefined;
      const [stories, products, discover] = await Promise.all([
        readStoryProjection({ surface: 'STOREFRONT', storefrontId, limit: 8 }),
        readCatalogProjection({ storefrontId, limit: 8 }),
        readDiscoverProjection({ surface: 'STOREFRONT', storefrontId, query: slug, limit: 8 }),
      ]);

      return { storefront, stories, products, discover };
    },
  });
  const storefront = query.data?.storefront;
  const status = projectionStatus(storefront, query.isError);
  const displayName = query.data?.storefront.data?.storefront?.displayName ?? slug;

  return (
    <div className="page-stack discovery-page">
      <section className="storefront-profile" aria-labelledby="storefront-title">
        <span className="placeholder-label">Storefront foundation</span>
        <div className="creator-cover" aria-hidden="true" />
        <h1 id="storefront-title">{displayName}</h1>
        <p>Storefront profile, story, product, and feed previews are read from public projections when available.</p>
      </section>
      {query.isLoading ? <RouteLoading title="Loading storefront projection" /> : null}
      <ProjectionNotice projection={storefront} title="Storefront projection state" retry={() => void query.refetch()} />
      <StoryRail items={query.data?.stories.data?.items ?? []} transportStatus={status} />
      <ProductRail items={query.data?.products.data?.productCards ?? []} transportStatus={status} />
      <DiscoverFeed items={query.data?.discover.data?.candidates ?? []} transportStatus={status} />
    </div>
  );
}

function ProjectionNotice({ projection, title, retry }: { projection?: PublicProjectionEnvelope<unknown>; title: string; retry?: () => void }) {
  if (!projection) {
    return <DegradedState title={title} description="Projection read has not returned usable transport state yet." />;
  }

  if (projection.transport.status === 'available') {
    return null;
  }

  if (projection.transport.status === 'empty') {
    return <EmptyState title="Projection returned empty" description="The BFF read completed with no candidates for this surface." />;
  }

  const Action = projection.transport.retryable && retry
    ? <button className="shell-action" type="button" onClick={retry}>Retry</button>
    : undefined;

  if (projection.transport.status === 'error') {
    return (
      <ErrorState
        title={title}
        description={projection.transport.error?.message ?? 'Projection read returned a non-retryable error.'}
        action={Action}
      />
    );
  }

  return (
    <DegradedState
      title={title}
      description={projection.transport.error?.message ?? `Projection transport state: ${projection.transport.status}.`}
      action={Action}
    />
  );
}

function RouteLoading({ title }: { title: string }) {
  return <LoadingState title={title} description="Waiting for BFF projection read data." />;
}

function renderCollectionState(length: number, status: CandidateStatus | undefined, emptyTitle: string, emptyDescription: string) {
  if (status === 'loading') {
    return <LoadingState />;
  }

  if (length > 0) {
    return null;
  }

  if (status === 'unavailable') {
    return <DegradedState title="Projection unavailable" description="The read source is unavailable. No local fallback candidate truth is generated." />;
  }

  return <EmptyState title={emptyTitle} description={emptyDescription} />;
}

function projectionStatus(projection: PublicProjectionEnvelope<unknown> | undefined, isError: boolean): CandidateStatus {
  if (isError) {
    return 'unavailable';
  }

  if (!projection) {
    return 'loading';
  }

  if (projection.transport.status === 'available') {
    return 'ready';
  }

  if (projection.transport.status === 'degraded' || projection.transport.status === 'partial') {
    return 'degraded';
  }

  return 'unavailable';
}

function candidateStatus(warnings?: string[]): CandidateStatus {
  return warnings?.length ? 'degraded' : 'ready';
}

function statusCopy(status: CandidateStatus): string {
  switch (status) {
    case 'loading':
      return 'Loading read projection';
    case 'degraded':
      return 'Degraded projection';
    case 'unavailable':
      return 'Projection unavailable';
    case 'ready':
    default:
      return 'Projection candidate';
  }
}
