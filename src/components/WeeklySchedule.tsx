import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, DollarSign, TrendingDown } from 'lucide-react';
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
  expenses_team: Array<{ cost: number }>;
  expenses_other: Array<{ cost: number }>;
}

export function WeeklySchedule({ userRole }: WeeklyScheduleProps) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['weekly-shows', user?.id, userRole, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('shows')
        .select('*')
        .gte('date_local', format(weekStart, 'yyyy-MM-dd'))
        .lte('date_local', format(weekEnd, 'yyyy-MM-dd'))
        .order('date_local', { ascending: true });

      if (userRole === 'artist') {
        query = query.eq('uid', user.id);
      } else {
        query = query.contains('team_musician_ids', [user.id]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(show => ({
        ...show,
        expenses_team: (show.expenses_team as any) || [],
        expenses_other: (show.expenses_other as any) || [],
      })) as Show[];
    },
    enabled: !!user,
  });

  const getShowsForDay = (date: Date) => {
    return shows.filter(show => isSameDay(parseISO(show.date_local), date));
  };

  const weeklyStats = {
    totalShows: shows.length,
    revenue: shows.reduce((sum, show) => sum + (show.fee || 0), 0),
    expenses: shows.reduce((sum, show) => {
      const teamCost = (show.expenses_team || []).reduce((s, e) => s + (e.cost || 0), 0);
      const otherCost = (show.expenses_other || []).reduce((s, e) => s + (e.cost || 0), 0);
      return sum + teamCost + otherCost;
    }, 0),
  };

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());

  if (isLoading) {
    return (
      <Card className="p-6 bg-white border border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Agenda Semanal</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Shows</span>
          </div>
          <p className="text-xl font-bold text-blue-900">{weeklyStats.totalShows}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-50 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Receita</span>
          </div>
          <p className="text-xl font-bold text-green-900">
            R$ {weeklyStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">Despesas</span>
          </div>
          <p className="text-xl font-bold text-orange-900">
            R$ {weeklyStats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Days Grid */}
      <div className="space-y-2">
        {weekDays.map(day => {
          const dayShows = getShowsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`p-3 rounded-lg border transition-colors ${
                isToday
                  ? 'bg-purple-50 border-purple-200'
                  : dayShows.length > 0
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`text-center ${isToday ? 'text-purple-600' : 'text-gray-600'}`}>
                    <div className="text-xs font-medium uppercase">
                      {format(day, 'EEE', { locale: ptBR })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-purple-700' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {dayShows.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {dayShows.map(show => (
                        <div key={show.id} className="text-sm">
                          <span className="font-medium text-gray-900">{show.time_local}</span>
                          <span className="text-gray-600 mx-2">•</span>
                          <span className="text-gray-700">{show.venue_name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Sem shows agendados</span>
                  )}
                </div>

                {dayShows.length > 0 && (
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      R$ {dayShows.reduce((sum, s) => sum + s.fee, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
