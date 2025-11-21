import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
}

const ArtistCalendar = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [shows, setShows] = useState<Show[]>([]);
  const [showDates, setShowDates] = useState<Date[]>([]);

  useEffect(() => {
    if (user) {
      fetchShows();
    }
  }, [user]);

  const fetchShows = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('uid', user?.id)
        .order('date_local', { ascending: true });

      if (error) throw error;
      
      setShows(data || []);
      const dates = (data || []).map(show => new Date(show.date_local));
      setShowDates(dates);
    } catch (error) {
      console.error('Error fetching shows:', error);
    }
  };

  const selectedDayShows = shows.filter(
    show => date && format(new Date(show.date_local), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Calendário</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Calendário de Shows</h2>
              
              <div className="grid md:grid-cols-[auto,1fr] gap-6">
                <Card className="w-full md:w-auto">
                  <CardContent className="p-4">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md"
                      modifiers={{
                        hasShow: showDates,
                      }}
                      modifiersStyles={{
                        hasShow: {
                          backgroundColor: 'rgb(147, 51, 234)',
                          color: 'white',
                          fontWeight: 'bold',
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
                    </h3>
                    
                    {selectedDayShows.length > 0 ? (
                      <div className="space-y-4">
                        {selectedDayShows.map((show) => (
                          <div
                            key={show.id}
                            className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                          >
                            <h4 className="font-semibold text-gray-900">{show.venue_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Horário: {show.time_local}
                            </p>
                            <p className="text-sm text-gray-600">
                              Cachê: R$ {show.fee.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum show agendado para esta data
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistCalendar;
