import { useEffect, useState } from 'react';
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
  const [stats, setStats] = useState<ArtistStats>({
    totalShows: 0,
    grossRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        let query = supabase
          .from('shows')
          .select('*')
          .eq('uid', user.id);

        // Apply period filter
        if (period !== 'all') {
          const [year, month] = period.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          const start = startOfMonth(date);
          const end = endOfMonth(date);
          
          query = query
            .gte('date_local', start.toISOString().split('T')[0])
            .lte('date_local', end.toISOString().split('T')[0]);
        }

        const { data: shows, error } = await query;

        if (error) throw error;

        // Fetch locomotion expenses
        const { data: locomotionExpenses } = await supabase
          .from('locomotion_expenses')
          .select('cost, created_at')
          .eq('uid', user.id);

        const filteredShows = shows || [];
        let totalShows = filteredShows.length;
        let grossRevenue = 0;
        let totalCosts = 0;

        filteredShows.forEach((show) => {
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

        // Add locomotion expenses for the period
        if (locomotionExpenses) {
          locomotionExpenses.forEach((exp) => {
            if (period === 'all') {
              totalCosts += Number(exp.cost || 0);
            } else {
              const [year, month] = period.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);
              const start = startOfMonth(date);
              const end = endOfMonth(date);
              const expDate = parseISO(exp.created_at);
              
              if (isWithinInterval(expDate, { start, end })) {
                totalCosts += Number(exp.cost || 0);
              }
            }
          });
        }

        const netProfit = grossRevenue - totalCosts;

        setStats({
          totalShows,
          grossRevenue,
          totalCosts,
          netProfit,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching artist stats:', error);
        setStats({
          totalShows: 0,
          grossRevenue: 0,
          totalCosts: 0,
          netProfit: 0,
          loading: false,
        });
      }
    };

    fetchStats();
  }, [user, period]);

  return stats;
}
