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
import { Music2, DollarSign, TrendingDown, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';

const DemoArtistReports = () => {
  const [period, setPeriod] = useState('this-month');
  const [visibleShows, setVisibleShows] = useState(5);

  const stats = {
    totalShows: 24,
    totalRevenue: 28500,
    totalExpenses: 12300,
    totalProfit: 16200,
    averageTicket: 675,
    monthlyAverage: 5400
  };

  const venuesByProfit = [
    { name: 'Pub Rock City', profit: 3200 },
    { name: 'Teatro Municipal', profit: 2800 },
    { name: 'Festa Corporativa', profit: 2500 }
  ];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const handleExport = (type: string) => {
    toast.info('Modo Demo', {
      description: `Exportação ${type} disponível apenas na versão completa.`
    });
  };

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

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide">
            <div className="max-w-7xl mx-auto space-y-6">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Período:</label>
                      <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-full bg-white text-gray-900 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-gray-900">
                          <SelectItem value="this-month">Este Mês</SelectItem>
                          <SelectItem value="last-month">Mês Passado</SelectItem>
                          <SelectItem value="this-year">Este Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => handleExport('PDF')} variant="outline" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Exportar PDF
                      </Button>
                      <Button onClick={() => handleExport('XLSX')} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar XLSX
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total de Shows</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalShows}</p>
                      </div>
                      <Music2 className="w-12 h-12 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Receita Bruta</p>
                        <p className="text-3xl font-bold text-green-600">R$ {formatCurrency(stats.totalRevenue)}</p>
                      </div>
                      <DollarSign className="w-12 h-12 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Lucro Líquido</p>
                        <p className="text-3xl font-bold text-blue-600">R$ {formatCurrency(stats.totalProfit)}</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Top 3 Locais por Lucro</h3>
                  <div className="space-y-3">
                    {venuesByProfit.map((venue, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-purple-600">{i + 1}º</span>
                          <span className="font-medium">{venue.name}</span>
                        </div>
                        <span className="text-green-600 font-bold">R$ {formatCurrency(venue.profit)}</span>
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
