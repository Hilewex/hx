import type { PublicProjectionEnvelope, StorySurface, StoryTrayResponse } from '@hx/contracts';
import { readBffProjectionState } from './read';

export function readStoryProjection(options: {
  surface: StorySurface;
  storefrontId?: string;
  productId?: string;
  limit?: number;
}): Promise<PublicProjectionEnvelope<StoryTrayResponse>> {
  const params = new URLSearchParams({ surface: options.surface });
  if (options.storefrontId) params.set('storefrontId', options.storefrontId);
  if (options.productId) params.set('productId', options.productId);
  if (options.limit) params.set('limit', String(options.limit));

  return readBffProjectionState<StoryTrayResponse>(`/story/tray?${params.toString()}`);
}
