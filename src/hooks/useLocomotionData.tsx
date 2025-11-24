import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parseISO, format } from 'date-fns';

interface LocomotionDataPoint {
  month: string;
  value: number;
}

export function useLocomotionData(year: string) {
  const { user } = useAuth();
  const [data, setData] = useState<LocomotionDataPoint[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLocomotionData = async () => {
      try {
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
          const monthKey = format(date, 'MMM').toLowerCase();
          const monthIndex = months.findIndex(m => m.startsWith(monthKey.substring(0, 3)));
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

        setData(locomotionData);
        setTotalCost(total);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching locomotion data:', error);
        setData([]);
        setTotalCost(0);
        setLoading(false);
      }
    };

    fetchLocomotionData();
  }, [user, year]);

  return { data, totalCost, loading };
}
