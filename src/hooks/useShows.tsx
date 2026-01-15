import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Show {
  id: string;
  uid: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
  is_private_event: boolean;
  expenses_team: Array<{
    musicianId?: string;
    name: string;
    instrument: string;
    cost: number;
  }>;
  expenses_other: Array<{
    description: string;
    cost: number;
  }>;
  team_musician_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useShows() {
  const { user, userRole } = useAuth();

  const { data: shows = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['shows', user?.id, userRole],
    queryFn: async () => {
      if (!user || !userRole) return [];

      let query = supabase
        .from('shows')
        .select('*')
        .order('date_local', { ascending: true });

      if (userRole === 'artist') {
        query = query.eq('uid', user.id);
      } else {
        query = query.contains('team_musician_ids', [user.id]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[useShows] Error fetching shows:', fetchError);
        throw fetchError;
      }

      return (data || []).map(show => ({
        ...show,
        expenses_team: (show.expenses_team as any) || [],
        expenses_other: (show.expenses_other as any) || [],
      })) as Show[];
    },
    enabled: !!user && !!userRole,
    staleTime: 1000 * 60 * 5, // 5 minutos - dados são considerados frescos
    gcTime: 1000 * 60 * 60 * 24, // 24 horas - mantém em cache
    networkMode: 'offlineFirst', // Usa cache primeiro quando offline
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Não tenta novamente se estiver offline
      if (!navigator.onLine) return false;
      return failureCount < 2;
    },
  });

  return {
    shows,
    loading: isLoading,
    isFetching,
    error: error?.message || null,
    refetch,
  };
}
