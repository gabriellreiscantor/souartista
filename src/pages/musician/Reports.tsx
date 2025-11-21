import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Music2, DollarSign, TrendingDown, TrendingUp, TrendingUpIcon, FileText, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReportVisibility } from '@/hooks/useReportVisibility';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, startOfYear, endOfYear, subMonths, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
  expenses_team: any;
  expenses_other: any;
}

const MusicianReports = () => {
  const { user, userData, userRole } = useAuth();
  const { settings } = useReportVisibility();
  const [period, setPeriod] = useState('this-month');
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleShows, setVisibleShows] = useState(5);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, period]);

  const getDateRange = () => {
    const now = new Date();
    
    switch (period) {
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'this-week':
        return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
      case 'last-7-days':
        return { start: subDays(now, 7), end: now };
      case 'this-year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'year-2025':
        return { start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) };
      case 'all-time':
        return { start: new Date(2000, 0, 1), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const { data: showsData, error: showsError } = await supabase
        .from('shows')
        .select('*')
        .contains('team_musician_ids', [user?.id])
        .gte('date_local', format(start, 'yyyy-MM-dd'))
        .lte('date_local', format(end, 'yyyy-MM-dd'))
        .order('date_local', { ascending: false });

      if (showsError) throw showsError;

      setShows(showsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMyFee = (show: Show) => {
    if (Array.isArray(show.expenses_team)) {
      const myEntry = show.expenses_team.find((e: any) => e.musicianId === user?.id);
      return myEntry?.cost || 0;
    }
    return 0;
  };

  const getMyExpenses = (show: Show) => {
    if (Array.isArray(show.expenses_other)) {
      return show.expenses_other.reduce((sum: number, exp: any) => sum + (Number(exp.cost) || 0), 0);
    }
    return 0;
  };

  // Calculations
  const totalShows = shows.length;
  
  const showsWithFees = shows.map(show => {
    const myFee = getMyFee(show);
    const myExpenses = getMyExpenses(show);
    const profit = myFee - myExpenses;
    
    return {
      ...show,
      myFee,
      myExpenses,
      profit
    };
  });

  const totalRevenue = showsWithFees.reduce((sum, show) => sum + show.myFee, 0);
  const totalExpenses = showsWithFees.reduce((sum, show) => sum + show.myExpenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const averageTicket = totalShows > 0 ? totalProfit / totalShows : 0;

  // Top 5 calculations
  const venuesByProfit = showsWithFees
    .reduce((acc: any[], show) => {
      const existing = acc.find(v => v.name === show.venue_name);
      if (existing) {
        existing.profit += show.profit;
      } else {
        acc.push({ name: show.venue_name, profit: show.profit });
      }
      return acc;
    }, [])
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const venuesByShowCount = showsWithFees
    .reduce((acc: any[], show) => {
      const existing = acc.find(v => v.name === show.venue_name);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ name: show.venue_name, count: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <MusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                <Bell className="w-5 h-5 text-gray-900" />
              </Button>
              <UserMenu userName={userData?.name} userRole={userRole} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Period Filter */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">Período:</span>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Períodos Rápidos</div>
                      <SelectItem value="this-month">Este Mês</SelectItem>
                      <SelectItem value="last-month">Mês Passado</SelectItem>
                      <SelectItem value="this-week">Esta Semana</SelectItem>
                      <SelectItem value="last-7-days">Últimos 7 dias</SelectItem>
                      <SelectItem value="this-year">Este Ano</SelectItem>
                      <SelectItem value="all-time">Todo o Período</SelectItem>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Selecionar por Ano</div>
                      <SelectItem value="year-2025">Ano de 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                    <FileText className="w-4 h-4 mr-2" />
                    XLSX
                  </Button>
                </div>
              </div>

              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Shows</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{totalShows}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Music2 className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {settings.showGrossRevenue && (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Cachê Total (Período)</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">R$ {formatCurrency(totalRevenue)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {settings.showShowCosts && (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Despesas (Período)</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">R$ {formatCurrency(totalExpenses)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {settings.showNetProfit && (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Lucro Líquido (Período)</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">R$ {formatCurrency(totalProfit)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Average Ticket */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Ticket Médio (Período)</h3>
                  <p className="text-sm text-gray-600 mb-4">Seu lucro líquido médio por show no período selecionado.</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">R$ {formatCurrency(averageTicket)}</p>
                      <p className="text-sm text-gray-600">Valor exato: R$ {formatCurrency(averageTicket)} / show</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shows Details Table */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Detalhes dos Shows</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Local</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Seu Cachê</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Despesas</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Lucro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showsWithFees.slice(0, visibleShows).map((show) => (
                          <tr key={show.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {format(new Date(show.date_local), "dd/MM/yyyy")}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">{show.venue_name}</td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                              R$ {formatCurrency(show.myFee)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-red-600">
                              R$ {formatCurrency(show.myExpenses)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-600 text-white font-semibold">
                                R$ {formatCurrency(show.profit)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {showsWithFees.length > visibleShows && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleShows(prev => prev + 4)}
                        className="bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
                      >
                        Mostrar mais {Math.min(4, showsWithFees.length - visibleShows)} shows
                      </Button>
                    </div>
                  )}

                  {showsWithFees.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum show encontrado para o período selecionado
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top 5 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top 5 Venues by Profit */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-gray-900" />
                      <h3 className="font-bold text-gray-900">Top 5 Locais por Lucro</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {venuesByProfit.map((venue, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">{index + 1}. {venue.name}</span>
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            R$ {formatCurrency(venue.profit)}
                          </span>
                        </div>
                      ))}
                      {venuesByProfit.length === 0 && (
                        <p className="text-sm text-gray-500">Dados insuficientes para análise.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top 5 Venues by Show Count */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-gray-900" />
                      <h3 className="font-bold text-gray-900">Top 5 locais por nº de shows</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {venuesByShowCount.map((venue, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">{index + 1}. {venue.name}</span>
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            {venue.count} {venue.count === 1 ? 'show' : 'shows'}
                          </span>
                        </div>
                      ))}
                      {venuesByShowCount.length === 0 && (
                        <p className="text-sm text-gray-500">Dados insuficientes para análise.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
        <MobileBottomNav role="musician" />
      </div>
    </SidebarProvider>
  );
};

export default MusicianReports;
