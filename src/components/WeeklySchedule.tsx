import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
interface WeeklyScheduleProps {
  userRole: 'artist' | 'musician';
}
interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
  expenses_team: Array<{
    cost: number;
  }>;
  expenses_other: Array<{
    cost: number;
  }>;
}
export function WeeklySchedule({
  userRole
}: WeeklyScheduleProps) {
  const {
    user
  } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, {
    locale: ptBR
  });
  const weekEnd = endOfWeek(currentWeek, {
    locale: ptBR
  });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: weekEnd
  });
  const {
    data: shows = [],
    isLoading
  } = useQuery({
    queryKey: ['weekly-shows', user?.id, userRole, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('shows').select('*').gte('date_local', format(weekStart, 'yyyy-MM-dd')).lte('date_local', format(weekEnd, 'yyyy-MM-dd')).order('date_local', {
        ascending: true
      });
      if (userRole === 'artist') {
        query = query.eq('uid', user.id);
      } else {
        query = query.contains('team_musician_ids', [user.id]);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return (data || []).map(show => ({
        ...show,
        expenses_team: show.expenses_team as any || [],
        expenses_other: show.expenses_other as any || []
      })) as Show[];
    },
    enabled: !!user
  });
  const getShowsForDay = (date: Date) => {
    return shows.filter(show => isSameDay(parseISO(show.date_local), date));
  };
  const weeklyStats = {
    revenue: shows.reduce((sum, show) => sum + (show.fee || 0), 0),
    expenses: shows.reduce((sum, show) => {
      const teamCost = (show.expenses_team || []).reduce((s, e) => s + (e.cost || 0), 0);
      const otherCost = (show.expenses_other || []).reduce((s, e) => s + (e.cost || 0), 0);
      return sum + teamCost + otherCost;
    }, 0)
  };
  const profit = weeklyStats.revenue - weeklyStats.expenses;
  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());
  if (isLoading) {
    return <Card className="p-4 sm:p-6 bg-card border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg"></div>)}
        </div>
      </Card>;
  }
  return <Card className="p-4 sm:p-6 border-gray-200 bg-white">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Agenda da Semana</h3>
        <p className="text-sm text-gray-600">
          De {format(weekStart, "d/MM", {
          locale: ptBR
        })} a {format(weekEnd, "d/MM", {
          locale: ptBR
        })}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="icon" onClick={handlePreviousWeek} className="h-9 w-9 bg-white hover:bg-gray-50 border-gray-200 text-gray-900">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={handleToday} className="flex-1 justify-center bg-white hover:bg-gray-50 border-gray-200 text-gray-900">
          Semana Atual
        </Button>
        <Button variant="outline" size="icon" onClick={handleNextWeek} className="h-9 w-9 bg-white hover:bg-gray-50 border-gray-200 text-gray-900">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Days with Shows */}
      <div className="space-y-3 mb-4">
        {weekDays.map(day => {
        const dayShows = getShowsForDay(day);
        if (dayShows.length === 0) return null;
        return <div key={day.toISOString()} className="p-4 rounded-lg bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
              <div className="flex items-start gap-4">
                {/* Date Badge */}
                <div className="flex flex-col items-center min-w-[60px] bg-primary/10 rounded-lg p-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {format(day, 'EEEE', {
                  locale: ptBR
                }).slice(0, 3)}
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Shows List */}
                <div className="flex-1 space-y-2">
                  {dayShows.map(show => <div key={show.id} className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-gray-900">{show.venue_name}</span>
                    </div>)}
                </div>
              </div>
            </div>;
      })}

        {shows.length === 0 && <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum show agendado nesta semana</p>
          </div>}
      </div>

      {/* Help Text */}
      {shows.length > 0 && <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
          <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
            <span className="text-[10px]">i</span>
          </div>
          <p>Clique em um dia com eventos para ver os detalhes.</p>
        </div>}

      {/* Weekly Stats */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Seu Cachê (Semana)</span>
          <span className="text-lg font-bold text-success">
            R$ {weeklyStats.revenue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2
          })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Suas Despesas (Semana)</span>
          <span className="text-lg font-bold text-destructive">
            R$ {weeklyStats.expenses.toLocaleString('pt-BR', {
            minimumFractionDigits: 2
          })}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Seu Lucro (Semana)</span>
          <span className="text-xl font-bold text-info">
            R$ {profit.toLocaleString('pt-BR', {
            minimumFractionDigits: 2
          })}
          </span>
        </div>
      </div>
    </Card>;
}