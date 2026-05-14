'use client';

import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import {
  readSessionProjection,
  unknownSessionProjection,
  type SessionProjection,
} from '../lib/bff/session';
import { projectionQueryKeys } from '../lib/bff/query-keys';

interface SessionProviderValue {
  projection: SessionProjection;
  isError: boolean;
  refresh: () => void;
}

const SessionContext = createContext<SessionProviderValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: projectionQueryKeys.session(),
    queryFn: readSessionProjection,
    staleTime: 15_000,
    retry: false,
  });

  const projection = query.data ?? unknownSessionProjection;

  return (
    <SessionContext.Provider
      value={{
        projection,
        isError: query.isError,
        refresh: () => void query.refetch(),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionProjection(): SessionProviderValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSessionProjection must be used within SessionProvider');
  }

  return value;
}
