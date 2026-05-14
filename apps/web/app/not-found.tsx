import Link from 'next/link';
import { ErrorState } from '../src/components/error-state';

export default function NotFound() {
  return (
    <ErrorState
      title="Page not found"
      description="This route is not available in the current web shell foundation."
      action={<Link className="shell-action" href="/">Go home</Link>}
    />
  );
}
