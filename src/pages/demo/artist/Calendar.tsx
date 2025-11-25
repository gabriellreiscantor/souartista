import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoArtistSidebar } from '@/components/DemoArtistSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationBell } from '@/components/NotificationBell';
import { Music2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DemoBanner } from '@/components/DemoBanner';

const DemoArtistCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAgenda, setShowAgenda] = useState(false);

  const demoShows = [
    { id: '1', venue_name: 'Pub Rock City', date_local: '2025-01-10', time_local: '22:00', fee: 900 },
    { id: '2', venue_name: 'Teatro Municipal', date_local: '2025-01-15', time_local: '20:00', fee: 2000 },
    { id: '3', venue_name: 'Festa Corporativa', date_local: '2025-01-25', time_local: '19:00', fee: 1800 },
  ];

  const getDatesWithShows = () => {
    return demoShows.map(show => show.date_local);
  };

  const datesWithShows = getDatesWithShows();

  const handleDateClick = (clickedDate: Date) => {
    setSelectedDate(clickedDate);
    const dateStr = format(clickedDate, 'yyyy-MM-dd');
    const hasShows = datesWithShows.includes(dateStr);
    if (hasShows) {
      setShowAgenda(true);
    }
  };

  const monthShows = demoShows.filter(show => {
    const showDate = new Date(show.date_local);
    return showDate.getMonth() === currentMonth.getMonth() && 
           showDate.getFullYear() === currentMonth.getFullYear();
  });

  const selectedDayShows = demoShows.filter(
    show => selectedDate && format(new Date(show.date_local), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Calendário</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-6xl mx-auto">
              <Card className="bg-white mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Music2 className="w-6 h-6 text-purple-600" />
                      {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                    </h2>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 md:gap-3">
                    {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((day) => (
                      <div key={day} className="text-center text-xs md:text-sm font-medium text-gray-600 py-1 md:py-2">
                        {day}
                      </div>
                    ))}
                    
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-12 md:aspect-square" />
                    ))}
                    
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                      const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                      const dateStr = format(dayDate, 'yyyy-MM-dd');
                      const hasShow = datesWithShows.includes(dateStr);
                      const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
                      const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handleDateClick(dayDate)}
                          className={`h-12 md:aspect-square relative rounded-lg border transition-all hover:border-purple-500 flex flex-col items-center justify-center gap-0.5 md:gap-1 py-1 md:py-2 ${
                            isSelected ? 'bg-purple-600 text-white border-purple-600' : 
                            isToday ? 'bg-purple-50 border-purple-300 text-gray-900' :
                            'bg-white border-gray-200 text-gray-900'
                          }`}
                        >
                          <span className="text-sm md:text-base font-medium">{i + 1}</span>
                          {hasShow && (
                            <Music2 
                              className={`w-2.5 h-2.5 md:w-3 md:h-3 ${
                                isSelected ? 'text-white' : 'text-purple-600'
                              }`} 
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Como usar o calendário:</strong>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Clique em um dia para abrir a agenda detalhada e ver os eventos programados para aquela data.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-purple-600" />
                    Lista De Shows De {format(currentMonth, "MMMM", { locale: ptBR })}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Resumo de todos os shows para {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}.
                  </p>

                  {monthShows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Local</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Cachê</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthShows.map((show) => (
                            <tr key={show.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {format(new Date(show.date_local), "dd/MM/yyyy", { locale: ptBR })}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">{show.venue_name}</td>
                              <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                                R$ {show.fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum show agendado para este mês
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Sheet open={showAgenda} onOpenChange={setShowAgenda}>
              <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-none overflow-y-auto bg-white scrollbar-hide">
                <SheetHeader className="border-b pb-4 mb-6">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-semibold text-gray-900">
                      {selectedDate && `Agenda para ${format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
                    </SheetTitle>
                    <Button 
                      onClick={() => setShowAgenda(false)}
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Fechar
                    </Button>
                  </div>
                </SheetHeader>

                <div className="relative">
                  {timeSlots.map((time, index) => (
                    <div key={time} className="relative border-b border-gray-100" style={{ height: '60px' }}>
                      <div className="absolute left-0 top-0 w-16 text-xs text-gray-500 font-medium">
                        {time}
                      </div>
                      <div className="ml-20 h-full relative">
                        {selectedDayShows
                          .filter(show => {
                            const [hours] = show.time_local.split(':').map(Number);
                            return hours === index;
                          })
                          .map((show) => (
                            <div
                              key={show.id}
                              className="absolute left-0 right-0 bg-purple-500 text-white rounded-md p-3 shadow-md"
                              style={{
                                top: '2px',
                                height: '56px'
                              }}
                            >
                              <div className="font-semibold text-sm">{show.venue_name}</div>
                              <div className="text-xs mt-1">2 horas de show</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </main>
        </div>
        <DemoMobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default DemoArtistCalendar;
