import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoArtistSidebar } from '@/components/DemoArtistSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationBell } from '@/components/NotificationBell';
import { Music2, DollarSign, TrendingDown, TrendingUp, FileText, File, Building, Users, Car } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DemoArtistReports = () => {
  const [period, setPeriod] = useState('this-month');
  const [visibleShows, setVisibleShows] = useState(3);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = String(currentDate.getMonth() + 1).padStart(2, '0');

  const demoShows = [
    {
      id: '1',
      venue_name: 'Casa de Shows Melodia',
      date_local: `${currentYear}-${currentMonthNum}-12`,
      fee: 2500,
      teamExpenses: 1800,
      locomotionExpenses: 0
    },
    {
      id: '2',
      venue_name: 'Pub e Lounge Estrela',
      date_local: `${currentYear}-${currentMonthNum}-14`,
      fee: 350,
      teamExpenses: 0,
      locomotionExpenses: 0
    },
    {
      id: '3',
      venue_name: 'Restaurante e Bar Acústico',
      date_local: `${currentYear}-${currentMonthNum}-14`,
      fee: 2100,
      teamExpenses: 150,
      locomotionExpenses: 0
    },
    {
      id: '4',
      venue_name: 'Bar e Restaurante Harmonia',
      date_local: `${currentYear}-${currentMonthNum}-18`,
      fee: 550,
      teamExpenses: 150,
      locomotionExpenses: 0
    },
    {
      id: '5',
      venue_name: 'SAPEZAL',
      date_local: `${currentYear}-${currentMonthNum}-20`,
      fee: 1500,
      teamExpenses: 302,
      locomotionExpenses: 0
    },
    {
      id: '6',
      venue_name: 'Pub 65',
      date_local: `${currentYear}-${currentMonthNum}-22`,
      fee: 1200,
      teamExpenses: 850,
      locomotionExpenses: 0
    },
    {
      id: '7',
      venue_name: 'Raiznejo',
      date_local: `${currentYear}-${currentMonthNum}-25`,
      fee: 1200,
      teamExpenses: 100,
      locomotionExpenses: 0
    }
  ];

  const totalShows = demoShows.length;
  const totalRevenue = demoShows.reduce((sum, show) => sum + show.fee, 0);
  const totalExpenses = demoShows.reduce((sum, show) => sum + show.teamExpenses + show.locomotionExpenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const averageTicket = totalRevenue / totalShows;
  const monthlyAverage = totalProfit; // Simplificado para demo

  // Top 5 locais por lucro
  const venuesByProfit = demoShows
    .map(show => ({
      name: show.venue_name,
      profit: show.fee - show.teamExpenses - show.locomotionExpenses
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  // Top 5 custos de equipe
  const teamCosts = [
    { name: 'Freelancer', cost: 3495 },
    { name: 'Cristiano', cost: 375 },
    { name: 'João Negão', cost: 300 }
  ];

  // Top 5 locais por número de shows
  const venuesByShowCount = [
    { name: 'Pub 65', count: 3 },
    { name: 'Ditado Popular', count: 2 },
    { name: 'Tatu Bola', count: 1 },
    { name: 'Raiznejo', count: 1 },
    { name: 'SAPEZAL', count: 1 }
  ];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return `R$ ${formatCurrency(value)}`;
  };

  const handleExport = (type: string) => {
    toast.info('Modo Demo', {
      description: `Exportação ${type} disponível apenas na versão completa.`
    });
  };

  const remainingShows = demoShows.length - visibleShows;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
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
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Período e Export */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Período:</label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-full bg-white border-primary text-gray-900 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-gray-900">
                        <SelectItem value="this-month">Este Mês</SelectItem>
                        <SelectItem value="last-month">Mês Passado</SelectItem>
                        <SelectItem value="this-year">Este Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleExport('PDF')} 
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      onClick={() => handleExport('XLSX')} 
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <File className="w-4 h-4 mr-2" />
                      XLSX
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Total de Shows */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total de Shows</p>
                      <p className="text-4xl font-bold text-gray-900">{totalShows}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Music2 className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Receita Bruta */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Receita Bruta (Período)</p>
                      <p className="text-4xl font-bold text-gray-900">R$ {formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custos de Show */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Custos de Show (Período)</p>
                      <p className="text-4xl font-bold text-gray-900">R$ {formatCurrency(totalExpenses)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lucro Líquido */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Lucro Líquido (Período)</p>
                      <p className="text-4xl font-bold text-gray-900">R$ {formatCurrency(totalProfit)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Média de Lucro Mensal */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Média de Lucro Mensal (Todo o Período)
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Cálculo baseado no seu lucro líquido total dividido pelo número de meses com shows.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{formatCurrencyCompact(monthlyAverage)}</p>
                      <p className="text-xs text-gray-500">Valor exato: R$ {formatCurrency(monthlyAverage)} / mês</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ticket Médio */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Ticket Médio (Período)
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Seu lucro líquido médio por show no período selecionado.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">R$ {formatCurrency(averageTicket)}</p>
                      <p className="text-xs text-gray-500">Valor exato: R$ {formatCurrency(averageTicket)} / show</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalhes dos Shows */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes dos Shows</h2>
                <div className="space-y-3">
                  {demoShows.slice(0, visibleShows).map((show) => {
                    const showProfit = show.fee - show.teamExpenses - show.locomotionExpenses;
                    return (
                      <Card key={show.id} className="bg-white border-gray-200">
                        <CardContent className="p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{show.venue_name}</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {format(new Date(show.date_local), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                          </p>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Cachê</p>
                              <p className="text-sm font-bold text-green-600">R$ {formatCurrency(show.fee)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Despesas</p>
                              <p className="text-sm font-bold text-red-600">
                                R$ {formatCurrency(show.teamExpenses + show.locomotionExpenses)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Locomoção</p>
                              <p className="text-sm font-bold text-gray-600">
                                R$ {formatCurrency(show.locomotionExpenses)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">Lucro</p>
                            <div className="bg-primary text-white px-4 py-1 rounded-full">
                              <p className="text-sm font-bold">R$ {formatCurrency(showProfit)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {remainingShows > 0 && (
                  <Button
                    onClick={() => setVisibleShows(prev => Math.min(prev + 4, demoShows.length))}
                    variant="ghost"
                    className="w-full mt-3 bg-purple-50 hover:bg-purple-100 text-primary"
                  >
                    Mostrar mais {remainingShows} {remainingShows === 1 ? 'show' : 'shows'}
                  </Button>
                )}
              </div>

              {/* Top 5 Locais por Lucro */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Top 5 Locais por Lucro
                  </h3>
                  <div className="space-y-2">
                    {venuesByProfit.map((venue, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">
                          {index + 1}. {venue.name}
                        </span>
                        <div className="bg-primary text-white px-3 py-1 rounded-full">
                          <span className="text-xs font-bold">R$ {formatCurrency(venue.profit)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 Custos de Equipe */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top 5 Custos de Equipe
                  </h3>
                  <div className="space-y-2">
                    {teamCosts.map((member, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">
                          {index + 1}. {member.name}
                        </span>
                        <div className="bg-primary text-white px-3 py-1 rounded-full">
                          <span className="text-xs font-bold">R$ {formatCurrency(member.cost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 Custos de Locomoção */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Top 5 Custos de Locomoção
                  </h3>
                  <p className="text-sm text-gray-500">Dados insuficientes para análise.</p>
                </CardContent>
              </Card>

              {/* Top 5 locais por nº de shows */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Top 5 locais por nº de shows
                  </h3>
                  <div className="space-y-2">
                    {venuesByShowCount.map((venue, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">
                          {index + 1}. {venue.name}
                        </span>
                        <div className="bg-primary text-white px-3 py-1 rounded-full">
                          <span className="text-xs font-bold">
                            {venue.count} {venue.count === 1 ? 'show' : 'shows'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <DemoMobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default DemoArtistReports;
