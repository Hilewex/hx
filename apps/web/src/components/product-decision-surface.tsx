'use client';

import type { PdpMediaPreviewProjection, PdpProductDecisionProjection, PdpVariantPreviewProjection } from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { readPdpProductProjection } from '../lib/bff/product';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

export function ProductDecisionSurface({ productId, storefrontId }: { productId: string; storefrontId?: string }) {
  const query = useQuery({
    queryKey: projectionQueryKeys.pdp(productId, storefrontId),
    queryFn: () => readPdpProductProjection({ productId, storefrontId }),
    retry: 1,
    staleTime: 20_000,
  });

  if (query.isLoading) {
    return (
      <div className="page-stack pdp-page">
        <PdpSkeleton />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="page-stack pdp-page">
        <ErrorState title="PDP projection failed" description="The product decision surface could not read BFF projection state." />
      </div>
    );
  }

  const projection = query.data;

  if (!projection?.data) {
    const code = projection?.transport.error?.code;
    if (projection?.transport.status === 'empty' || code === 'PRODUCT_NOT_FOUND') {
      return (
        <div className="page-stack pdp-page">
          <EmptyState title="Product not found" description="The BFF read projection returned no public PDP candidate for this product." />
        </div>
      );
    }

    return (
      <div className="page-stack pdp-page">
        <DegradedState
          title={code === 'PRODUCT_GONE' ? 'Product projection unavailable' : 'PDP projection unavailable'}
          description={projection?.transport.error?.message ?? 'The PDP read is unavailable. The browser does not synthesize replacement commerce truth.'}
          action={projection?.transport.retryable ? <button className="shell-action" type="button" onClick={() => void query.refetch()}>Retry</button> : undefined}
        />
      </div>
    );
  }

  return <PdpContent product={projection.data} transportStatus={projection.transport.status} retry={() => void query.refetch()} />;
}

function PdpContent({
  product,
  transportStatus,
  retry,
}: {
  product: PdpProductDecisionProjection;
  transportStatus: string;
  retry: () => void;
}) {
  const initialVariant = product.defaultVariantId ?? product.variants[0]?.variantId;
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant);
  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.variantId === selectedVariantId) ?? product.variants[0],
    [product.variants, selectedVariantId],
  );

  return (
    <div className="page-stack pdp-page">
      {transportStatus === 'available' ? null : (
        <DegradedState
          title="Partial PDP projection"
          description="One or more PDP sections are degraded or partial. This page keeps owner truth outside the browser."
          action={<button className="shell-action" type="button" onClick={retry}>Retry</button>}
        />
      )}
      <article className="pdp-shell" aria-labelledby="pdp-title">
        <MediaGallery media={product.media} title={product.title} />
        <section className="pdp-info" aria-labelledby="pdp-title">
          <span className="placeholder-label">PDP projection</span>
          <h1 id="pdp-title">{product.title}</h1>
          <p className="pdp-subtitle">{product.subtitle ?? 'Product projection'}</p>
          <p>{product.description ?? 'Product description projection unavailable.'}</p>
          <div className="pdp-safe-facts" aria-label="Safe projection information">
            <p>{product.safePriceText}</p>
            <p>{product.safeAvailabilityText}</p>
          </div>
          <CreatorStoreContext product={product} />
          <VariantSelector variants={product.variants} selectedVariantId={selectedVariant?.variantId} onSelect={setSelectedVariantId} />
          <ActionSurface product={product} selectedVariant={selectedVariant} />
        </section>
      </article>
      <StoryVideoSurface product={product} />
      <ReviewQaSurface product={product} />
      <InteractionSurface product={product} />
    </div>
  );
}

function MediaGallery({ media, title }: { media: PdpMediaPreviewProjection[]; title: string }) {
  const primary = media[0];

  return (
    <section className="pdp-gallery" aria-labelledby="pdp-gallery-title">
      <h2 id="pdp-gallery-title" className="sr-only">Product media gallery</h2>
      <div className="pdp-primary-media" data-status={primary?.status ?? 'unavailable'}>
        {primary?.url ? <img src={primary.url} alt={primary.alt} /> : null}
        <span>{primary?.type === 'VIDEO' ? 'Video preview' : `${title} media preview`}</span>
      </div>
      <div className="pdp-thumbs" role="list" aria-label="Media previews">
        {media.map((item) => (
          <button type="button" aria-label={item.alt} data-status={item.status} key={item.mediaId}>
            {item.type}
          </button>
        ))}
      </div>
    </section>
  );
}

function CreatorStoreContext({ product }: { product: PdpProductDecisionProjection }) {
  const context = product.creatorStoreContext;

  return (
    <section className="pdp-panel" aria-labelledby="creator-store-title">
      <span className="placeholder-label">Creator/store context</span>
      <h2 id="creator-store-title">{context?.displayName ?? 'Store context projection unavailable'}</h2>
      <p>{context?.creatorNote ?? 'No creator authority, trust badge, or endorsement claim is generated by the browser.'}</p>
    </section>
  );
}

function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: {
  variants: PdpVariantPreviewProjection[];
  selectedVariantId?: string;
  onSelect: (variantId: string) => void;
}) {
  return (
    <section className="pdp-panel" aria-labelledby="variant-selector-title">
      <span className="placeholder-label">Variant preview</span>
      <h2 id="variant-selector-title">Choose a variant preview</h2>
      {variants.length ? (
        <div className="variant-grid" role="radiogroup" aria-label="Variant projection previews">
          {variants.map((variant) => (
            <button
              type="button"
              role="radio"
              aria-checked={variant.variantId === selectedVariantId}
              className="variant-option"
              data-selected={variant.variantId === selectedVariantId}
              key={variant.variantId}
              onClick={() => onSelect(variant.variantId)}
            >
              <strong>{variant.label}</strong>
              <span>{variant.projectionText}</span>
            </button>
          ))}
        </div>
      ) : (
        <DegradedState title="Missing variant projection" description="No local variant decision is generated while variant projection is missing." />
      )}
    </section>
  );
}

function ActionSurface({
  product,
  selectedVariant,
}: {
  product: PdpProductDecisionProjection;
  selectedVariant?: PdpVariantPreviewProjection;
}) {
  return (
    <section className="pdp-action-surface" aria-labelledby="pdp-action-title">
      <h2 id="pdp-action-title">Action readiness</h2>
      <p>{selectedVariant?.projectionText ?? 'Variant projection is missing.'}</p>
      <p>{product.addToCartReadinessText}</p>
      <button type="button" aria-label="Add to cart readiness placeholder">Add to cart</button>
      <Link className="state-action secondary" href="/cart" aria-label="View cart projection placeholder">View cart</Link>
    </section>
  );
}

function StoryVideoSurface({ product }: { product: PdpProductDecisionProjection }) {
  return (
    <section className="surface-section" aria-labelledby="pdp-story-title">
      <div className="section-heading">
        <span className="placeholder-label">Story/video context</span>
        <h2 id="pdp-story-title">Related media previews</h2>
      </div>
      {product.storyVideoContext.items.length ? (
        <div className="story-rail" role="list" aria-label="PDP story and video previews">
          {product.storyVideoContext.items.map((item) => (
            <article className="story-tile" role="listitem" key={item.id}>
              <div className="story-media" aria-hidden="true">{item.label.slice(0, 1)}</div>
              <h3>{item.label}</h3>
              <p>{item.mediaLabel}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No related media projection" description="Story and video context is empty or degraded for this PDP read." />
      )}
    </section>
  );
}

function ReviewQaSurface({ product }: { product: PdpProductDecisionProjection }) {
  return (
    <section className="pdp-review-qa" aria-labelledby="pdp-review-qa-title">
      <div className="section-heading">
        <span className="placeholder-label">Review and Q&A</span>
        <h2 id="pdp-review-qa-title">Customer context projections</h2>
      </div>
      <details open>
        <summary>Reviews</summary>
        <p>{product.reviewSummary.ratingText ?? product.reviewSummary.countText}</p>
        <p>{product.reviewSummary.previewSnippet ?? 'No review preview snippet available.'}</p>
        <button type="button">Review action placeholder</button>
      </details>
      <details>
        <summary>Questions and answers</summary>
        <p>{product.qaSummary.countText}</p>
        <p>{product.qaSummary.previewQuestion ?? 'No Q&A preview snippet available.'}</p>
        <button type="button">Ask question placeholder</button>
      </details>
    </section>
  );
}

function InteractionSurface({ product }: { product: PdpProductDecisionProjection }) {
  return (
    <section className="pdp-interactions" aria-label="Product interaction placeholders">
      <button type="button" aria-label="Like product placeholder">{product.interactionCounters.likeText}</button>
      <button type="button" aria-label="Save product placeholder">{product.interactionCounters.saveText}</button>
      <button type="button" aria-label="Share product placeholder">{product.interactionCounters.shareText}</button>
    </section>
  );
}

function PdpSkeleton() {
  return (
    <>
      <LoadingState title="Loading PDP projection" description="Waiting for product, media, variant, review, Q&A, and story read projections." />
      <section className="pdp-shell" aria-label="PDP loading skeleton">
        <div className="pdp-gallery">
          <div className="pdp-primary-media" data-status="loading"><span>Media loading</span></div>
        </div>
        <div className="pdp-info">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
        </div>
      </section>
    </>
  );
}
