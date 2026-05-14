export interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="state" data-kind="empty" aria-live="polite">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
