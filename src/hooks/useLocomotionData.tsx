import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parseISO, getMonth } from 'date-fns';

interface LocomotionDataPoint {
  month: string;
  value: number;
}

export function useLocomotionData(year: string) {
  const { user } = useAuth();

  const { data: result = { data: [], totalCost: 0 }, isLoading } = useQuery({
    queryKey: ['locomotion-data', user?.id, year],
    queryFn: async () => {
      if (!user) return { data: [], totalCost: 0 };

      const { data: expenses, error } = await supabase
        .from('locomotion_expenses')
        .select('cost, created_at')
        .eq('uid', user.id)
        .gte('created_at', `${year}-01-01`)
        .lte('created_at', `${year}-12-31`);

      if (error) throw error;

      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const monthlyMap: Record<string, number> = {};

      months.forEach(month => {
        monthlyMap[month] = 0;
      });

      let total = 0;

      (expenses || []).forEach((exp) => {
        const date = parseISO(exp.created_at);
        const monthIndex = getMonth(date); // 0-11
        const month = months[monthIndex];

        if (month) {
          monthlyMap[month] += Number(exp.cost || 0);
          total += Number(exp.cost || 0);
        }
      });

      const locomotionData = months.map(month => ({
        month,
        value: monthlyMap[month],
      }));

      return {
        data: locomotionData,
        totalCost: total
      };
    },
    enabled: !!user,
  });

  return { data: result.data, totalCost: result.totalCost, loading: isLoading };
}
