import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

interface MusicianStats {
  totalShows: number;
  totalEarnings: number;
  totalArtists: number;
  totalExpenses: number;
  loading: boolean;
}

export function useMusicianStats(period: string) {
  const { user } = useAuth();

  const { data: stats = {
    totalShows: 0,
    totalEarnings: 0,
    totalArtists: 0,
    totalExpenses: 0,
    loading: false,
  }, isLoading } = useQuery({
    queryKey: ['musician-stats', user?.id, period],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let showsQuery = supabase
        .from('shows')
        .select('*')
        .contains('team_musician_ids', [user.id]);

      let locomotionQuery = supabase
        .from('locomotion_expenses')
        .select('cost, created_at')
        .eq('uid', user.id);

      if (period !== 'all') {
        const [year, month] = period.split('-');
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
        showsQuery = showsQuery.gte('date_local', startDate).lte('date_local', endDate);
        locomotionQuery = locomotionQuery.gte('created_at', startDate).lte('created_at', endDate);
      }

      const [{ data: shows, error: showsError }, { data: artists, error: artistsError }, { data: locomotionExpenses, error: expensesError }] = await Promise.all([
        showsQuery,
        supabase.from('artists').select('id').eq('owner_uid', user.id),
        locomotionQuery
      ]);

      if (showsError) throw showsError;
      if (artistsError) throw artistsError;
      if (expensesError) throw expensesError;

      let totalShows = 0;
      let totalEarnings = 0;

      (shows || []).forEach((show) => {
        if (period === 'all') {
          totalShows++;
        } else {
          const showDate = show.date_local;
          const [year, month] = period.split('-');
          if (showDate.startsWith(`${year}-${month}`)) {
            totalShows++;
          }
        }

        const expensesTeam = (show.expenses_team as any) || [];
        const myExpense = expensesTeam.find((exp: any) => exp.musicianId === user.id);
        if (myExpense) {
          totalEarnings += Number(myExpense.cost || 0);
        }
      });

      let totalExpenses = 0;
      (locomotionExpenses || []).forEach((exp) => {
        totalExpenses += Number(exp.cost || 0);
      });

      return {
        totalShows,
        totalEarnings,
        totalArtists: artists?.length || 0,
        totalExpenses,
        loading: false,
      };
    },
    enabled: !!user,
  });

  return { ...stats, loading: isLoading };
}
