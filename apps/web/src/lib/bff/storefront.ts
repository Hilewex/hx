import type { PublicProjectionEnvelope, StorefrontResponse } from '@hx/contracts';
import { readBffProjectionState } from './read';

export type StorefrontReadProjection = StorefrontResponse;

export function readStorefrontProjection(slug: string): Promise<PublicProjectionEnvelope<StorefrontReadProjection>> {
  return readBffProjectionState<StorefrontReadProjection>(`/storefront/public/${encodeURIComponent(slug)}`);
}
