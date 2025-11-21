import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, DollarSign, TrendingUp, Calendar as CalendarIcon, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ArtistReports = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalShows: 0,
    totalRevenue: 0,
    monthlyShows: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // All shows
      const { data: allShows, error: allError } = await supabase
        .from('shows')
        .select('fee')
        .eq('uid', user?.id);

      if (allError) throw allError;

      // Monthly shows
      const { data: monthlyShows, error: monthlyError } = await supabase
        .from('shows')
        .select('fee')
        .eq('uid', user?.id)
        .gte('date_local', format(monthStart, 'yyyy-MM-dd'))
        .lte('date_local', format(monthEnd, 'yyyy-MM-dd'));

      if (monthlyError) throw monthlyError;

      const totalRevenue = allShows?.reduce((sum, show) => sum + show.fee, 0) || 0;
      const monthlyRevenue = monthlyShows?.reduce((sum, show) => sum + show.fee, 0) || 0;

      setStats({
        totalShows: allShows?.length || 0,
        totalRevenue,
        monthlyShows: monthlyShows?.length || 0,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
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
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h2>
                <p className="text-gray-600">Acompanhe seus ganhos e performance</p>
              </div>

              {loading ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">Carregando relatórios...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-white">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Shows</CardTitle>
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalShows}</div>
                        <p className="text-xs text-muted-foreground mt-1">Todos os períodos</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Todos os períodos</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Shows no Mês</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.monthlyShows}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">R$ {stats.monthlyRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Resumo Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <span className="font-medium">Média por Show</span>
                          <span className="text-lg font-bold">
                            R$ {stats.totalShows > 0 ? (stats.totalRevenue / stats.totalShows).toFixed(2) : '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                          <span className="font-medium">Média Mensal</span>
                          <span className="text-lg font-bold text-purple-700">
                            R$ {stats.monthlyShows > 0 ? (stats.monthlyRevenue / stats.monthlyShows).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistReports;
