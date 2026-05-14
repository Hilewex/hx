import type {
  CatalogProductReadProjection,
  CatalogVariantAvailabilityStatus,
  PdpProductDecisionProjection,
  PdpProductDecisionProjectionEnvelope,
  PdpProjectionSectionStatus,
  PublicProjectionEnvelope,
  PublicProjectionTransport,
  QaQuestionListResponse,
  ReviewListResponse,
  ReviewRatingSummary,
  StoryTrayResponse,
  StorefrontContext,
} from '@hx/contracts';
import { readBffProjectionState } from './read';

interface PdpBffResponse {
  product: CatalogProductReadProjection;
  storefrontContext?: StorefrontContext;
  warnings?: string[];
}

interface RatingSummaryResponse {
  success?: boolean;
  ratingSummary?: ReviewRatingSummary;
  warnings?: string[];
}

export async function readPdpProductProjection(options: {
  productId: string;
  storefrontId?: string;
}): Promise<PdpProductDecisionProjectionEnvelope> {
  const productId = options.productId.trim();
  const storefrontId = options.storefrontId?.trim();
  const pdpPath = `/catalog/pdp/${encodeURIComponent(productId)}${storefrontId ? `?storefrontId=${encodeURIComponent(storefrontId)}` : ''}`;
  const product = await readBffProjectionState<PdpBffResponse>(pdpPath);

  if (!product.data?.product) {
    return {
      transport: normalizeMissingProductTransport(product.transport),
    };
  }

  const [stories, rating, reviews, qa] = await Promise.all([
    readBffProjectionState<StoryTrayResponse>(
      `/story/tray?surface=PDP&productId=${encodeURIComponent(productId)}${storefrontId ? `&storefrontId=${encodeURIComponent(storefrontId)}` : ''}&limit=6`,
    ),
    readBffProjectionState<RatingSummaryResponse>(`/rating/product/${encodeURIComponent(productId)}`),
    readBffProjectionState<ReviewListResponse>(`/review/list?productId=${encodeURIComponent(productId)}&visibilityState=VISIBLE&limit=2`),
    readBffProjectionState<QaQuestionListResponse>(
      `/qa/question/list?productId=${encodeURIComponent(productId)}&visibilityState=VISIBLE&includeAnswers=true&limit=2`,
    ),
  ]);

  const data = mapPdpProjection(product.data, {
    productTransport: product.transport,
    stories,
    rating,
    reviews,
    qa,
  });

  return {
    data,
    transport: combineTransport([product.transport, stories.transport, rating.transport, reviews.transport, qa.transport], data.warnings),
  };
}

function mapPdpProjection(
  response: PdpBffResponse,
  sections: {
    productTransport: PublicProjectionTransport;
    stories: PublicProjectionEnvelope<StoryTrayResponse>;
    rating: PublicProjectionEnvelope<RatingSummaryResponse>;
    reviews: PublicProjectionEnvelope<ReviewListResponse>;
    qa: PublicProjectionEnvelope<QaQuestionListResponse>;
  },
): PdpProductDecisionProjection {
  const product = response.product;
  const allWarnings = compactStrings([
    ...(response.warnings ?? []),
    ...(product.warnings ?? []),
    ...(sections.productTransport.warnings ?? []),
    ...(sections.stories.transport.warnings ?? []),
    ...(sections.rating.transport.warnings ?? []),
    ...(sections.reviews.transport.warnings ?? []),
    ...(sections.qa.transport.warnings ?? []),
  ]);

  return {
    productId: product.productId,
    title: product.name,
    subtitle: product.brand,
    description: product.description,
    creatorStoreContext: response.storefrontContext
      ? {
          storefrontId: response.storefrontContext.storefrontId,
          displayName: response.storefrontContext.name,
          creatorNote: response.storefrontContext.creatorNote,
          profileHref: `/store/${encodeURIComponent(response.storefrontContext.storefrontId)}`,
          contextTruth: false,
          creatorAuthorityTruth: false,
          warnings: allWarnings,
        }
      : undefined,
    media: mapMedia(product),
    variants: product.variants.map((variant) => ({
      variantId: variant.variantId,
      label: Object.values(variant.options).join(' / ') || variant.sku || variant.variantId,
      options: variant.options,
      availabilityStatus: variant.availabilityStatus,
      projectionText: variantProjectionText(variant.availabilityStatus),
      selectablePreview: true,
      variantTruth: false,
      stockTruth: false,
      purchaseEligibilityTruth: false,
      warnings: variant.warnings,
    })),
    defaultVariantId: product.defaultVariantId,
    reviewSummary: mapReviewSummary(sections.rating, sections.reviews),
    qaSummary: mapQaSummary(sections.qa),
    storyVideoContext: mapStoryVideoContext(sections.stories),
    interactionCounters: {
      likeText: 'Like projection placeholder',
      saveText: 'Save projection placeholder',
      shareText: 'Share projection placeholder',
      analyticsTruth: false,
      recommendationTruth: false,
    },
    safePriceText: product.price
      ? 'Price projection is present; final price is confirmed outside this page.'
      : 'Price projection is not available on this read.',
    safeAvailabilityText: product.stock
      ? 'Availability projection is present; stock truth is owned outside this page.'
      : 'Availability projection is not available on this read.',
    addToCartReadinessText: 'Action readiness waits for owner validation. This surface does not create cart, checkout, or payment truth.',
    productProjectionTruth: false,
    priceTruth: false,
    stockTruth: false,
    availabilityTruth: false,
    variantTruth: false,
    purchaseEligibilityTruth: false,
    checkoutReadinessTruth: false,
    paymentOrderTruth: false,
    moderationDecisionTruth: false,
    warnings: allWarnings,
  };
}

function mapMedia(product: CatalogProductReadProjection): PdpProductDecisionProjection['media'] {
  const media = product.media.length ? product.media : product.primaryMedia ? [product.primaryMedia] : [];

  if (!media.length) {
    return [
      {
        mediaId: 'missing-media-projection',
        type: 'IMAGE',
        url: '',
        isPrimary: true,
        alt: `${product.name} media projection unavailable`,
        status: 'unavailable',
        mediaTruth: false,
        warnings: ['PDP_MEDIA_PROJECTION_MISSING'],
      },
    ];
  }

  return media.map((item) => ({
    ...item,
    alt: `${product.name} ${item.type.toLowerCase()} projection`,
    status: item.url ? 'available' : 'degraded',
    mediaTruth: false,
    warnings: item.url ? undefined : ['PDP_MEDIA_URL_MISSING'],
  }));
}

function mapReviewSummary(
  rating: PublicProjectionEnvelope<RatingSummaryResponse>,
  reviews: PublicProjectionEnvelope<ReviewListResponse>,
): PdpProductDecisionProjection['reviewSummary'] {
  const summary = rating.data?.ratingSummary ?? reviews.data?.ratingSummary;
  const firstVisible = reviews.data?.items?.[0];

  return {
    status: sectionStatus(rating.transport, summary ? 1 : 0),
    countText: summary ? `${summary.reviewCount} review projection candidates` : 'Review projection unavailable',
    ratingText: summary ? `${summary.averageRating.toFixed(1)} average projection` : undefined,
    previewSnippet: firstVisible?.body,
    reviewEligibilityTruth: false,
    verifiedPurchaseTruth: false,
    warnings: compactStrings([...(rating.transport.warnings ?? []), ...(reviews.transport.warnings ?? []), ...(summary?.warnings ?? [])]),
  };
}

function mapQaSummary(qa: PublicProjectionEnvelope<QaQuestionListResponse>): PdpProductDecisionProjection['qaSummary'] {
  return {
    status: sectionStatus(qa.transport, qa.data?.items.length ?? 0),
    countText: qa.data?.items ? `${qa.data.items.length} Q&A projection candidates` : 'Q&A projection unavailable',
    previewQuestion: qa.data?.items?.[0]?.body,
    qaEligibilityTruth: false,
    moderationDecisionTruth: false,
    warnings: compactStrings([...(qa.transport.warnings ?? []), ...(qa.data?.warnings ?? [])]),
  };
}

function mapStoryVideoContext(stories: PublicProjectionEnvelope<StoryTrayResponse>): PdpProductDecisionProjection['storyVideoContext'] {
  return {
    status: sectionStatus(stories.transport, stories.data?.items.length ?? 0),
    items: (stories.data?.items ?? []).map((item) => ({
      id: item.trayItemId,
      label: item.label,
      mediaLabel: item.storyType === 'USER_PRODUCT' ? 'User product story projection' : 'Story/video projection',
      storyTruth: false,
      moderationDecisionTruth: false,
      warnings: item.warnings,
    })),
    warnings: compactStrings([...(stories.transport.warnings ?? []), ...(stories.data?.warnings ?? [])]),
  };
}

function variantProjectionText(status?: CatalogVariantAvailabilityStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Selectable projection; final availability is not decided here.';
    case 'OUT_OF_STOCK':
      return 'Projection says unavailable for now; stock truth remains external.';
    case 'UNAVAILABLE':
      return 'Projection unavailable for selection.';
    case 'UNKNOWN':
    default:
      return 'Variant projection pending or degraded.';
  }
}

function sectionStatus(transport: PublicProjectionTransport, count: number): PdpProjectionSectionStatus {
  if (transport.status === 'available') {
    return count > 0 ? 'available' : 'empty';
  }

  if (transport.status === 'degraded' || transport.status === 'partial') {
    return 'degraded';
  }

  if (transport.status === 'timeout') {
    return 'pending';
  }

  return 'unavailable';
}

function combineTransport(transports: PublicProjectionTransport[], warnings: string[] = []): PublicProjectionTransport {
  const retryable = transports.some((transport) => transport.retryable);
  const unavailable = transports.some((transport) => transport.status === 'unavailable' || transport.status === 'timeout');
  const partial = transports.some((transport) => transport.status !== 'available');
  const combinedWarnings = compactStrings([
    ...warnings,
    ...transports.flatMap((transport) => transport.warnings ?? []),
    ...transports.flatMap((transport) => (transport.error?.message ? [transport.error.message] : [])),
  ]);

  return {
    status: unavailable ? 'partial' : partial || combinedWarnings.length ? 'degraded' : 'available',
    retryable,
    warnings: combinedWarnings,
  };
}

function normalizeMissingProductTransport(transport: PublicProjectionTransport): PublicProjectionTransport {
  if (transport.error?.code === 'PRODUCT_NOT_FOUND' || transport.error?.status === 404) {
    return {
      ...transport,
      status: 'empty',
      retryable: false,
    };
  }

  return transport;
}

function compactStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
