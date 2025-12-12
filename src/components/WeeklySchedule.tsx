import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Users, DollarSign, Car, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WeeklyScheduleProps {
  userRole: 'artist' | 'musician';
}

interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  duration_hours: number;
  fee: number;
  expenses_team: Array<{
    cost: number;
    name?: string;
    instrument?: string;
    musicianId?: string;
  }>;
  expenses_other: Array<{
    cost: number;
  }>;
  artist_name?: string;
  musician_instrument?: string;
}

interface LocomotionExpense {
  id: string;
  type: string;
  cost: number;
}

export function WeeklySchedule({ userRole }: WeeklyScheduleProps) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showLocomotion, setShowLocomotion] = useState<LocomotionExpense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['weekly-shows-v2', user?.id, userRole, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('shows')
        .select('*, profiles!shows_uid_fkey(name)')
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
      
      return (data || []).map(show => {
        const expenses_team = show.expenses_team as any || [];
        const currentMusicianExpense = expenses_team.find((exp: any) => exp.musicianId === user.id);
        return {
          ...show,
          expenses_team,
          expenses_other: show.expenses_other as any || [],
          artist_name: (show.profiles as any)?.name,
          musician_instrument: currentMusicianExpense?.instrument
        };
      }) as Show[];
    },
    enabled: !!user
  });

  const getShowsForDay = (date: Date) => {
    return shows.filter(show => isSameDay(parseISO(show.date_local), date));
  };

  const handleShowClick = async (show: Show) => {
    setSelectedShow(show);
    
    // Buscar despesas de locomoção do show
    try {
      const { data: locomotion } = await supabase
        .from('locomotion_expenses')
        .select('id, type, cost')
        .eq('show_id', show.id);
      
      setShowLocomotion(locomotion || []);
    } catch (error) {
      console.error('Error fetching locomotion:', error);
      setShowLocomotion([]);
    }
    
    setIsModalOpen(true);
  };

  const weeklyStats = {
    revenue: shows.reduce((sum, show) => sum + (show.fee || 0), 0),
    expenses: shows.reduce((sum, show) => {
      if (userRole === 'musician') {
        return sum;
      } else {
        const teamCost = (show.expenses_team || []).reduce((s, e) => s + (e.cost || 0), 0);
        const otherCost = (show.expenses_other || []).reduce((s, e) => s + (e.cost || 0), 0);
        return sum + teamCost + otherCost;
      }
    }, 0)
  };

  const profit = weeklyStats.revenue - weeklyStats.expenses;

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const getLocomotionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      uber: 'Uber',
      km: 'Km Rodado',
      van: 'Van',
      onibus: 'Ônibus',
      aviao: 'Avião'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6 bg-white border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 sm:p-6 border-gray-200 bg-white">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-900">Agenda da Semana</h3>
          <p className="text-sm text-gray-600">
            De {format(weekStart, "d/MM", { locale: ptBR })} a {format(weekEnd, "d/MM", { locale: ptBR })}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePreviousWeek} 
            className="h-9 w-9 bg-white hover:bg-gray-50 border-gray-200 text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={handleToday} 
            className="flex-1 justify-center bg-white hover:bg-gray-50 border-gray-200 text-gray-900"
          >
            Semana Atual
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextWeek} 
            className="h-9 w-9 bg-white hover:bg-gray-50 border-gray-200 text-gray-900"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Days with Shows */}
        <div className="space-y-3 mb-4">
          {weekDays.map(day => {
            const dayShows = getShowsForDay(day);
            if (dayShows.length === 0) return null;
            
            return (
              <div key={day.toISOString()}>
                {dayShows.map(show => (
                  <div 
                    key={show.id} 
                    onClick={() => handleShowClick(show)}
                    className="p-4 rounded-lg bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer mb-3"
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="flex flex-col items-center min-w-[60px] bg-primary/10 rounded-lg p-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          {format(day, 'EEEE', { locale: ptBR }).slice(0, 3)}
                        </span>
                        <span className="text-3xl font-bold text-primary">
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* Show Info */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-gray-900">{show.venue_name}</span>
                        </div>
                        {userRole === 'musician' && (
                          <div className="ml-6 space-y-0.5">
                            {show.artist_name && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Artista:</span> {show.artist_name}
                              </p>
                            )}
                            {show.time_local && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Horário:</span> {show.time_local}
                              </p>
                            )}
                            {show.duration_hours && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Duração:</span> {show.duration_hours}h
                              </p>
                            )}
                            {show.musician_instrument && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Instrumento:</span> {show.musician_instrument}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {shows.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum show agendado nesta semana</p>
            </div>
          )}
        </div>

        {/* Help Text */}
        {shows.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
            <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
              <span className="text-[10px]">i</span>
            </div>
            <p>Clique em um dia com eventos para ver os detalhes.</p>
          </div>
        )}

        {/* Weekly Stats */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Seu Cachê (Semana)</span>
            <span className="text-lg font-bold text-success">
              R$ {weeklyStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Suas Despesas (Semana)</span>
            <span className="text-lg font-bold text-destructive">
              R$ {weeklyStats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-900">Seu Lucro (Semana)</span>
            <span className="text-xl font-bold text-[#1e52f1]">
              R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </Card>

      {/* Show Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Detalhes do Show
            </DialogTitle>
          </DialogHeader>
          
          {selectedShow && (
            <div className="space-y-4 mt-4">
              {/* Venue */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="text-lg font-bold text-gray-900">{selectedShow.venue_name}</h4>
                <p className="text-sm text-gray-600">
                  {format(parseISO(selectedShow.date_local), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              {/* Time & Duration */}
              <div className="flex gap-4">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-gray-600">Horário</span>
                  </div>
                  <p className="font-semibold text-gray-900">{selectedShow.time_local || 'Não informado'}</p>
                </div>
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-gray-600">Duração</span>
                  </div>
                  <p className="font-semibold text-gray-900">{selectedShow.duration_hours || 3} horas</p>
                </div>
              </div>

              {/* Fee */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">Cachê</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  R$ {selectedShow.fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Musicians */}
              {selectedShow.expenses_team && selectedShow.expenses_team.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700">
                      Músicos ({selectedShow.expenses_team.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {selectedShow.expenses_team.map((musician, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">
                          {musician.name || 'Músico'} 
                          {musician.instrument && <span className="text-gray-500 ml-1">({musician.instrument})</span>}
                        </span>
                        <span className="text-purple-600 font-medium">
                          R$ {musician.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locomotion */}
              {showLocomotion.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-700">Locomoção</span>
                  </div>
                  <div className="space-y-1">
                    {showLocomotion.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{getLocomotionTypeLabel(expense.type)}</span>
                        <span className="text-yellow-600 font-medium">
                          R$ {expense.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <Button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
