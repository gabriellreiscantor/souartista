import { useEffect, useState } from 'react';
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
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShows = async () => {
    if (!user || !userRole) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('shows')
        .select('*')
        .order('date_local', { ascending: true });

      if (userRole === 'artist') {
        // Artist sees shows they created
        query = query.eq('uid', user.id);
      } else {
        // Musician sees shows where they're in the team
        query = query.contains('team_musician_ids', [user.id]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[useShows] Error fetching shows:', fetchError);
        setError(fetchError.message);
        setShows([]);
      } else {
        // Cast Json types to proper arrays
        const typedShows = (data || []).map(show => ({
          ...show,
          expenses_team: (show.expenses_team as any) || [],
          expenses_other: (show.expenses_other as any) || [],
        })) as Show[];
        setShows(typedShows);
      }
    } catch (err) {
      console.error('[useShows] Unexpected error:', err);
      setError('Erro ao carregar shows');
      setShows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, [user, userRole]);

  return {
    shows,
    loading,
    error,
    refetch: fetchShows,
  };
}
