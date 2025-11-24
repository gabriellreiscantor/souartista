import { useEffect, useState } from 'react';
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
  const [stats, setStats] = useState<MusicianStats>({
    totalShows: 0,
    totalEarnings: 0,
    totalArtists: 0,
    totalExpenses: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        let query = supabase
          .from('shows')
          .select('*')
          .contains('team_musician_ids', [user.id]);

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

        // Fetch artists to count unique ones
        const { data: artists } = await supabase
          .from('artists')
          .select('id')
          .eq('owner_uid', user.id);

        // Fetch locomotion expenses
        const { data: locomotionExpenses } = await supabase
          .from('locomotion_expenses')
          .select('cost, created_at')
          .eq('uid', user.id);

        const filteredShows = shows || [];
        const uniqueArtists = new Set<string>();
        let totalEarnings = 0;
        let totalExpenses = 0;

        filteredShows.forEach((show) => {
          uniqueArtists.add(show.uid);
          
          const expensesTeam = (show.expenses_team as any) || [];
          
          expensesTeam.forEach((exp: any) => {
            if (exp.musicianId === user.id) {
              totalEarnings += Number(exp.cost || 0);
            }
          });
        });

        // Add locomotion expenses for the period
        if (locomotionExpenses) {
          locomotionExpenses.forEach((exp) => {
            if (period === 'all') {
              totalExpenses += Number(exp.cost || 0);
            } else {
              const [year, month] = period.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);
              const start = startOfMonth(date);
              const end = endOfMonth(date);
              const expDate = parseISO(exp.created_at);
              
              if (isWithinInterval(expDate, { start, end })) {
                totalExpenses += Number(exp.cost || 0);
              }
            }
          });
        }

        setStats({
          totalShows: filteredShows.length,
          totalEarnings,
          totalArtists: artists?.length || 0,
          totalExpenses,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching musician stats:', error);
        setStats({
          totalShows: 0,
          totalEarnings: 0,
          totalArtists: 0,
          totalExpenses: 0,
          loading: false,
        });
      }
    };

    fetchStats();
  }, [user, period]);

  return stats;
}
