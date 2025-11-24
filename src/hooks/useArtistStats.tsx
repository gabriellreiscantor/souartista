import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

interface ArtistStats {
  totalShows: number;
  grossRevenue: number;
  totalCosts: number;
  netProfit: number;
  loading: boolean;
}

export function useArtistStats(period: string) {
  const { user } = useAuth();

  const { data: stats = {
    totalShows: 0,
    grossRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    loading: false,
  }, isLoading } = useQuery({
    queryKey: ['artist-stats', user?.id, period],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let showsQuery = supabase
        .from('shows')
        .select('*')
        .eq('uid', user.id)
        .order('date_local', { ascending: true });

      if (period !== 'all') {
        const [year, month] = period.split('-');
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${lastDay}`;
        showsQuery = showsQuery.gte('date_local', startDate).lte('date_local', endDate);
      }

      const [{ data: shows, error: showsError }, { data: locomotionExpenses, error: expensesError }] = await Promise.all([
        showsQuery,
        period !== 'all'
          ? supabase
              .from('locomotion_expenses')
              .select('cost')
              .eq('uid', user.id)
              .gte('created_at', `${period}-01`)
              .lte('created_at', `${period}-31`)
          : supabase.from('locomotion_expenses').select('cost').eq('uid', user.id)
      ]);

      if (showsError) throw showsError;
      if (expensesError) throw expensesError;

      let totalShows = 0;
      let grossRevenue = 0;
      let totalCosts = 0;

      (shows || []).forEach((show) => {
        totalShows++;
        grossRevenue += Number(show.fee || 0);

        const expensesTeam = (show.expenses_team as any) || [];
        const expensesOther = (show.expenses_other as any) || [];

        expensesTeam.forEach((exp: any) => {
          totalCosts += Number(exp.cost || 0);
        });

        expensesOther.forEach((exp: any) => {
          totalCosts += Number(exp.cost || 0);
        });
      });

      (locomotionExpenses || []).forEach((exp) => {
        totalCosts += Number(exp.cost || 0);
      });

      const netProfit = grossRevenue - totalCosts;

      return {
        totalShows,
        grossRevenue,
        totalCosts,
        netProfit,
        loading: false,
      };
    },
    enabled: !!user,
  });

  return { ...stats, loading: isLoading };
}
