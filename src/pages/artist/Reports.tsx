import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Music2, DollarSign, TrendingDown, TrendingUp, TrendingUpIcon, FileText, Users, Car, Building2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReportVisibility } from '@/hooks/useReportVisibility';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, startOfYear, endOfYear, subMonths, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import logoImg from '@/assets/nova_logo.png';

interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
  expenses_team: any;
  expenses_other: any;
}

const ArtistReports = () => {
  const { user, userData, userRole } = useAuth();
  const { settings } = useReportVisibility();
  const [period, setPeriod] = useState('this-month');
  const [shows, setShows] = useState<Show[]>([]);
  const [locomotionExpenses, setLocomotionExpenses] = useState<any[]>([]);
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

      // Fetch shows
      const { data: showsData, error: showsError } = await supabase
        .from('shows')
        .select('*')
        .eq('uid', user?.id)
        .gte('date_local', format(start, 'yyyy-MM-dd'))
        .lte('date_local', format(end, 'yyyy-MM-dd'))
        .order('date_local', { ascending: false });

      if (showsError) throw showsError;

      // Fetch locomotion expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('locomotion_expenses')
        .select('*')
        .eq('uid', user?.id);

      if (expensesError) throw expensesError;

      setShows(showsData || []);
      setLocomotionExpenses(expensesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateShowExpenses = (show: Show, locomotion: number) => {
    const teamExpenses = Array.isArray(show.expenses_team) 
      ? show.expenses_team.reduce((sum: number, exp: any) => sum + (Number(exp.cost) || 0), 0)
      : 0;
    
    const otherExpenses = Array.isArray(show.expenses_other)
      ? show.expenses_other.reduce((sum: number, exp: any) => sum + (Number(exp.cost) || Number(exp.amount) || 0), 0)
      : 0;

    return teamExpenses + otherExpenses + locomotion;
  };

  const getLocomotionForShow = (showId: string) => {
    const expense = locomotionExpenses.find(exp => exp.show_id === showId);
    return expense ? Number(expense.cost) : 0;
  };

  // Calculations
  const totalShows = shows.length;
  const totalRevenue = shows.reduce((sum, show) => sum + Number(show.fee), 0);
  
  const showsWithExpenses = shows.map(show => {
    const locomotion = getLocomotionForShow(show.id);
    const expenses = calculateShowExpenses(show, locomotion);
    const profit = Number(show.fee) - expenses;
    
    return {
      ...show,
      locomotion,
      expenses,
      profit
    };
  });

  const totalExpenses = showsWithExpenses.reduce((sum, show) => sum + show.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const averageTicket = totalShows > 0 ? totalProfit / totalShows : 0;

  // Calculate monthly average for all time
  const [allTimeShows, setAllTimeShows] = useState<Show[]>([]);
  
  useEffect(() => {
    const fetchAllTimeShows = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('shows')
        .select('*')
        .eq('uid', user.id);
      
      setAllTimeShows(data || []);
    };
    
    fetchAllTimeShows();
  }, [user]);

  const calculateMonthlyAverage = () => {
    if (allTimeShows.length === 0) return 0;
    
    const allTimeExpenses = allTimeShows.map(show => {
      const locomotion = getLocomotionForShow(show.id);
      const expenses = calculateShowExpenses(show, locomotion);
      return Number(show.fee) - expenses;
    });
    
    const allTimeProfit = allTimeExpenses.reduce((sum, profit) => sum + profit, 0);
    
    // Get first and last show dates
    const dates = allTimeShows.map(s => new Date(s.date_local)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    const months = Math.max(1, differenceInMonths(lastDate, firstDate) + 1);
    
    return allTimeProfit / months;
  };

  const monthlyAverage = calculateMonthlyAverage();

  // Top 5 calculations
  const venuesByProfit = showsWithExpenses
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

  const teamExpensesByMember = showsWithExpenses
    .flatMap(show => 
      Array.isArray(show.expenses_team) 
        ? show.expenses_team.map((exp: any) => ({ name: exp.name, amount: Number(exp.cost) || 0 }))
        : []
    )
    .reduce((acc: any[], exp) => {
      const existing = acc.find(e => e.name === exp.name);
      if (existing) {
        existing.amount += exp.amount;
      } else {
        acc.push({ ...exp });
      }
      return acc;
    }, [])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const venuesByShowCount = showsWithExpenses
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

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return value.toFixed(0);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'this-month': return 'Este Mês';
      case 'last-month': return 'Mês Passado';
      case 'this-week': return 'Esta Semana';
      case 'last-7-days': return 'Últimos 7 dias';
      case 'this-year': return 'Este Ano';
      case 'year-2025': return 'Ano de 2025';
      case 'all-time': return 'Todo o Período';
      default: return 'Este Mês';
    }
  };

  const exportToPDF = async () => {
    try {
      toast.info('Enviando relatório para seu e-mail...');
      
      const { error } = await supabase.functions.invoke('send-report-email', {
        body: {
          period,
          format: 'pdf',
          userRole: 'artist'
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Relatório PDF enviado para seu e-mail!');
    } catch (error) {
      console.error('Error sending PDF:', error);
      toast.error('Erro ao enviar relatório PDF');
    }
  };

  const exportToXLSX = async () => {
    try {
      toast.info('Enviando relatório para seu e-mail...');
      
      const { error } = await supabase.functions.invoke('send-report-email', {
        body: {
          period,
          format: 'xlsx',
          userRole: 'artist'
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Relatório XLSX enviado para seu e-mail!');
    } catch (error) {
      console.error('Error sending XLSX:', error);
      toast.error('Erro ao enviar relatório XLSX');
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
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Period Filter and Export Buttons */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Período:</label>
                      <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-full bg-white border-2 border-primary text-gray-900 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50 text-gray-900">
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Períodos Rápidos</div>
                          <SelectItem value="this-month" className="text-gray-900">Este Mês</SelectItem>
                          <SelectItem value="last-month" className="text-gray-900">Mês Passado</SelectItem>
                          <SelectItem value="this-week" className="text-gray-900">Esta Semana</SelectItem>
                          <SelectItem value="last-7-days" className="text-gray-900">Últimos 7 dias</SelectItem>
                          <SelectItem value="this-year" className="text-gray-900">Este Ano</SelectItem>
                          <SelectItem value="all-time" className="text-gray-900">Todo o Período</SelectItem>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Selecionar por Ano</div>
                          <SelectItem value="year-2025" className="text-gray-900">Ano de 2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary text-white hover:bg-primary/90"
                        onClick={exportToPDF}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary text-white hover:bg-primary/90"
                        onClick={exportToXLSX}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        XLSX
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                          <p className="text-sm font-medium text-gray-600">Receita Bruta (Período)</p>
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
                          <p className="text-sm font-medium text-gray-600">Custos de Show (Período)</p>
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

              {/* Monthly Average */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Média de Lucro Mensal (Todo o Período)</h3>
                  <p className="text-sm text-gray-600 mb-4">Cálculo baseado no seu lucro líquido total dividido pelo número de meses com shows.</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUpIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">R$ {formatCompactCurrency(monthlyAverage)}</p>
                      <p className="text-sm text-gray-600">Valor exato: R$ {formatCurrency(monthlyAverage)} / mês</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

              {/* Shows Details Cards */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Detalhes dos Shows</h3>
                  
                  <div className="space-y-4">
                    {showsWithExpenses.slice(0, visibleShows).map((show) => (
                      <Card key={show.id} className="border-2 border-gray-200 bg-white">
                        <CardContent className="p-4 bg-white">
                          <h4 className="font-bold text-lg text-gray-900 mb-1">{show.venue_name}</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {format(new Date(show.date_local), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                          </p>
                          
                          <div className={`grid ${settings.showLocomotion ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-3`}>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Cachê</p>
                              <p className="text-sm font-semibold text-green-600">
                                R$ {formatCurrency(Number(show.fee))}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Despesas</p>
                              <p className="text-sm font-semibold text-red-600">
                                R$ {formatCurrency(show.expenses - show.locomotion)}
                              </p>
                            </div>
                            {settings.showLocomotion && (
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Locomoção</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  R$ {formatCurrency(show.locomotion)}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-900">Lucro</span>
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-purple-600 text-white font-semibold">
                              R$ {formatCurrency(show.profit)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {showsWithExpenses.length > visibleShows && (
                    <div className="flex justify-center mt-6">
                      <Button
                        onClick={() => setVisibleShows(prev => prev + 4)}
                        className="bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
                      >
                        Mostrar mais 4 shows
                      </Button>
                    </div>
                  )}

                  {showsWithExpenses.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum show encontrado para o período selecionado
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top 5 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Top 5 Team Costs */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-gray-900" />
                      <h3 className="font-bold text-gray-900">Top 5 Custos de Equipe</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {teamExpensesByMember.map((member, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">{index + 1}. {member.name}</span>
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            R$ {formatCurrency(member.amount)}
                          </span>
                        </div>
                      ))}
                      {teamExpensesByMember.length === 0 && (
                        <p className="text-sm text-gray-500">Dados insuficientes para análise.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top 5 Locomotion Costs */}
                {settings.showLocomotion && (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Car className="w-5 h-5 text-gray-900" />
                        <h3 className="font-bold text-gray-900">Top 5 Custos de Locomoção</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">Dados insuficientes para análise.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistReports;
