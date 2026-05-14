import type {
  CreatorContentManagementProjection,
  CreatorManagementProjection,
  CreatorProductManagementProjection,
  CreatorStorefrontProfileProjection,
  PublicProjectionEnvelope,
} from '@hx/contracts';
import { readBffProjectionState } from './read';

export type CreatorDashboardReadProjection = CreatorManagementProjection;
export type CreatorStorefrontReadProjection = CreatorStorefrontProfileProjection;
export type CreatorProductsReadProjection = CreatorProductManagementProjection;
export type CreatorContentReadProjection = CreatorContentManagementProjection;

export function readCreatorDashboardProjection(): Promise<PublicProjectionEnvelope<CreatorDashboardReadProjection>> {
  return readBffProjectionState<CreatorDashboardReadProjection>('/creator');
}

export function readCreatorStorefrontManagementProjection(): Promise<PublicProjectionEnvelope<CreatorStorefrontReadProjection>> {
  return readBffProjectionState<CreatorStorefrontReadProjection>('/creator/storefront');
}

export function readCreatorProductsManagementProjection(): Promise<PublicProjectionEnvelope<CreatorProductsReadProjection>> {
  return readBffProjectionState<CreatorProductsReadProjection>('/creator/products');
}

export function readCreatorContentManagementProjection(): Promise<PublicProjectionEnvelope<CreatorContentReadProjection>> {
  return readBffProjectionState<CreatorContentReadProjection>('/creator/content');
}
