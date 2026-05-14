export interface DegradedStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function DegradedState({ title, description, action }: DegradedStateProps) {
  return (
    <section className="state" data-kind="degraded">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
