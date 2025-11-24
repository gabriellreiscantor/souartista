import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
}

export function useUpcomingShows(userRole: 'artist' | 'musician' | null, limit = 5) {
  const { user } = useAuth();

  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['upcoming-shows', user?.id, userRole, limit],
    queryFn: async () => {
      if (!user || !userRole) return [];

      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('shows')
        .select('id, venue_name, date_local, time_local, fee')
        .gte('date_local', today)
        .order('date_local', { ascending: true })
        .limit(limit);

      if (userRole === 'artist') {
        query = query.eq('uid', user.id);
      } else {
        query = query.contains('team_musician_ids', [user.id]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!user && !!userRole,
  });

  return { shows, loading: isLoading };
}
