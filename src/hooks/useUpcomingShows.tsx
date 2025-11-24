import { useEffect, useState } from 'react';
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
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userRole) return;

    const fetchUpcomingShows = async () => {
      try {
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

        setShows(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching upcoming shows:', error);
        setShows([]);
        setLoading(false);
      }
    };

    fetchUpcomingShows();
  }, [user, userRole, limit]);

  return { shows, loading };
}
