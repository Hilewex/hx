import { DegradedState } from './degraded-state';
import { EmptyState } from './empty-state';
import { SurfaceCard } from './surface-card';

export interface RoutePlaceholderProps {
  title: string;
  description: string;
  boundaryNote: string;
}

export function RoutePlaceholder({ title, description, boundaryNote }: RoutePlaceholderProps) {
  return (
    <div className="page-stack">
      <section className="route-title">
        <span className="placeholder-label">PHASE-10 pending implementation</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <div className="grid two">
        <SurfaceCard title="Projection container" eyebrow="Static placeholder">
          <p>{boundaryNote}</p>
        </SurfaceCard>
        <SurfaceCard title="Readiness state" eyebrow="No local truth" tone="muted">
          <p>This page is intentionally limited to shell structure until BFF read data is connected.</p>
        </SurfaceCard>
      </div>
      <EmptyState
        title="No projection loaded"
        description="The route is available, but no local mock commerce data is used as production truth."
      />
      <DegradedState
        title="BFF data unavailable"
        description="When connected, transport failures should render a degraded state without client-side domain decisions."
      />
    </div>
  );
}
