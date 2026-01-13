import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

      const [{ data: shows, error: showsError }, { data: locomotionExpenses, error: expensesError }, { data: additionalExpenses, error: additionalError }] = await Promise.all([
        showsQuery,
        supabase
          .from('locomotion_expenses')
          .select('cost, created_at')
          .eq('uid', user.id)
          .gte('created_at', `${year}-01-01`)
          .lte('created_at', `${year}-12-31`),
        supabase
          .from('additional_expenses')
          .select('cost, expense_date')
          .eq('uid', user.id)
          .gte('expense_date', `${year}-01-01`)
          .lte('expense_date', `${year}-12-31`)
      ]);

      if (showsError) throw showsError;
      if (expensesError) throw expensesError;
      if (additionalError) throw additionalError;

      (shows || []).forEach((show) => {
        const date = parseISO(show.date_local);
        const monthKey = format(date, 'MMM', { locale: ptBR }).toLowerCase();
        const monthIndex = months.findIndex(m => m.startsWith(monthKey.substring(0, 3)));
        const month = months[monthIndex];

        if (month) {
          if (userRole === 'artist') {
            const fee = Number(show.fee || 0);
            monthlyMap[month].revenue += fee;
            
            const expensesTeam = (show.expenses_team as any) || [];
            const expensesOther = (show.expenses_other as any) || [];
            
            expensesTeam.forEach((exp: any) => {
              monthlyMap[month].expenses += Number(exp.cost || 0);
            });
            expensesOther.forEach((exp: any) => {
              monthlyMap[month].expenses += Number(exp.cost || 0);
            });
            
            console.log(`[Artist] Show em ${month}: Fee R$${fee}, Total expenses: R$${monthlyMap[month].expenses}`);
          } else {
            const expensesTeam = (show.expenses_team as any) || [];
            const myExpense = expensesTeam.find((exp: any) => exp.musicianId === user.id);
            if (myExpense) {
              const cacheFee = Number(myExpense.cost || 0);
              monthlyMap[month].revenue += cacheFee;
              console.log(`[Musician] Show em ${month}: Cachê R$${cacheFee}`);
            }
          }
        }
      });

      (locomotionExpenses || []).forEach((exp) => {
        const date = parseISO(exp.created_at);
        const monthKey = format(date, 'MMM', { locale: ptBR }).toLowerCase();
        const monthIndex = months.findIndex(m => m.startsWith(monthKey.substring(0, 3)));
        const month = months[monthIndex];

        if (month) {
          const cost = Number(exp.cost || 0);
          monthlyMap[month].expenses += cost;
          console.log(`[Locomoção] ${month}: R$${cost}`);
        }
      });

      // Add additional expenses (equipment, accessories, etc.)
      (additionalExpenses || []).forEach((exp) => {
        const date = parseISO(exp.expense_date);
        const monthKey = format(date, 'MMM', { locale: ptBR }).toLowerCase();
        const monthIndex = months.findIndex(m => m.startsWith(monthKey.substring(0, 3)));
        const month = months[monthIndex];

        if (month) {
          const cost = Number(exp.cost || 0);
          monthlyMap[month].expenses += cost;
          console.log(`[Despesas Adicionais] ${month}: R$${cost}`);
        }
      });

      const result = months.map(month => ({
        month,
        receita: monthlyMap[month].revenue,
        despesa: monthlyMap[month].expenses,
        lucro: monthlyMap[month].revenue - monthlyMap[month].expenses,
      }));

      console.log('[useMonthlyData] Dados finais:', result);
      console.log(`[useMonthlyData] Total receita: R$${result.reduce((sum, m) => sum + m.receita, 0)}`);
      console.log(`[useMonthlyData] Total despesa: R$${result.reduce((sum, m) => sum + m.despesa, 0)}`);
      
      return result;
    },
    enabled: !!user && !!userRole,
  });

  return { data, loading: isLoading };
}
