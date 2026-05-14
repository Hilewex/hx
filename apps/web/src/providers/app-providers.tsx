'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>{children}</SessionProvider>
    </QueryProvider>
  );
}
