export interface ErrorStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <section className="state" data-kind="error" role="alert">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
