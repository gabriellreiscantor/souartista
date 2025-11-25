import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoMusicianSidebar } from '@/components/DemoMusicianSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Music2, Mic2, ChevronDown, ChevronUp, Guitar } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DemoMusicianShows = () => {
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const lastUpdated = new Date();

  const demoShows = [
    {
      id: '1',
      venue_name: 'Pub Rock City',
      artist_name: 'João Silva',
      date_local: '2025-01-10',
      time_local: '22:00',
      fee: 480,
      instrument: 'Guitarra',
      expenses: []
    },
    {
      id: '2',
      venue_name: 'Teatro Municipal',
      artist_name: 'Maria Santos',
      date_local: '2025-01-15',
      time_local: '20:00',
      fee: 500,
      instrument: 'Baixo',
      expenses: []
    },
    {
      id: '3',
      venue_name: 'Festa Corporativa',
      artist_name: 'Pedro Costa',
      date_local: '2025-01-25',
      time_local: '19:00',
      fee: 450,
      instrument: 'Teclado',
      expenses: []
    }
  ];

  const toggleShowExpanded = (id: string) => {
    const newExpanded = new Set(expandedShows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedShows(newExpanded);
  };

  const calculateShowExpenses = (show: typeof demoShows[0]) => {
    return show.expenses.reduce((sum, expense: any) => sum + expense.cost, 0);
  };

  const calculateShowProfit = (show: typeof demoShows[0]) => {
    return show.fee - calculateShowExpenses(show);
  };

  const calculateTotals = () => {
    const totalRevenue = demoShows.reduce((sum, show) => sum + show.fee, 0);
    const totalExpenses = demoShows.reduce((sum, show) => sum + calculateShowExpenses(show), 0);
    const netProfit = totalRevenue - totalExpenses;
    return { totalRevenue, totalExpenses, netProfit };
  };

  const handleDemoAction = () => {
    toast.info('Modo Demo', {
      description: 'Esta função está disponível apenas na versão completa.'
    });
  };

  const totals = calculateTotals();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoMusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Shows</h1>
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
            <div className="max-w-4xl mx-auto">
              <Tabs defaultValue="shows" className="w-full">
                {/* Mobile tabs */}
                <Card className="md:hidden bg-[#EAD6F5] border-0 mb-4">
                  <TabsList className="w-full grid grid-cols-4 bg-transparent p-0 h-auto">
                    <TabsTrigger value="shows" className="flex flex-col items-center gap-1 bg-transparent text-gray-700 data-[state=active]:bg-transparent data-[state=active]:text-primary py-3 border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                      <Music2 className="w-5 h-5" />
                      <span className="text-xs">Freelas</span>
                    </TabsTrigger>
                    <TabsTrigger value="artists" className="flex flex-col items-center gap-1 bg-transparent text-gray-700 data-[state=active]:bg-transparent data-[state=active]:text-primary py-3 border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                      <Mic2 className="w-5 h-5" />
                      <span className="text-xs">Artistas</span>
                    </TabsTrigger>
                    <TabsTrigger value="instruments" className="flex flex-col items-center gap-1 bg-transparent text-gray-700 data-[state=active]:bg-transparent data-[state=active]:text-primary py-3 border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                      <Music2 className="w-5 h-5" />
                      <span className="text-xs">Instrumentos</span>
                    </TabsTrigger>
                    <TabsTrigger value="venues" className="flex flex-col items-center gap-1 bg-transparent text-gray-700 data-[state=active]:bg-transparent data-[state=active]:text-primary py-3 border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                      <MapPin className="w-5 h-5" />
                      <span className="text-xs">Locais</span>
                    </TabsTrigger>
                  </TabsList>
                </Card>

                {/* Desktop tabs */}
                <TabsList className="hidden md:grid w-full grid-cols-4 bg-white">
                  <TabsTrigger value="shows" className="flex items-center gap-2">
                    <Music2 className="w-4 h-4" />
                    Meus Freelas
                  </TabsTrigger>
                  <TabsTrigger value="artists" className="flex items-center gap-2">
                    <Mic2 className="w-4 h-4" />
                    Artistas
                  </TabsTrigger>
                  <TabsTrigger value="instruments" className="flex items-center gap-2">
                    <Music2 className="w-4 h-4" />
                    Instrumentos
                  </TabsTrigger>
                  <TabsTrigger value="venues" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Locais e Bares
                  </TabsTrigger>
                </TabsList>

                {/* MEUS FREELAS TAB */}
                <TabsContent value="shows" className="mt-0 md:mt-6">
                  {/* Mobile header */}
                  <Card className="md:hidden bg-white border border-gray-200 p-4 space-y-3 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Meus Freelas</h2>
                      <p className="text-xs text-gray-500">
                        Atualizado em {format(lastUpdated, "dd/MM/yyyy 'às' HH:mm:ss")}
                      </p>
                    </div>
                    
                    <Select defaultValue="upcoming">
                      <SelectTrigger className="w-full bg-white text-gray-900 border-gray-300">
                        <CalendarIcon className="w-4 h-4 mr-2 text-gray-900" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="upcoming" className="text-gray-900">Próximos Shows</SelectItem>
                        <SelectItem value="thisWeek" className="text-gray-900">Esta Semana</SelectItem>
                        <SelectItem value="lastWeek" className="text-gray-900">Semana Passada</SelectItem>
                        <SelectItem value="twoWeeksAgo" className="text-gray-900">Semana Retrasada</SelectItem>
                        <SelectItem value="thisMonth" className="text-gray-900">Este Mês</SelectItem>
                        <SelectItem value="all" className="text-gray-900">Todos os Shows</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button onClick={handleDemoAction} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar
                    </Button>
                  </Card>

                  {/* Shows list */}
                  <div className="grid gap-4">
                    {demoShows.map((show) => {
                      const expenses = calculateShowExpenses(show);
                      const profit = calculateShowProfit(show);
                      const isExpanded = expandedShows.has(show.id);
                      const showDate = new Date(show.date_local);
                      
                      return (
                        <Card key={show.id} className="bg-white border border-gray-200 overflow-hidden">
                          <div className="p-4 md:p-6">
                            <div className="flex gap-3 md:gap-4">
                              <div className="flex-shrink-0 w-16 text-center bg-[#F5F0FA] rounded-lg p-2 border-2 border-purple-200">
                                <div className="text-xs text-primary font-bold uppercase">{format(showDate, 'MMM', { locale: ptBR })}</div>
                                <div className="text-3xl font-bold text-gray-900">{format(showDate, 'dd')}</div>
                              </div>
                              <div className="flex-1">
                                <div className="mb-2">
                                  <h3 className="text-base md:text-lg font-bold text-gray-900">{show.venue_name}</h3>
                                  <p className="text-sm text-gray-600">
                                    Artista: {show.artist_name}
                                  </p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    {format(showDate, "EEEE", { locale: ptBR })} • 
                                    <Clock className="w-3 h-3" />
                                    {show.time_local}
                                  </p>
                                </div>
                                <div className="flex gap-3 md:gap-6 text-sm">
                                  <div className="flex-1 text-center">
                                    <div className="text-gray-600 text-xs">Meu Cachê</div>
                                    <div className="text-green-600 font-bold text-sm md:text-base">R$ {show.fee.toFixed(2).replace('.', ',')}</div>
                                  </div>
                                  <div className="flex-1 text-center">
                                    <div className="text-gray-600 text-xs">Despesas</div>
                                    <div className="text-red-600 font-bold text-sm md:text-base">R$ {expenses.toFixed(2).replace('.', ',')}</div>
                                  </div>
                                  <div className="flex-1 text-center">
                                    <div className="text-gray-600 text-xs">Lucro</div>
                                    <div className="px-2 md:px-3 py-1 rounded-full bg-primary text-white font-bold text-xs md:text-sm inline-block">
                                      R$ {profit.toFixed(2).replace('.', ',')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {show.expenses.length > 0 && (
                              <Collapsible open={isExpanded} onOpenChange={() => toggleShowExpanded(show.id)}>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full mt-4 bg-[#F5F0FA] hover:bg-[#EAD6F5] text-primary font-semibold">
                                    Detalhes das Despesas
                                    {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-4">
                                  <div className="p-3 md:p-4 bg-[#F5F0FA] rounded-lg">
                                    <div className="text-sm font-semibold text-gray-900 mb-2">Minhas Despesas</div>
                                    {show.expenses.map((expense: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span className="text-gray-500">{expense.description}</span>
                                        <span className="font-medium">R$ {expense.cost.toFixed(2).replace('.', ',')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Financial summary */}
                  <Card className="p-4 md:p-6 bg-[#F5F0FA] border-0 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-xl">$</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Cachê Total</div>
                          <div className="text-lg md:text-xl font-bold text-gray-900">R$ {totals.totalRevenue.toFixed(2).replace('.', ',')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xl">↓</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Despesas</div>
                          <div className="text-lg md:text-xl font-bold text-gray-900">R$ {totals.totalExpenses.toFixed(2).replace('.', ',')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xl">↑</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Lucro Líquido</div>
                          <div className="text-lg md:text-xl font-bold text-gray-900">R$ {totals.netProfit.toFixed(2).replace('.', ',')}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* ARTISTAS TAB */}
                <TabsContent value="artists" className="mt-0 md:mt-6">
                  <Card className="p-8 text-center bg-white border border-gray-200">
                    <Mic2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Modo Demo - Gerencie seus artistas na versão completa</p>
                    <Button onClick={handleDemoAction} variant="outline">
                      Criar Conta para Gerenciar Artistas
                    </Button>
                  </Card>
                </TabsContent>

                {/* INSTRUMENTOS TAB */}
                <TabsContent value="instruments" className="mt-0 md:mt-6">
                  <Card className="p-8 text-center bg-white border border-gray-200">
                    <Guitar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Modo Demo - Gerencie seus instrumentos na versão completa</p>
                    <Button onClick={handleDemoAction} variant="outline">
                      Criar Conta para Gerenciar Instrumentos
                    </Button>
                  </Card>
                </TabsContent>

                {/* LOCAIS TAB */}
                <TabsContent value="venues" className="mt-0 md:mt-6">
                  <Card className="p-8 text-center bg-white border border-gray-200">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Modo Demo - Gerencie seus locais na versão completa</p>
                    <Button onClick={handleDemoAction} variant="outline">
                      Criar Conta para Gerenciar Locais
                    </Button>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
        
        <DemoMobileBottomNav role="musician" />
      </div>
    </SidebarProvider>
  );
};

export default DemoMusicianShows;
