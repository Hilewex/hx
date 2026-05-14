'use client';

import { ErrorState } from '../src/components/error-state';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Route failed to render"
      description="The browser shell caught a rendering error. No client-side business decision was made."
      action={<button className="shell-action" onClick={() => reset()}>Retry</button>}
    />
  );
}
