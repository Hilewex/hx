'use client';

import { useQuery } from '@tanstack/react-query';
import { readHomeProjection } from '../lib/bff/home';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';
import { SurfaceCard } from './surface-card';

export function HomeDataReadiness() {
  const query = useQuery({
    queryKey: projectionQueryKeys.home(),
    queryFn: readHomeProjection,
  });

  if (query.isLoading) {
    return <LoadingState title="Loading home projection" description="Waiting for BFF read data." />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Home projection failed"
        description="The read layer returned an error. No browser fallback truth is being generated."
        action={
          <button className="shell-action" type="button" onClick={() => void query.refetch()}>
            Retry
          </button>
        }
      />
    );
  }

  const projection = query.data;
  if (!projection?.data) {
    return (
      <DegradedState
        title="Home projection unavailable"
        description="The BFF read completed without a usable projection payload."
      />
    );
  }

  if (projection.transport.status !== 'available' || projection.transport.warnings?.length) {
    return (
      <DegradedState
        title="Home projection degraded"
        description="The BFF projection is available with warnings. The browser is only displaying the read status."
        action={
          <button className="shell-action" type="button" onClick={() => void query.refetch()}>
            Retry
          </button>
        }
      />
    );
  }

  return (
    <SurfaceCard title="Home projection connected" eyebrow="BFF read">
      <p>{projection.data.discoverFeed.length + projection.data.products.length + projection.data.stories.length} projected candidates are available from the typed read adapter.</p>
    </SurfaceCard>
  );
}
