import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoMusicianSidebar } from '@/components/DemoMusicianSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { DemoLockedModal } from '@/components/DemoLockedModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Music2, Mic2, ChevronDown, ChevronUp, Edit, Trash2, X, Guitar, LayoutGrid, List } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationBell } from '@/components/NotificationBell';
import { CurrencyInput } from '@/components/ui/currency-input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DemoMusicianShows = () => {
  const isMobile = useIsMobile();
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showDialogOpen, setShowDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [instrumentDialogOpen, setInstrumentDialogOpen] = useState(false);
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [personalExpenses, setPersonalExpenses] = useState<Array<{ description: string; cost: string }>>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [showFormData, setShowFormData] = useState({
    artist_id: '',
    venue_id: '',
    custom_venue: '',
    date_local: '',
    time_local: '20:00',
    fee: '',
    instrument_id: '',
    duration: '4',
    is_private_event: false
  });

  const lastUpdated = new Date();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = String(currentDate.getMonth() + 1).padStart(2, '0');

  const demoArtists = [
    { id: '1', name: 'Gabriell Reis' },
    { id: '2', name: 'Gusttavo Lima' },
    { id: '3', name: 'Juliano' },
    { id: '4', name: 'Jorge e Mateus' },
    { id: '5', name: 'Guilherme' },
  ];

  const demoInstruments = [
    { id: '1', name: 'Bateria' },
    { id: '2', name: 'Baixo' },
    { id: '3', name: 'Guitarra' },
    { id: '4', name: 'Teclado' },
    { id: '5', name: 'Violão' },
    { id: '6', name: 'Saxofone' },
    { id: '7', name: 'Trompete' },
    { id: '8', name: 'Percussão' },
  ];

  const demoVenues = [
    { id: '1', name: 'Ditado Popular' },
    { id: '2', name: 'Bar do Zé' },
    { id: '3', name: 'Casa de Shows Ritmo' },
  ];

  const demoShows = [
    {
      id: '1',
      venue_name: 'Pub e Lounge Music Point',
      artist_name: 'Gabriell Reis',
      date_local: `${currentYear}-${currentMonthNum}-10`,
      time_local: '22:00',
      fee: 480,
      instrument: 'Guitarra',
      expenses: []
    },
    {
      id: '2',
      venue_name: 'Casa de Eventos Ritmo',
      artist_name: 'Gusttavo Lima',
      date_local: `${currentYear}-${currentMonthNum}-15`,
      time_local: '20:00',
      fee: 500,
      instrument: 'Baixo',
      expenses: []
    },
    {
      id: '3',
      venue_name: 'Salão de Festas Estrela',
      artist_name: 'Jorge e Mateus',
      date_local: `${currentYear}-${currentMonthNum}-25`,
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

  const handleFilterChange = (value: string) => {
    setShowLockedModal(true);
  };

  const addPersonalExpense = () => {
    setPersonalExpenses([...personalExpenses, { description: '', cost: '' }]);
  };

  const removePersonalExpense = (index: number) => {
    setPersonalExpenses(personalExpenses.filter((_, i) => i !== index));
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
                    
                    <Select defaultValue="upcoming" onValueChange={handleFilterChange}>
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
                    
                    <Button onClick={() => setShowDialogOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar
                    </Button>
                  </Card>

                  {/* Desktop header */}
                  <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Meus Freelas</h2>
                      <p className="text-sm text-gray-500">
                        Atualizado em {format(lastUpdated, "dd/MM/yyyy 'às' HH:mm:ss")}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="icon"
                          onClick={() => setViewMode('grid')}
                          className="h-8 w-8"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="icon"
                          onClick={() => setViewMode('list')}
                          className="h-8 w-8"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>

                      <Select defaultValue="upcoming" onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[200px] bg-white text-gray-900 border-gray-300">
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
                      
                      <Button onClick={() => setShowDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Shows list */}
                  {viewMode === 'list' && !isMobile ? <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
                      <div className="grid grid-cols-[1fr,120px,120px,120px] gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-600">
                        <div>Data e Local</div>
                        <div className="text-center">Cachê</div>
                        <div className="text-center">Despesas</div>
                        <div className="text-center">Lucro</div>
                      </div>
                      {demoShows.map((show) => {
                        const expenses = calculateShowExpenses(show);
                        const profit = calculateShowProfit(show);
                        const showDate = new Date(show.date_local);

                        return <div key={show.id} className="grid grid-cols-[1fr,120px,120px,120px] gap-4 p-4 border-b hover:bg-gray-50 items-center">
                            <div>
                              <div className="font-semibold text-gray-900">{show.venue_name}</div>
                              <div className="text-sm text-gray-600">
                                {(() => {
                                  const dayOfWeek = format(showDate, "EEEE", { locale: ptBR });
                                  const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
                                  return `${capitalizedDay}, ${format(showDate, "dd 'de' MMMM", { locale: ptBR })}`;
                                })()}
                                {show.time_local && ` 🕐 ${show.time_local}`}
                              </div>
                              <div className="text-sm text-gray-600">{show.artist_name}</div>
                              <div className="text-sm text-gray-500">{show.instrument}</div>
                            </div>
                            <div className="text-center font-semibold text-green-600">
                              R$ {show.fee.toFixed(2).replace('.', ',')}
                            </div>
                            <div className="text-center font-semibold text-red-600">
                              R$ {expenses.toFixed(2).replace('.', ',')}
                            </div>
                            <div className="text-center">
                              <span className="px-3 py-1 rounded-full bg-primary text-white font-bold text-sm inline-block">
                                R$ {profit.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>;
                      })}
                    </div> : <div className="grid gap-4">
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
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    {format(showDate, "EEEE", { locale: ptBR })} • 
                                    <Clock className="w-3 h-3" />
                                    {show.time_local}
                                  </p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Music2 className="w-3 h-3" />
                                    {show.artist_name}
                                  </p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Guitar className="w-3 h-3" />
                                    {show.instrument}
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
                  </div>}

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
                  <Card className="bg-white border border-gray-200 p-4 md:p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Meus Artistas</h2>
                      <p className="text-sm text-gray-600">Gerencie os artistas com quem você trabalha</p>
                    </div>

                    <Button onClick={() => setShowLockedModal(true)} className="w-full bg-primary hover:bg-primary/90 text-white mb-4">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar Artista
                    </Button>

                    <div className="space-y-3">
                      {demoArtists.map((artist) => (
                        <Card key={artist.id} className="p-4 bg-white border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#F5F0FA] flex items-center justify-center">
                              <Mic2 className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-gray-900">{artist.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-100" onClick={() => setShowLockedModal(true)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => setShowLockedModal(true)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                {/* INSTRUMENTOS TAB */}
                <TabsContent value="instruments" className="mt-0 md:mt-6">
                  <Card className="bg-white border border-gray-200 p-4 md:p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Meus Instrumentos</h2>
                      <p className="text-sm text-gray-600">Gerencie os instrumentos que você toca</p>
                    </div>

                    <Button onClick={() => setShowLockedModal(true)} className="w-full bg-primary hover:bg-primary/90 text-white mb-4">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar Instrumento
                    </Button>

                    <div className="space-y-3">
                      {demoInstruments.map((instrument) => (
                        <Card key={instrument.id} className="p-4 bg-white border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#F5F0FA] flex items-center justify-center">
                              <Music2 className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-gray-900">{instrument.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-100" onClick={() => setShowLockedModal(true)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => setShowLockedModal(true)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                {/* LOCAIS TAB */}
                <TabsContent value="venues" className="mt-0 md:mt-6">
                  <Card className="bg-white border border-gray-200 p-4 md:p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Meus Locais</h2>
                      <p className="text-sm text-gray-600">Gerencie os locais onde você se apresenta</p>
                    </div>

                    <Button onClick={() => setShowLockedModal(true)} className="w-full bg-primary hover:bg-primary/90 text-white mb-4">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar Local
                    </Button>

                    <div className="space-y-3">
                      {demoVenues.map((venue) => (
                        <Card key={venue.id} className="p-4 bg-white border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#F5F0FA] flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-gray-900">{venue.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-100" onClick={() => setShowLockedModal(true)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => setShowLockedModal(true)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
        
        <DemoMobileBottomNav role="musician" />
      </div>

      {/* Add Show Dialog */}
      <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
        <DialogContent className="bg-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-gray-900">Adicionar Show</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowLockedModal(true); }}>
            <div>
              <Button 
                type="button"
                variant="outline" 
                className="w-full bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                onClick={() => setShowFormData({...showFormData, is_private_event: !showFormData.is_private_event})}
              >
                Evento Particular
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informações do Show</h3>
              
              <div>
                <Label className="text-gray-900">Artista *</Label>
                <Select value={showFormData.artist_id} onValueChange={(value) => setShowFormData({...showFormData, artist_id: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Selecione o artista" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {demoArtists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id} className="text-gray-900">{artist.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-900">Local do Show *</Label>
                {showFormData.is_private_event ? (
                  <Input
                    value={showFormData.custom_venue}
                    onChange={(e) => setShowFormData({...showFormData, custom_venue: e.target.value})}
                    placeholder="Digite o nome do local"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                ) : (
                  <Select value={showFormData.venue_id} onValueChange={(value) => {
                    const venue = demoVenues.find(v => v.id === value);
                    if (value === 'new') {
                      setVenueDialogOpen(true);
                    } else {
                      setShowFormData({...showFormData, venue_id: value, custom_venue: venue?.name || ''});
                    }
                  }}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {demoVenues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id} className="text-gray-900">{venue.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900">Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-900">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : <span className="text-gray-500">Selecione a...</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-gray-200">
                      <CalendarComponent
                        mode="single"
                        variant="light"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-gray-900">Horário *</Label>
                  <div className="flex items-center border border-gray-300 rounded-md bg-white px-3">
                    <Clock className="w-4 h-4 mr-2 text-gray-900" />
                    <Input
                      type="time"
                      value={showFormData.time_local}
                      onChange={(e) => setShowFormData({...showFormData, time_local: e.target.value})}
                      className="border-0 bg-transparent text-gray-900 p-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-900">Duração do Show</Label>
                <Select value={showFormData.duration} onValueChange={(value) => setShowFormData({...showFormData, duration: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="2" className="text-gray-900">2 horas</SelectItem>
                    <SelectItem value="3" className="text-gray-900">3 horas</SelectItem>
                    <SelectItem value="4" className="text-gray-900">4 horas</SelectItem>
                    <SelectItem value="5" className="text-gray-900">5 horas</SelectItem>
                    <SelectItem value="6" className="text-gray-900">6 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Seu Cachê</h3>
              
              <div>
                <Label className="text-gray-900">Seu Cachê Individual *</Label>
                <CurrencyInput
                  value={showFormData.fee}
                  onChange={(value) => setShowFormData({...showFormData, fee: value})}
                  placeholder="R$ 0,00"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <Label className="text-gray-900">Função/Instrumento *</Label>
                <Select value={showFormData.instrument_id} onValueChange={(value) => setShowFormData({...showFormData, instrument_id: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Selecione um instrumento" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {demoInstruments.map((instrument) => (
                      <SelectItem key={instrument.id} value={instrument.id} className="text-gray-900">{instrument.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-900">Despesas Pessoais</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addPersonalExpense}
                    className="text-primary hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Despesa
                  </Button>
                </div>

                {personalExpenses.map((expense, index) => (
                  <div key={index} className="space-y-2 p-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Despesa {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePersonalExpense(index)}
                        className="h-6 w-6 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      value={expense.description}
                      onChange={(e) => {
                        const newExpenses = [...personalExpenses];
                        newExpenses[index].description = e.target.value;
                        setPersonalExpenses(newExpenses);
                      }}
                      placeholder="Descrição (ex: Uber, Cordas)"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                    <CurrencyInput
                      value={expense.cost}
                      onChange={(value) => {
                        const newExpenses = [...personalExpenses];
                        newExpenses[index].cost = value;
                        setPersonalExpenses(newExpenses);
                      }}
                      placeholder="R$ 0,00"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                Cadastrar Show
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DemoLockedModal open={showLockedModal} onOpenChange={setShowLockedModal} />
    </SidebarProvider>
  );
};

export default DemoMusicianShows;