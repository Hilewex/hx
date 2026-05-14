export interface LoadingStateProps {
  title?: string;
  description?: string;
}

export function LoadingState({
  title = 'Loading projection',
  description = 'Waiting for the browser route to receive read data.',
}: LoadingStateProps) {
  return (
    <section className="state" data-kind="loading" aria-busy="true">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </section>
  );
}
