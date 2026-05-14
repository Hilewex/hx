import type { ReactNode } from 'react';

export interface SurfaceCardProps {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  tone?: 'default' | 'muted';
}

export function SurfaceCard({ title, eyebrow, children, tone = 'default' }: SurfaceCardProps) {
  return (
    <section className="surface-card" data-tone={tone}>
      {eyebrow ? <span className="placeholder-label">{eyebrow}</span> : null}
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
