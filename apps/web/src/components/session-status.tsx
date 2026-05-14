'use client';

import { useSessionProjection } from '../providers/session-provider';

export function SessionStatus() {
  const { projection, isError, refresh } = useSessionProjection();

  const label = isError
    ? 'Session unavailable'
    : projection.kind === 'authenticated'
      ? 'Authenticated'
      : projection.kind === 'guest'
        ? 'Guest'
        : 'Session loading';

  return (
    <button className="shell-action" type="button" onClick={refresh} aria-label="Refresh session projection">
      {label}
    </button>
  );
}
