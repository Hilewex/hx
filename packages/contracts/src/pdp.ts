import type { CatalogVariantAvailabilityStatus, ProductMedia } from './catalog';
import type { PublicProjectionTransport } from './discovery';

export type PdpProjectionSectionStatus =
  | 'available'
  | 'degraded'
  | 'empty'
  | 'pending'
  | 'unavailable';

export interface PdpCreatorStoreContextProjection {
  storefrontId?: string;
  displayName: string;
  creatorNote?: string;
  profileHref?: string;
  contextTruth: false;
  creatorAuthorityTruth: false;
  warnings?: string[];
}

export interface PdpMediaPreviewProjection extends ProductMedia {
  alt: string;
  status: PdpProjectionSectionStatus;
  mediaTruth: false;
  warnings?: string[];
}

export interface PdpVariantPreviewProjection {
  variantId: string;
  label: string;
  options: Record<string, string>;
  availabilityStatus?: CatalogVariantAvailabilityStatus;
  projectionText: string;
  selectablePreview: boolean;
  variantTruth: false;
  stockTruth: false;
  purchaseEligibilityTruth: false;
  warnings?: string[];
}

export interface PdpReviewSummaryProjection {
  status: PdpProjectionSectionStatus;
  countText: string;
  ratingText?: string;
  previewSnippet?: string;
  reviewEligibilityTruth: false;
  verifiedPurchaseTruth: false;
  warnings?: string[];
}

export interface PdpQaSummaryProjection {
  status: PdpProjectionSectionStatus;
  countText: string;
  previewQuestion?: string;
  qaEligibilityTruth: false;
  moderationDecisionTruth: false;
  warnings?: string[];
}

export interface PdpStoryVideoContextProjection {
  status: PdpProjectionSectionStatus;
  items: Array<{
    id: string;
    label: string;
    mediaLabel: string;
    storyTruth: false;
    moderationDecisionTruth: false;
    warnings?: string[];
  }>;
  warnings?: string[];
}

export interface PdpInteractionCountersProjection {
  likeText: string;
  saveText: string;
  shareText: string;
  analyticsTruth: false;
  recommendationTruth: false;
}

export interface PdpProductDecisionProjection {
  productId: string;
  title: string;
  subtitle?: string;
  description?: string;
  creatorStoreContext?: PdpCreatorStoreContextProjection;
  media: PdpMediaPreviewProjection[];
  variants: PdpVariantPreviewProjection[];
  defaultVariantId?: string;
  reviewSummary: PdpReviewSummaryProjection;
  qaSummary: PdpQaSummaryProjection;
  storyVideoContext: PdpStoryVideoContextProjection;
  interactionCounters: PdpInteractionCountersProjection;
  safePriceText: string;
  safeAvailabilityText: string;
  addToCartReadinessText: string;
  productProjectionTruth: false;
  priceTruth: false;
  stockTruth: false;
  availabilityTruth: false;
  variantTruth: false;
  purchaseEligibilityTruth: false;
  checkoutReadinessTruth: false;
  paymentOrderTruth: false;
  moderationDecisionTruth: false;
  warnings?: string[];
}

export interface PdpProductDecisionProjectionEnvelope {
  transport: PublicProjectionTransport;
  data?: PdpProductDecisionProjection;
}
