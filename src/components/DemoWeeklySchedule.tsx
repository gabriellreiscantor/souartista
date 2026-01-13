import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DemoWeeklyScheduleProps {
  userRole: 'artist' | 'musician';
}

export function DemoWeeklySchedule({ userRole }: DemoWeeklyScheduleProps) {
  const [currentWeek] = useState(new Date()); // Always current week
  
  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Dados fake para demonstração
  const demoShows = [
    {
      id: '1',
      day: 5, // Sexta
      venue_name: 'Bar do Zé',
      time_local: '21:00',
      duration_hours: 3,
      artist_name: 'João Silva',
      instrument: 'Guitarra',
    },
    {
      id: '2',
      day: 5, // Sexta
      venue_name: 'Casa de Shows Central',
      time_local: '23:00',
      duration_hours: 2,
      artist_name: 'Maria Santos',
      instrument: 'Bateria',
    },
    {
      id: '3',
      day: 6, // Sábado
      venue_name: 'Restaurante Villa',
      time_local: '19:30',
      duration_hours: 4,
      artist_name: 'Pedro Costa',
      instrument: 'Baixo',
    },
  ];

  const getShowsForDay = (dayIndex: number) => {
    return demoShows.filter(show => show.day === dayIndex);
  };

  const weeklyStats = {
    revenue: 2450,
    expenses: 380,
  };

  const profit = weeklyStats.revenue - weeklyStats.expenses;

  return (
    <Card className="p-4 sm:p-6 border-gray-200 bg-white">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Agenda da Semana</h3>
        <p className="text-sm text-gray-600">
          De {format(weekStart, "d/MM", { locale: ptBR })} a {format(weekEnd, "d/MM", { locale: ptBR })}
        </p>
      </div>


      {/* Days with Shows */}
      <div className="space-y-3 mb-4">
        {weekDays.map((day, index) => {
          const dayShows = getShowsForDay(index);
          if (dayShows.length === 0) return null;

          return (
            <div
              key={day.toISOString()}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
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

                      {/* Shows List */}
                      <div className="flex-1 space-y-2">
                        {dayShows.map((show) => (
                          <div key={show.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="text-sm font-bold text-gray-900">{show.venue_name}</span>
                            </div>
                            {userRole === 'artist' && (
                              <p className="ml-6 text-xs text-gray-400 mt-1">
                                Clique para ver os detalhes do show
                              </p>
                            )}
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
                          {show.instrument && (
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Instrumento:</span> {show.instrument}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      {userRole === 'artist' && (
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
  );
}
