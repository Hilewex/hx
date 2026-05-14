'use client';

import type {
  CreatorContentManagementItemProjection,
  CreatorContentManagementProjection,
  CreatorManagementProjection,
  CreatorProductManagementItemProjection,
  CreatorProductManagementProjection,
  CreatorStorefrontProfileProjection,
  PublicProjectionEnvelope,
} from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  readCreatorContentManagementProjection,
  readCreatorDashboardProjection,
  readCreatorProductsManagementProjection,
  readCreatorStorefrontManagementProjection,
} from '../lib/bff/creator';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

type CreatorSurface = 'dashboard' | 'storefront' | 'products' | 'content';

export function CreatorManagementSurface({ surface }: { surface: CreatorSurface }) {
  const query = useQuery({
    queryKey: projectionQueryKeys.creator(surface),
    queryFn: (): Promise<PublicProjectionEnvelope<unknown>> => readSurfaceProjection(surface),
    staleTime: 20_000,
  });

  return (
    <div className="page-stack creator-page">
      <CreatorRouteTitle surface={surface} />
      <CreatorScopeGuidance />
      {query.isLoading ? <LoadingState title="Loading creator projection" description="Waiting for BFF read data." /> : null}
      <CreatorProjectionNotice projection={query.data} isError={query.isError} retry={() => void query.refetch()} />
      {surface === 'dashboard' ? <CreatorDashboard projection={query.data as PublicProjectionEnvelope<CreatorManagementProjection> | undefined} /> : null}
      {surface === 'storefront' ? <CreatorStorefrontPanel projection={query.data as PublicProjectionEnvelope<CreatorStorefrontProfileProjection> | undefined} /> : null}
      {surface === 'products' ? <CreatorProductsPanel projection={query.data as PublicProjectionEnvelope<CreatorProductManagementProjection> | undefined} /> : null}
      {surface === 'content' ? <CreatorContentPanel projection={query.data as PublicProjectionEnvelope<CreatorContentManagementProjection> | undefined} /> : null}
      <CreatorStateReview />
    </div>
  );
}

function readSurfaceProjection(surface: CreatorSurface): Promise<PublicProjectionEnvelope<unknown>> {
  switch (surface) {
    case 'storefront':
      return readCreatorStorefrontManagementProjection();
    case 'products':
      return readCreatorProductsManagementProjection();
    case 'content':
      return readCreatorContentManagementProjection();
    case 'dashboard':
    default:
      return readCreatorDashboardProjection();
  }
}

function CreatorRouteTitle({ surface }: { surface: CreatorSurface }) {
  const title = surface === 'dashboard' ? 'Creator management' : surface === 'storefront' ? 'Storefront management' : surface === 'products' ? 'Creator products' : 'Creator content';
  return (
    <section className="route-title">
      <span className="placeholder-label">Creator projection surface</span>
      <h1>{title}</h1>
      <p>Creator authenticated is not storefront owner verified. This browser surface shows BFF projections only.</p>
    </section>
  );
}

function CreatorScopeGuidance() {
  return (
    <section className="creator-guidance" aria-labelledby="creator-guidance-title">
      <span className="placeholder-label">Scope guidance</span>
      <h2 id="creator-guidance-title">Creator scope boundary</h2>
      <ul>
        <li>Bu yuzey yalniz creator projection gosterir.</li>
        <li>Aksiyonlar owner/BFF command ile yurutulur.</li>
        <li>Scope disi storefront/product uzerinde islem yapilamaz.</li>
        <li>Product listed is not product active or sellable.</li>
        <li>Media uploaded is not content published, and content created is not public visible.</li>
      </ul>
    </section>
  );
}

function CreatorDashboard({ projection }: { projection?: PublicProjectionEnvelope<CreatorManagementProjection> }) {
  const data = projection?.data;
  return (
    <section className="creator-layout" aria-labelledby="creator-dashboard-title">
      <div className="creator-main-stack">
        <section className="creator-panel" aria-labelledby="creator-dashboard-title">
          <span className="placeholder-label">Summary projection</span>
          <h2 id="creator-dashboard-title">Storefront projection summary</h2>
          <dl className="creator-facts">
            <Fact label="Creator" value={data?.context.creatorId ?? 'Creator projection unavailable'} />
            <Fact label="Storefront" value={data?.storefront.displayName ?? data?.storefront.slug ?? 'Storefront not configured'} />
            <Fact label="Status" value={data?.storefrontStatus.statusText ?? 'Status projection unavailable'} />
            <Fact label="Visibility" value={data?.storefrontStatus.visibilityText ?? 'Visibility projection unavailable'} />
          </dl>
        </section>
        <section className="creator-panel" aria-labelledby="creator-summary-title">
          <span className="placeholder-label">Management placeholders</span>
          <h2 id="creator-summary-title">Projection summaries</h2>
          <div className="creator-card-grid">
            <SummaryCard title="Products" value={`${data?.products.items.length ?? 0} listed projections`} href="/creator/products" />
            <SummaryCard title="Content" value={`${data?.content.items.length ?? 0} content projections`} href="/creator/content" />
            <SummaryCard title="Profile" value={data?.storefront.profileConfiguredProjection ? 'Profile projection configured' : 'Storefront not configured'} href="/creator/storefront" />
          </div>
        </section>
      </div>
      <CreatorSideActions />
    </section>
  );
}

function CreatorStorefrontPanel({ projection }: { projection?: PublicProjectionEnvelope<CreatorStorefrontProfileProjection> }) {
  const profile = projection?.data;
  return (
    <section className="creator-layout" aria-labelledby="storefront-profile-title">
      <div className="creator-main-stack">
        <section className="creator-profile-panel">
          <div className="creator-banner" aria-label={profile?.bannerMediaLabel ?? 'Banner media projection unavailable'}>{profile?.bannerMediaLabel ?? 'Banner projection'}</div>
          <div className="creator-avatar" aria-label={profile?.avatarMediaLabel ?? 'Avatar media projection unavailable'}>{initial(profile?.displayName ?? profile?.slug)}</div>
          <span className="placeholder-label">Storefront profile projection</span>
          <h2 id="storefront-profile-title">{profile?.displayName ?? 'Storefront not configured'}</h2>
          <p>{profile?.bio ?? 'Bio or description projection unavailable.'}</p>
          <dl className="creator-facts">
            <Fact label="Slug" value={profile?.slug ?? 'Slug projection unavailable'} />
            <Fact label="Visibility" value={profile?.visibilityProjection ?? 'Visibility projection unavailable'} />
            <Fact label="Profile configured" value={profile?.profileConfiguredProjection ? 'Configured by projection' : 'Not configured by projection'} />
          </dl>
        </section>
      </div>
      <CreatorSideActions />
    </section>
  );
}

function CreatorProductsPanel({ projection }: { projection?: PublicProjectionEnvelope<CreatorProductManagementProjection> }) {
  const items = projection?.data?.items ?? [];
  return (
    <section className="creator-layout" aria-labelledby="creator-products-title">
      <div className="creator-main-stack">
        <section className="creator-panel">
          <span className="placeholder-label">Product management projection</span>
          <h2 id="creator-products-title">Storefront product list projection</h2>
          {items.length === 0 ? (
            <EmptyState title="Product list empty" description="No product binding fallback is created by this UI." />
          ) : (
            <div className="creator-list" role="list" aria-label="Creator product projections">
              {items.map((item) => <CreatorProductItem item={item} key={item.storefrontProductId} />)}
            </div>
          )}
        </section>
      </div>
      <CreatorSideActions />
    </section>
  );
}

function CreatorProductItem({ item }: { item: CreatorProductManagementItemProjection }) {
  return (
    <article className="creator-list-item" role="listitem" data-status={item.listedStateProjection}>
      <div className="creator-item-media" aria-hidden="true">Product</div>
      <div>
        <h3>{item.title}</h3>
        <p>{item.contextText ?? 'Product context projection'}</p>
        <p className="creator-status">State: {item.listedStateProjection}. Listed does not mean active or sellable.</p>
        <p>Display order projection: {item.displayOrderProjection ?? 'Unavailable'}</p>
      </div>
    </article>
  );
}

function CreatorContentPanel({ projection }: { projection?: PublicProjectionEnvelope<CreatorContentManagementProjection> }) {
  const items = projection?.data?.items ?? [];
  return (
    <section className="creator-layout" aria-labelledby="creator-content-title">
      <div className="creator-main-stack">
        <section className="creator-panel">
          <span className="placeholder-label">Content management projection</span>
          <h2 id="creator-content-title">Story, post, and media projections</h2>
          {items.length === 0 ? (
            <EmptyState title="Content list empty" description="No story, post, media, publish, or moderation truth is generated locally." />
          ) : (
            <div className="creator-list" role="list" aria-label="Creator content projections">
              {items.map((item) => <CreatorContentItem item={item} key={item.contentId} />)}
            </div>
          )}
        </section>
      </div>
      <CreatorSideActions />
    </section>
  );
}

function CreatorContentItem({ item }: { item: CreatorContentManagementItemProjection }) {
  return (
    <article className="creator-list-item" role="listitem" data-status={item.statusProjection}>
      <div className="creator-item-media" aria-hidden="true">{item.kind}</div>
      <div>
        <h3>{item.title}</h3>
        <p className="creator-status">Status: {item.statusProjection}</p>
        <p>{item.moderationStatusText ?? 'Moderation status projection unavailable.'}</p>
        <p>Created or uploaded does not mean published or public visible.</p>
      </div>
    </article>
  );
}

function CreatorSideActions() {
  return (
    <aside className="creator-actions" aria-labelledby="creator-actions-title">
      <span className="placeholder-label">Owner command handoff</span>
      <h2 id="creator-actions-title">Actions</h2>
      <button type="button" disabled>Edit storefront placeholder</button>
      <button type="button" disabled>Add product placeholder</button>
      <button type="button" disabled>Create content placeholder</button>
      <p>Buttons are disabled placeholders. They do not bind products, publish content, update visibility, or write panel truth.</p>
    </aside>
  );
}

function CreatorStateReview() {
  return (
    <section className="state-grid" aria-labelledby="creator-state-review-title">
      <div className="section-heading">
        <span className="placeholder-label">State handling</span>
        <h2 id="creator-state-review-title">Creator empty, error, and degraded states</h2>
      </div>
      <div className="grid two">
        <EmptyState title="Storefront not configured" description="Rendered when the projection has no configured profile." />
        <EmptyState title="Empty products or content" description="Rendered without creating local product or content candidates." />
        <DegradedState title="Scope unavailable" description="Rendered when creator scope projection is unavailable or degraded." />
        <DegradedState title="Media degraded" description="Rendered as projection text only, without media processing truth." />
      </div>
    </section>
  );
}

function CreatorProjectionNotice({ projection, isError, retry }: { projection?: PublicProjectionEnvelope<unknown>; isError: boolean; retry: () => void }) {
  if (isError) {
    return <ErrorState title="Creator projection read failed" description="Read transport failed. No creator permission or ownership truth is inferred locally." action={<button className="shell-action" type="button" onClick={retry}>Retry</button>} />;
  }

  if (!projection) {
    return <DegradedState title="Creator projection unavailable" description="Projection read has not returned transport state yet." />;
  }

  if (projection.transport.status === 'available') {
    return null;
  }

  if (projection.transport.status === 'empty') {
    return <EmptyState title="Creator projection returned empty" description="No local creator/storefront/product/content replacement truth is generated." />;
  }

  const message = projection.transport.error?.message ?? `Creator projection transport state: ${projection.transport.status}.`;
  return <DegradedState title={projection.transport.status === 'timeout' ? 'Creator projection timeout' : 'Degraded creator projection'} description={message} action={projection.transport.retryable ? <button className="shell-action" type="button" onClick={retry}>Retry</button> : undefined} />;
}

function SummaryCard({ title, value, href }: { title: string; value: string; href: string }) {
  return (
    <Link className="creator-summary-card" href={href}>
      <span>{title}</span>
      <strong>{value}</strong>
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function initial(value?: string) {
  return value?.trim().slice(0, 1).toUpperCase() || 'C';
}
