import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, DollarSign, TrendingDown, Music, Clock, MapPin } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
      <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-100 shadow-lg animate-pulse">
        <div className="h-8 bg-gradient-to-r from-purple-200 to-purple-300 rounded-lg w-1/3 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-white border-2 border-purple-100 shadow-xl">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Agenda Semanal</h3>
              <p className="text-purple-100 text-sm">
                {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handlePreviousWeek}
              className="h-10 w-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-xl font-semibold px-4"
            >
              Hoje
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
              className="h-10 w-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Weekly Stats com cards modernos */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-white" />
              <span className="text-xs font-semibold text-purple-100">Shows</span>
            </div>
            <p className="text-3xl font-bold">{weeklyStats.totalShows}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-white" />
              <span className="text-xs font-semibold text-purple-100">Receita</span>
            </div>
            <p className="text-2xl font-bold">
              R$ {weeklyStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-white" />
              <span className="text-xs font-semibold text-purple-100">Despesas</span>
            </div>
            <p className="text-2xl font-bold">
              R$ {weeklyStats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Days List com design melhorado */}
      <div className="p-6 space-y-3">
        {weekDays.map(day => {
          const dayShows = getShowsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 transition-all duration-300",
                isToday
                  ? 'bg-gradient-to-r from-purple-100 via-purple-50 to-white border-purple-300 shadow-md'
                  : dayShows.length > 0
                  ? 'bg-white border-gray-200 hover:border-purple-200 hover:shadow-md'
                  : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'
              )}
            >
              {isToday && (
                <div className="absolute top-0 right-0">
                  <Badge className="bg-purple-600 text-white border-0 rounded-tl-none rounded-br-none">
                    Hoje
                  </Badge>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Data com estilo card */}
                    <div className={cn(
                      "flex flex-col items-center justify-center w-16 h-16 rounded-xl",
                      isToday 
                        ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg'
                        : dayShows.length > 0
                        ? 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-900'
                        : 'bg-white text-gray-500'
                    )}>
                      <span className="text-xs font-semibold uppercase opacity-80">
                        {format(day, 'EEE', { locale: ptBR })}
                      </span>
                      <span className="text-2xl font-bold leading-none">
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Shows info */}
                    {dayShows.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {dayShows.map(show => (
                          <div 
                            key={show.id} 
                            className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-purple-600" />
                              <span className="font-semibold text-gray-900">{show.time_local}</span>
                            </div>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-purple-600" />
                              <span className="text-gray-700 font-medium">{show.venue_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Sem shows agendados</span>
                      </div>
                    )}
                  </div>

                  {/* Valor em destaque */}
                  {dayShows.length > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 font-medium mb-1">Receita</span>
                      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-xl shadow-md">
                        <span className="text-lg font-bold">
                          R$ {dayShows.reduce((sum, s) => sum + s.fee, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de destaque no hover */}
              {dayShows.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
