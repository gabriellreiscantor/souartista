import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parseISO, format } from 'date-fns';

interface MonthlyDataPoint {
  month: string;
  receita: number;
  despesa: number;
  lucro: number;
}

export function useMonthlyData(year: string, userRole: 'artist' | 'musician' | null) {
  const { user } = useAuth();

  const { data = [], isLoading } = useQuery({
    queryKey: ['monthly-data', user?.id, userRole, year],
    queryFn: async () => {
      if (!user || !userRole) return [];

      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const monthlyMap: Record<string, { revenue: number; expenses: number }> = {};

      months.forEach(month => {
        monthlyMap[month] = { revenue: 0, expenses: 0 };
      });

      let showsQuery = supabase
        .from('shows')
        .select('*')
        .gte('date_local', `${year}-01-01`)
        .lte('date_local', `${year}-12-31`);

      if (userRole === 'artist') {
        showsQuery = showsQuery.eq('uid', user.id);
      } else {
        showsQuery = showsQuery.contains('team_musician_ids', [user.id]);
      }

      const [{ data: shows, error: showsError }, { data: locomotionExpenses, error: expensesError }] = await Promise.all([
        showsQuery,
        supabase
          .from('locomotion_expenses')
          .select('cost, created_at')
          .eq('uid', user.id)
          .gte('created_at', `${year}-01-01`)
          .lte('created_at', `${year}-12-31`)
      ]);

      if (showsError) throw showsError;
      if (expensesError) throw expensesError;

      (shows || []).forEach((show) => {
        const date = parseISO(show.date_local);
        const monthKey = format(date, 'MMM').toLowerCase();
        const monthIndex = months.findIndex(m => m.startsWith(monthKey.substring(0, 3)));
        const month = months[monthIndex];

        if (month) {
          if (userRole === 'artist') {
            monthlyMap[month].revenue += Number(show.fee || 0);
            const expensesTeam = (show.expenses_team as any) || [];
            const expensesOther = (show.expenses_other as any) || [];
            expensesTeam.forEach((exp: any) => {
              monthlyMap[month].expenses += Number(exp.cost || 0);
            });
            expensesOther.forEach((exp: any) => {
              monthlyMap[month].expenses += Number(exp.cost || 0);
            });
          } else {
            const expensesTeam = (show.expenses_team as any) || [];
            const myExpense = expensesTeam.find((exp: any) => exp.musicianId === user.id);
            if (myExpense) {
              monthlyMap[month].revenue += Number(myExpense.cost || 0);
            }
          }
        }
      });

      (locomotionExpenses || []).forEach((exp) => {
        const date = parseISO(exp.created_at);
        const monthKey = format(date, 'MMM').toLowerCase();
        const monthIndex = months.findIndex(m => m.startsWith(monthKey.substring(0, 3)));
        const month = months[monthIndex];

        if (month) {
          monthlyMap[month].expenses += Number(exp.cost || 0);
        }
      });

      return months.map(month => ({
        month,
        revenue: monthlyMap[month].revenue,
        expenses: monthlyMap[month].expenses,
        profit: monthlyMap[month].revenue - monthlyMap[month].expenses,
      }));
    },
    enabled: !!user && !!userRole,
  });

  return { data, loading: isLoading };
}
