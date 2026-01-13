import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoMusicianSidebar } from '@/components/DemoMusicianSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { DemoLockedModal } from '@/components/DemoLockedModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationBell } from '@/components/NotificationBell';
import { Music2, DollarSign, TrendingUp, TrendingDown, FileText, Download, Mic2, MapPin, Car, Receipt } from 'lucide-react';

const DemoMusicianReports = () => {
  const [period, setPeriod] = useState('this-month');
  const [showLockedModal, setShowLockedModal] = useState(false);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = String(currentDate.getMonth() + 1).padStart(2, '0');

  const demoShows = [
    {
      id: '1',
      venue_name: 'Pub e Lounge Music Point',
      artist_name: 'Gabriell Reis',
      date_local: `${currentYear}-${currentMonthNum}-10`,
      fee: 480,
      expenses: 45
    },
    {
      id: '2',
      venue_name: 'Casa de Eventos Ritmo',
      artist_name: 'Gusttavo Lima',
      date_local: `${currentYear}-${currentMonthNum}-15`,
      fee: 500,
      expenses: 35
    },
    {
      id: '3',
      venue_name: 'Salão de Festas Estrela',
      artist_name: 'Jorge e Mateus',
      date_local: `${currentYear}-${currentMonthNum}-25`,
      fee: 450,
      expenses: 28
    }
  ];

  const totalShows = demoShows.length;
  const totalRevenue = demoShows.reduce((sum, show) => sum + show.fee, 0);
  const totalExpenses = demoShows.reduce((sum, show) => sum + show.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const averageTicket = totalShows > 0 ? totalRevenue / totalShows : 0;

  const artistsByProfit = [
    { name: 'Gabriell Reis', profit: 480 },
    { name: 'Gusttavo Lima', profit: 500 },
    { name: 'Jorge e Mateus', profit: 450 }
  ].sort((a, b) => b.profit - a.profit).slice(0, 5);

  const venuesByShows = [
    { name: 'Pub e Lounge Music Point', shows: 1 },
    { name: 'Casa de Eventos Ritmo', shows: 1 },
    { name: 'Salão de Festas Estrela', shows: 1 }
  ].sort((a, b) => b.shows - a.shows).slice(0, 5);

  const transportCosts = [
    { name: 'Pub e Lounge Music Point', cost: 33 },
    { name: 'Casa de Eventos Ritmo', cost: 28 },
    { name: 'Salão de Festas Estrela', cost: 25 }
  ].sort((a, b) => b.cost - a.cost).slice(0, 5);

  // Demo additional expenses data
  const demoAdditionalExpenses = [
    { category: 'equipamento', cost: 180 },
    { category: 'acessorio', cost: 65 },
    { category: 'manutencao', cost: 120 },
    { category: 'formacao', cost: 250 },
    { category: 'software', cost: 45 }
  ];

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

  const additionalExpensesByCategory = demoAdditionalExpenses
    .map(exp => ({ name: categoryLabels[exp.category] || exp.category, cost: exp.cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  const totalAdditionalExpenses = demoAdditionalExpenses.reduce((sum, exp) => sum + exp.cost, 0);
  const totalLocomotionExpenses = transportCosts.reduce((sum, item) => sum + item.cost, 0);
  const totalAllExpenses = totalExpenses + totalLocomotionExpenses + totalAdditionalExpenses;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoMusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="musician" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Period and Export Card */}
              <Card className="bg-white border border-gray-200 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Período:</label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-full bg-white border-2 border-primary text-gray-900 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="this-month" className="text-gray-900">Este Mês</SelectItem>
                        <SelectItem value="last-month" className="text-gray-900">Mês Passado</SelectItem>
                        <SelectItem value="this-year" className="text-gray-900">Este Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => setShowLockedModal(true)}
                      className="bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      onClick={() => setShowLockedModal(true)}
                      className="bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      XLSX
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Total de Shows */}
              <Card className="bg-white border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Shows</p>
                    <p className="text-4xl font-bold text-gray-900">{totalShows}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>

              {/* Cachê Total */}
              <Card className="bg-white border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cachê Total (Período)</p>
                    <p className="text-4xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              {/* Despesas */}
              <Card className="bg-white border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Despesas (Período)</p>
                    <p className="text-4xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </Card>

              {/* Lucro Líquido */}
              <Card className="bg-white border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lucro Líquido (Período)</p>
                    <p className="text-4xl font-bold text-gray-900">{formatCurrency(netProfit)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              {/* Ticket Médio */}
              <Card className="bg-white border border-gray-200 p-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ticket Médio (Período)</p>
                  <p className="text-xs text-gray-500 mb-3">Seu lucro líquido médio por show no período selecionado.</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{formatCurrency(averageTicket)}</p>
                      <p className="text-xs text-gray-500">Valor exato: {formatCurrency(averageTicket)} / show</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Resumo de Despesas Adicionais */}
              <Card className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-gray-900" />
                    <h3 className="font-bold text-gray-900">Resumo de Despesas Adicionais</h3>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">
                    Total: {formatCurrency(totalAdditionalExpenses)}
                  </span>
                </div>
                
                {additionalExpensesByCategory.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {additionalExpensesByCategory.map((exp, index) => (
                      <div key={index}>
                        <p className="text-gray-500">{exp.name}</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(exp.cost)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma despesa adicional registrada no período.</p>
                )}
              </Card>
              {/* Top 5 Artistas por Lucro */}
              <Card className="bg-white border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mic2 className="w-5 h-5 text-gray-900" />
                  <h3 className="font-bold text-gray-900">Top 5 Artistas por Lucro</h3>
                </div>
                <div className="space-y-2">
                  {artistsByProfit.map((artist, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{index + 1}. {artist.name}</span>
                      <span className="px-3 py-1 rounded-full bg-primary text-white text-sm font-bold">
                        {formatCurrency(artist.profit)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top 5 locais por nº de shows */}
              <Card className="bg-white border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-900" />
                  <h3 className="font-bold text-gray-900">Top 5 locais por nº de shows</h3>
                </div>
                <div className="space-y-2">
                  {venuesByShows.map((venue, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{index + 1}. {venue.name}</span>
                      <span className="px-3 py-1 rounded-full bg-primary text-white text-sm font-bold">
                        {venue.shows} show{venue.shows !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top 5 Custos de Locomoção */}
              <Card className="bg-white border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Car className="w-5 h-5 text-gray-900" />
                  <h3 className="font-bold text-gray-900">Top 5 Custos de Locomoção</h3>
                </div>
                <div className="space-y-2">
                  {transportCosts.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{index + 1}. {item.name}</span>
                      <span className="px-3 py-1 rounded-full bg-primary text-white text-sm font-bold">
                        {formatCurrency(item.cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top 5 Despesas Adicionais */}
              <Card className="bg-white border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-gray-900" />
                  <h3 className="font-bold text-gray-900">Top 5 Despesas Adicionais</h3>
                </div>
                <div className="space-y-2">
                  {additionalExpensesByCategory.map((exp, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{index + 1}. {exp.name}</span>
                      <span className="px-3 py-1 rounded-full bg-primary text-white text-sm font-bold">
                        {formatCurrency(exp.cost)}
                      </span>
                    </div>
                  ))}
                  {additionalExpensesByCategory.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhuma despesa adicional registrada.</p>
                  )}
                </div>
              </Card>
            </div>
          </main>
        </div>
        
        <DemoMobileBottomNav role="musician" />
      </div>
      
      <DemoLockedModal open={showLockedModal} onOpenChange={setShowLockedModal} />
    </SidebarProvider>
  );
};

export default DemoMusicianReports;
