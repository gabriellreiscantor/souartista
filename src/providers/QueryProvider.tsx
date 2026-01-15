import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      gcTime: 1000 * 60 * 60 * 24, // 24 horas (para persistência)
      refetchOnWindowFocus: true,
      retry: 1,
      networkMode: 'offlineFirst', // Tenta usar cache primeiro quando offline
    },
  },
});

// Persister usando localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'souartista-cache',
  throttleTime: 1000, // Throttle saves para performance
});

export { queryClient };

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // Cache válido por 24 horas
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Persistir apenas queries de dados importantes
            const queryKey = query.queryKey[0];
            const persistableQueries = [
              'shows',
              'artistStats',
              'musicianStats',
              'monthlyData',
              'upcomingShows',
              'locomotionData',
              'venues',
              'musicians',
              'artists',
              'artist-stats',
              'musician-stats',
              'additional-expenses',
            ];
            return persistableQueries.includes(queryKey as string);
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
