import type { PublicHomeProjection, PublicProjectionEnvelope } from '@hx/contracts';
import { readCategoryListProjection } from './category';
import { readCatalogProjection } from './catalog';
import { readDiscoverProjection } from './discover';
import { readStoryProjection } from './story';

export async function readHomeProjection(): Promise<PublicProjectionEnvelope<PublicHomeProjection>> {
  const [stories, discover, products, categories] = await Promise.all([
    readStoryProjection({ surface: 'HOME', limit: 8 }),
    readDiscoverProjection({ surface: 'HOME', limit: 8 }),
    readCatalogProjection({ limit: 8 }),
    readCategoryListProjection({ limit: 8 }),
  ]);

  const envelopes = [stories, discover, products, categories];
  const warnings = envelopes.flatMap((envelope) => envelope.transport.warnings ?? []);
  const unavailableCount = envelopes.filter((envelope) =>
    ['timeout', 'unavailable', 'error'].includes(envelope.transport.status),
  ).length;
  const availableCount = envelopes.length - unavailableCount;

  if (availableCount === 0) {
    return {
      transport: {
        status: unavailableCount > 0 ? 'unavailable' : 'empty',
        retryable: envelopes.some((envelope) => envelope.transport.retryable),
        warnings,
        error: envelopes.find((envelope) => envelope.transport.error)?.transport.error,
      },
    };
  }

  const isPartial = unavailableCount > 0;

  return {
    transport: {
      status: isPartial ? 'partial' : warnings.length > 0 ? 'degraded' : 'available',
      retryable: envelopes.some((envelope) => envelope.transport.retryable),
      warnings,
    },
    data: {
      hero: {
        title: 'Browse creators, stories, and product candidates',
        description:
          'The browser renders public read projections only; commerce, ranking, moderation, availability, and permission truth stay outside this UI.',
        projectionOwner: 'bff_public_discovery_read',
      },
      stories: stories.data?.items ?? [],
      discoverFeed: discover.data?.candidates ?? [],
      products: products.data?.productCards ?? [],
      creatorSpotlight: discover.data?.candidates.filter((candidate) => candidate.kind === 'storefront') ?? [],
      categories: categories.data?.items ?? [],
      warnings,
    },
  };
}
