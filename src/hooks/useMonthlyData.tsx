import { useEffect, useState } from 'react';
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
  const [data, setData] = useState<MonthlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userRole) return;

    const fetchMonthlyData = async () => {
      try {
        let query = supabase
          .from('shows')
          .select('*')
          .gte('date_local', `${year}-01-01`)
          .lte('date_local', `${year}-12-31`);

        if (userRole === 'artist') {
          query = query.eq('uid', user.id);
        } else {
          query = query.contains('team_musician_ids', [user.id]);
        }

        const { data: shows, error } = await query;

        if (error) throw error;

        // Fetch locomotion expenses
        const { data: locomotionExpenses } = await supabase
          .from('locomotion_expenses')
          .select('cost, created_at')
          .eq('uid', user.id)
          .gte('created_at', `${year}-01-01`)
          .lte('created_at', `${year}-12-31`);

        // Initialize monthly data
        const monthlyMap: Record<string, { receita: number; despesa: number }> = {};
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        
        months.forEach(month => {
          monthlyMap[month] = { receita: 0, despesa: 0 };
        });

        // Process shows
        (shows || []).forEach((show) => {
          const date = parseISO(show.date_local);
          const monthKey = format(date, 'MMM').toLowerCase();
          const monthIndex = months.findIndex(m => m.startsWith(monthKey.substring(0, 3)));
          const month = months[monthIndex];

          if (userRole === 'artist') {
            monthlyMap[month].receita += Number(show.fee || 0);
            
            const expensesTeam = (show.expenses_team as any) || [];
            const expensesOther = (show.expenses_other as any) || [];
            
            expensesTeam.forEach((exp: any) => {
              monthlyMap[month].despesa += Number(exp.cost || 0);
            });
            
            expensesOther.forEach((exp: any) => {
              monthlyMap[month].despesa += Number(exp.cost || 0);
            });
          } else {
            const expensesTeam = (show.expenses_team as any) || [];
            expensesTeam.forEach((exp: any) => {
              if (exp.musicianId === user.id) {
                monthlyMap[month].receita += Number(exp.cost || 0);
              }
            });
          }
        });

        // Add locomotion expenses
        (locomotionExpenses || []).forEach((exp) => {
          const date = parseISO(exp.created_at);
          const monthKey = format(date, 'MMM').toLowerCase();
          const monthIndex = months.findIndex(m => m.startsWith(monthKey.substring(0, 3)));
          const month = months[monthIndex];
          
          if (month) {
            monthlyMap[month].despesa += Number(exp.cost || 0);
          }
        });

        // Convert to array format
        const monthlyData = months.map(month => ({
          month,
          receita: monthlyMap[month].receita,
          despesa: monthlyMap[month].despesa,
          lucro: monthlyMap[month].receita - monthlyMap[month].despesa,
        }));

        setData(monthlyData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching monthly data:', error);
        setData([]);
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [user, userRole, year]);

  return { data, loading };
}
