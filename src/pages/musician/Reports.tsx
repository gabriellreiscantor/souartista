import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music2, DollarSign, TrendingDown, TrendingUp, TrendingUpIcon, FileText, Building2, Car, Download, Receipt } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReportVisibility, maskCurrency } from '@/hooks/useReportVisibility';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
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
  uid: string;
}

const MusicianReports = () => {
  const { user, userData, userRole } = useAuth();
  const { settings } = useReportVisibility();
  const { requireOnline } = useOnlineStatus();
  const [period, setPeriod] = useState('this-month');
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [locomotionExpenses, setLocomotionExpenses] = useState<any[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<any[]>([]);
  const [artistProfiles, setArtistProfiles] = useState<{[key: string]: string}>({});

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

      // Fetch locomotion expenses for the musician
      const { data: expensesData, error: expensesError } = await supabase
        .from('locomotion_expenses')
        .select('*, shows(venue_name, date_local)')
        .eq('uid', user?.id)
        .gte('created_at', format(start, 'yyyy-MM-dd'))
        .lte('created_at', format(end, 'yyyy-MM-dd'));

      if (expensesError) throw expensesError;

      // Fetch artist profiles for the shows
      const artistIds = [...new Set(showsData?.map(show => show.uid) || [])];
      if (artistIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', artistIds);

        if (!profilesError && profilesData) {
          const profilesMap = profilesData.reduce((acc: {[key: string]: string}, profile) => {
            acc[profile.id] = profile.name;
            return acc;
          }, {});
          setArtistProfiles(profilesMap);
        }
      }

      // Fetch additional expenses for the musician
      const { data: additionalExpensesData, error: additionalError } = await supabase
        .from('additional_expenses')
        .select('*')
        .eq('uid', user?.id)
        .gte('expense_date', format(start, 'yyyy-MM-dd'))
        .lte('expense_date', format(end, 'yyyy-MM-dd'));

      if (additionalError) throw additionalError;

      setShows(showsData || []);
      setLocomotionExpenses(expensesData || []);
      setAdditionalExpenses(additionalExpensesData || []);
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
  // Top 5 Artists by Profit
  const artistsByProfit = showsWithFees
    .reduce((acc: any[], show) => {
      const artistId = show.uid;
      const existing = acc.find((a: any) => a.id === artistId);
      if (existing) {
        existing.profit += show.profit;
      } else {
        acc.push({ 
          id: artistId, 
          name: artistProfiles[artistId] || 'Artista', 
          profit: show.profit 
        });
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

  // Top 5 Locomotion Costs
  const topLocomotionCosts = locomotionExpenses
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5)
    .map((exp: any) => ({
      venue: exp.shows?.venue_name || 'N/A',
      cost: exp.cost,
      type: exp.type,
      date: exp.shows?.date_local
    }));

  // Top 5 Additional Expenses by category
  const categoryLabels: Record<string, string> = {
    equipamento: 'Equipamento',
    acessorio: 'Acessório',
    manutencao: 'Manutenção',
    vestuario: 'Vestuário',
    marketing: 'Marketing',
    formacao: 'Formação',
    software: 'Software',
    outros: 'Outros'
  };

  const additionalExpensesByCategory = additionalExpenses
    .reduce((acc: any[], exp) => {
      const label = categoryLabels[exp.category] || exp.category;
      const existing = acc.find(e => e.name === label);
      if (existing) {
        existing.cost += Number(exp.cost) || 0;
      } else {
        acc.push({ name: label, cost: Number(exp.cost) || 0 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  const totalAdditionalExpenses = additionalExpenses.reduce((sum, exp) => sum + Number(exp.cost), 0);
  const totalLocomotionExpenses = locomotionExpenses.reduce((sum, exp) => sum + Number(exp.cost), 0);
  const totalAllExpenses = totalExpenses + totalLocomotionExpenses + totalAdditionalExpenses;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    if (!requireOnline('Enviar relatório por e-mail')) return;
    
    try {
      toast.info('Enviando relatório para seu e-mail...');
      
      const { error } = await supabase.functions.invoke('send-report-email', {
        body: {
          period,
          format: 'pdf',
          userRole: 'musician'
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
    if (!requireOnline('Enviar relatório por e-mail')) return;
    
    try {
      toast.info('Enviando relatório para seu e-mail...');
      
      const { error } = await supabase.functions.invoke('send-report-email', {
        body: {
          period,
          format: 'xlsx',
          userRole: 'musician'
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
        <MusicianSidebar />
        
        <div className="flex-1 flex flex-col safe-area-top">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole={userRole} photoUrl={userData?.photo_url} />
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
                      <Button onClick={exportToPDF} size="sm" className="flex-1 bg-primary text-white hover:bg-primary/90">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={exportToXLSX} size="sm" className="flex-1 bg-primary text-white hover:bg-primary/90">
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

                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Cachê Total (Período)</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{settings.showGrossRevenue ? `R$ ${formatCurrency(totalRevenue)}` : 'R$ *.***,**'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Despesas (Período)</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{settings.showShowCosts ? `R$ ${formatCurrency(totalExpenses)}` : 'R$ *.***,**'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Lucro Líquido (Período)</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{settings.showNetProfit ? `R$ ${formatCurrency(totalProfit)}` : 'R$ *.***,**'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

              {/* Resumo de Despesas Adicionais */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-gray-900" />
                      <h3 className="font-bold text-gray-900">Resumo de Despesas Adicionais</h3>
                    </div>
                    <span className="text-sm font-semibold text-purple-600">
                      Total: {settings.showShowCosts ? `R$ ${formatCurrency(totalAdditionalExpenses)}` : 'R$ *.***,**'}
                    </span>
                  </div>
                  
                  {additionalExpensesByCategory.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {additionalExpensesByCategory.map((exp, index) => (
                        <div key={index}>
                          <p className="text-gray-500">{exp.name}</p>
                          <p className="font-semibold text-gray-900">
                            {settings.showShowCosts ? `R$ ${formatCurrency(exp.cost)}` : 'R$ *.***,**'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma despesa adicional registrada no período.</p>
                  )}
                </CardContent>
              </Card>
              {/* Top 5 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Top 5 Artists by Profit */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Music2 className="w-5 h-5 text-gray-900" />
                      <h3 className="font-bold text-gray-900">Top 5 Artistas por Lucro</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {artistsByProfit.map((artist, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">{index + 1}. {artist.name}</span>
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            R$ {formatCurrency(artist.profit)}
                          </span>
                        </div>
                      ))}
                      {artistsByProfit.length === 0 && (
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

                {/* Top 5 Locomotion Costs */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Car className="w-5 h-5 text-gray-900" />
                      <h3 className="font-bold text-gray-900">Top 5 Custos de Locomoção</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {topLocomotionCosts.map((exp, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">{index + 1}. {exp.venue}</span>
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            R$ {formatCurrency(exp.cost)}
                          </span>
                        </div>
                      ))}
                      {topLocomotionCosts.length === 0 && (
                        <p className="text-sm text-gray-500">Dados insuficientes para análise.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top 5 Additional Expenses */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="w-5 h-5 text-gray-900" />
                      <h3 className="font-bold text-gray-900">Top 5 Despesas Adicionais</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {additionalExpensesByCategory.map((exp, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">{index + 1}. {exp.name}</span>
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            {settings.showShowCosts ? `R$ ${formatCurrency(exp.cost)}` : 'R$ *.***,**'}
                          </span>
                        </div>
                      ))}
                      {additionalExpensesByCategory.length === 0 && (
                        <p className="text-sm text-gray-500">Nenhuma despesa adicional registrada.</p>
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
