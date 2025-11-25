import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoArtistSidebar } from '@/components/DemoArtistSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { DemoLockedModal } from '@/components/DemoLockedModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Music2, Users, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const DemoArtistShows = () => {
  const [showFilter, setShowFilter] = useState('lastWeek');
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const [addVenueOpen, setAddVenueOpen] = useState(false);
  const [addMusicianOpen, setAddMusicianOpen] = useState(false);
  const [addShowOpen, setAddShowOpen] = useState(false);
  const [isPrivateEvent, setIsPrivateEvent] = useState(false);
  const [lockedModalOpen, setLockedModalOpen] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [musicianName, setMusicianName] = useState('');
  const [musicianInstrument, setMusicianInstrument] = useState('');
  const [musicianFee, setMusicianFee] = useState('');
  const [showVenue, setShowVenue] = useState('');
  const [showCustomVenue, setShowCustomVenue] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [showFee, setShowFee] = useState('');
  const [showDuration, setShowDuration] = useState('');
  const [teamMembers, setTeamMembers] = useState<Array<{musicianId?: string, name: string, cost: number}>>([]);
  const [expenses, setExpenses] = useState<Array<{type: string, description: string, cost: number}>>([]);
  const lastUpdated = new Date();

  const demoShows = [
    {
      id: '1',
      venue_name: 'Bar e Restaurante Harmonia',
      date_local: '2025-11-18',
      time_local: '19:00',
      fee: 550,
      expenses_team: [
        { name: 'Carlos Silva', instrument: 'Baixo', cost: 100 },
        { name: 'Ana Santos', instrument: 'Teclado', cost: 50 }
      ],
      expenses_other: []
    },
    {
      id: '2',
      venue_name: 'Casa de Shows Melodia',
      date_local: '2025-11-12',
      time_local: '20:00',
      fee: 2500,
      expenses_team: [
        { name: 'João Costa', instrument: 'Bateria', cost: 800 },
        { name: 'Maria Oliveira', instrument: 'Guitarra', cost: 740 }
      ],
      expenses_other: []
    },
    {
      id: '3',
      venue_name: 'Pub e Lounge Estrela',
      date_local: '2025-11-14',
      time_local: '21:00',
      fee: 350,
      expenses_team: [],
      expenses_other: []
    },
    {
      id: '4',
      venue_name: 'Restaurante e Bar Acústico',
      date_local: '2025-11-14',
      time_local: '20:00',
      fee: 2100,
      expenses_team: [
        { name: 'Pedro Alves', instrument: 'Violão', cost: 1000 }
      ],
      expenses_other: []
    }
  ];

  const demoVenues = [
    {
      id: '1',
      name: 'Bar e Restaurante Harmonia',
      address: 'Goiânia - GO'
    },
    {
      id: '2',
      name: 'Casa de Shows Melodia',
      address: 'Cuiabá - MT'
    },
    {
      id: '3',
      name: 'Pub e Lounge Estrela',
      address: 'Goiânia - GO'
    },
    {
      id: '4',
      name: 'Restaurante e Bar Acústico',
      address: 'Cuiabá - MT'
    }
  ];

  const demoMusicians = [
    {
      id: '1',
      name: 'Freelancer',
      instrument: 'Baixista',
      default_fee: 150.00
    },
    {
      id: '2',
      name: 'Produtor Musical',
      instrument: 'Produtor',
      default_fee: 300.00
    },
    {
      id: '3',
      name: 'Hold',
      instrument: 'Tecladista',
      default_fee: 200.00
    },
    {
      id: '4',
      name: 'Videomaker',
      instrument: 'Videomaker',
      default_fee: 250.00
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
    const teamCosts = show.expenses_team.reduce((sum, member) => sum + member.cost, 0);
    const otherCosts = show.expenses_other.reduce((sum, expense) => sum + expense.cost, 0);
    return teamCosts + otherCosts;
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

  const handleSaveVenue = () => {
    setAddVenueOpen(false);
    setVenueName('');
    setVenueAddress('');
    setLockedModalOpen(true);
  };

  const handleSaveMusician = () => {
    setAddMusicianOpen(false);
    setMusicianName('');
    setMusicianInstrument('');
    setMusicianFee('');
    setLockedModalOpen(true);
  };

  const addTeamMember = () => {
    if (demoMusicians.length > 0) {
      const firstMusician = demoMusicians[0];
      setTeamMembers([...teamMembers, {
        musicianId: firstMusician.id,
        name: firstMusician.name,
        cost: firstMusician.default_fee,
      }]);
    }
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: string, value: any) => {
    const updated = [...teamMembers];
    if (field === 'musicianId') {
      const musician = demoMusicians.find(m => m.id === value);
      if (musician) {
        updated[index] = {
          musicianId: musician.id,
          name: musician.name,
          cost: musician.default_fee
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setTeamMembers(updated);
  };

  const addExpense = () => {
    setExpenses([...expenses, { type: '', description: '', cost: 0 }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: string, value: any) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  const handleSaveShow = () => {
    setAddShowOpen(false);
    setIsPrivateEvent(false);
    setShowVenue('');
    setShowCustomVenue('');
    setShowDate('');
    setShowTime('');
    setShowFee('');
    setShowDuration('');
    setTeamMembers([]);
    setExpenses([]);
    setLockedModalOpen(true);
  };

  const handleFilterChange = (value: string) => {
    if (value !== showFilter) {
      setLockedModalOpen(true);
    }
  };

  const totals = calculateTotals();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Shows</h1>
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
            <div className="max-w-5xl mx-auto">
              <Tabs defaultValue="shows" className="w-full">
                {/* Mobile tabs */}
                <Card className="md:hidden bg-[#EAD6F5] border-0 mb-4">
                  <TabsList className="w-full grid grid-cols-3 bg-transparent p-0 h-auto">
                    <TabsTrigger value="shows" className="flex flex-col items-center gap-1 bg-transparent text-gray-700 data-[state=active]:bg-transparent data-[state=active]:text-primary py-3 border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                      <Music2 className="w-5 h-5" />
                      <span className="text-xs">Agenda de Shows</span>
                    </TabsTrigger>
                    <TabsTrigger value="venues" className="flex flex-col items-center gap-1 bg-transparent text-gray-700 data-[state=active]:bg-transparent data-[state=active]:text-primary py-3 border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                      <MapPin className="w-5 h-5" />
                      <span className="text-xs">Locais e Bares</span>
                    </TabsTrigger>
                    <TabsTrigger value="musicians" className="flex flex-col items-center gap-1 bg-transparent text-gray-700 data-[state=active]:bg-transparent data-[state=active]:text-primary py-3 border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                      <Users className="w-5 h-5" />
                      <span className="text-xs">Músicos e Equipe</span>
                    </TabsTrigger>
                  </TabsList>
                </Card>

                {/* Desktop tabs */}
                <TabsList className="hidden md:grid w-full grid-cols-3 bg-white p-0 h-auto">
                  <TabsTrigger value="shows" className="flex items-center gap-2 bg-[#EAD6F5] text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                    <Music2 className="w-4 h-4" />
                    Agenda de Shows
                  </TabsTrigger>
                  <TabsTrigger value="venues" className="flex items-center gap-2 bg-[#EAD6F5] text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                    <MapPin className="w-4 h-4" />
                    Locais e Bares
                  </TabsTrigger>
                  <TabsTrigger value="musicians" className="flex items-center gap-2 bg-[#EAD6F5] text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                    <Users className="w-4 h-4" />
                    Músicos e Equipe
                  </TabsTrigger>
                </TabsList>

                {/* AGENDA DE SHOWS TAB */}
                <TabsContent value="shows" className="mt-0 md:mt-6 space-y-4 md:space-y-6">
                  <div className="space-y-4">
                    {/* Mobile header */}
                    <Card className="md:hidden bg-white border border-gray-200 p-4 space-y-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Agenda de Shows</h2>
                        <p className="text-xs text-gray-500">
                          Atualizado em {format(lastUpdated, "dd/MM/yyyy 'às' HH:mm:ss")}
                        </p>
                      </div>
                      
                      <Select value={showFilter} onValueChange={handleFilterChange}>
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

                      <Button onClick={() => setAddShowOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                        <Plus className="w-5 h-5 mr-2" />
                        Adicionar
                      </Button>
                    </Card>

                    {/* Shows list */}
                    <div className="grid gap-4 md:grid-cols-2">
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
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="text-base md:text-lg font-bold text-gray-900">{show.venue_name}</h3>
                                      <p className="text-sm text-gray-600 flex items-center gap-1">
                                        {format(showDate, "EEEE", { locale: ptBR })} • 
                                        <Clock className="w-3 h-3" />
                                        {show.time_local}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-3 md:gap-6 text-sm">
                                    <div className="flex-1 text-center">
                                      <div className="text-gray-600 text-xs">Cachê</div>
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

                              {show.expenses_team.length > 0 && (
                                <Collapsible open={isExpanded} onOpenChange={() => toggleShowExpanded(show.id)}>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full mt-4 bg-[#F5F0FA] hover:bg-[#EAD6F5] text-primary font-semibold">
                                      Detalhes das Despesas
                                      {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-4">
                                    <div className="p-3 md:p-4 bg-[#F5F0FA] rounded-lg">
                                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                        <Users className="w-4 h-4" />
                                        Equipe
                                      </div>
                                      {show.expenses_team.map((member, idx) => (
                                        <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                          <span className="text-gray-500">{member.name} ({member.instrument})</span>
                                          <span className="font-medium">R$ {member.cost.toFixed(2).replace('.', ',')}</span>
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
                    <Card className="p-4 md:p-6 bg-[#F5F0FA] border-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 text-xl">$</span>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Receita Bruta</div>
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
                  </div>
                </TabsContent>

                {/* LOCAIS E BARES TAB */}
                <TabsContent value="venues" className="mt-0 md:mt-6 space-y-4">
                  <Card className="md:hidden bg-white border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Locais e Bares</h2>
                    <Button onClick={() => setAddVenueOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar Local
                    </Button>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    {demoVenues.map((venue) => (
                      <Card key={venue.id} className="bg-white border border-gray-200 p-4 md:p-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F5F0FA] flex items-center justify-center border-2 border-purple-200">
                            <MapPin className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">{venue.name}</h3>
                            <p className="text-sm text-gray-600">{venue.address}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* MÚSICOS E EQUIPE TAB */}
                <TabsContent value="musicians" className="mt-0 md:mt-6 space-y-4">
                  <Card className="md:hidden bg-white border border-gray-200 p-4">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Músicos e Equipe</h2>
                      <p className="text-sm text-gray-500">Gerencie seus músicos e cachês padrão</p>
                    </div>
                    <Button onClick={() => setAddMusicianOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar
                    </Button>
                  </Card>

                  <div className="space-y-3">
                    {demoMusicians.map((musician) => (
                      <Card key={musician.id} className="bg-white border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F5F0FA] flex items-center justify-center border-2 border-purple-200">
                            <Music2 className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-900">{musician.name}</h3>
                            <p className="text-sm text-gray-600">{musician.instrument}</p>
                            <p className="text-sm font-semibold text-green-600">
                              Cachê padrão: R$ {musician.default_fee.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleDemoAction}
                              className="h-10 w-10 bg-gray-900 hover:bg-gray-800 border-0"
                            >
                              <Pencil className="h-4 w-4 text-white" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleDemoAction}
                              className="h-10 w-10 bg-red-900 hover:bg-red-800 border-0"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
        
        <DemoMobileBottomNav role="artist" />
      </div>

      {/* Add Show Modal */}
      <Dialog open={addShowOpen} onOpenChange={setAddShowOpen}>
        <DialogContent className="bg-white sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Adicionar Novo Show</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">
              Preencha as informações abaixo para gerenciar o show.
            </p>
            
            <Button 
              type="button"
              variant="outline" 
              className={cn(
                "w-full border-2 font-semibold",
                isPrivateEvent 
                  ? "bg-primary text-white border-primary hover:bg-primary/90" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => setIsPrivateEvent(!isPrivateEvent)}
            >
              Evento Particular
            </Button>
            
            {!isPrivateEvent ? (
              <div className="space-y-2">
                <Label htmlFor="show-venue" className="text-gray-900 font-semibold">Nome do local</Label>
                <Select value={showVenue} onValueChange={setShowVenue}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Selecione um local" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {demoVenues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id} className="text-gray-900">
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="show-custom-venue" className="text-gray-900 font-semibold">Nome do local</Label>
                <Input
                  id="show-custom-venue"
                  type="text"
                  placeholder="Digite o nome do local"
                  value={showCustomVenue}
                  onChange={(e) => setShowCustomVenue(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="show-date" className="text-gray-900 font-semibold">Data do show</Label>
              <Input
                id="show-date"
                type="date"
                placeholder="dd/mm/aaaa"
                value={showDate}
                onChange={(e) => setShowDate(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="show-time" className="text-gray-900 font-semibold">Horário</Label>
              <Input
                id="show-time"
                type="time"
                placeholder="--:--"
                value={showTime}
                onChange={(e) => setShowTime(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="show-duration" className="text-gray-900 font-semibold">Duração de show</Label>
              <Select value={showDuration} onValueChange={setShowDuration}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="4 horas" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="2" className="text-gray-900">2 horas</SelectItem>
                  <SelectItem value="3" className="text-gray-900">3 horas</SelectItem>
                  <SelectItem value="4" className="text-gray-900">4 horas</SelectItem>
                  <SelectItem value="5" className="text-gray-900">5 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="show-fee" className="text-gray-900 font-semibold">Cachê</Label>
              <Input
                id="show-fee"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="R$ 0,00"
                value={showFee}
                onChange={(e) => setShowFee(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            
            {/* Equipe/Músicos Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-900 font-semibold">Equipe/Músicos</div>
                  <div className="text-xs text-gray-500">
                    Custo total: R$ {teamMembers.reduce((s, m) => s + m.cost, 0).toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={addTeamMember}
                  className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Membro</span>
                    <button 
                      type="button"
                      onClick={() => removeTeamMember(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={member.musicianId || ''}
                      onValueChange={(value) => updateTeamMember(index, 'musicianId', value)}
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 text-sm h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {demoMusicians.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-sm text-gray-900">
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="R$ 150,00"
                      value={member.cost}
                      onChange={(e) => updateTeamMember(index, 'cost', parseFloat(e.target.value) || 0)}
                      className="bg-white border-gray-300 text-gray-900 text-sm h-9"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Despesas Adicionais Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-900 font-semibold">Despesas Adicionais</div>
                  <div className="text-xs text-gray-500">
                    Custo total: R$ {expenses.reduce((s, e) => s + e.cost, 0).toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={addExpense}
                  className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {expenses.map((expense, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Despesa</span>
                    <button 
                      type="button"
                      onClick={() => removeExpense(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Tipo"
                      value={expense.type}
                      onChange={(e) => updateExpense(index, 'type', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 text-sm h-9"
                    />
                    <Input
                      placeholder="Descrição"
                      value={expense.description}
                      onChange={(e) => updateExpense(index, 'description', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 text-sm h-9"
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="R$ 0,00"
                      value={expense.cost}
                      onChange={(e) => updateExpense(index, 'cost', parseFloat(e.target.value) || 0)}
                      className="bg-white border-gray-300 text-gray-900 text-sm h-9"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddShowOpen(false)}
                className="flex-1 border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveShow}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                Salvar Show
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Venue Modal */}
      <Dialog open={addVenueOpen} onOpenChange={setAddVenueOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">Adicionar Novo Local/Bar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600 text-center">
              Cadastre um local fixo para selecioná-lo facilmente ao agendar shows.
            </p>
            <p className="text-xs text-gray-400 italic text-center">
              (Caso for um particular, adicione pela aba "Agenda de Shows".)
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="venue-name" className="text-gray-900">Nome do Local/Bar</Label>
              <Input
                id="venue-name"
                placeholder="Ex: Bar do Zé"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="bg-white border-2 border-primary text-gray-900 focus:border-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="venue-state" className="text-gray-900">Estado</Label>
                <Select>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-500">
                    <SelectValue placeholder="Selecione o..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="GO">Goiás</SelectItem>
                    <SelectItem value="MT">Mato Grosso</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="venue-city" className="text-gray-900">Cidade</Label>
                <Select>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-400">
                    <SelectValue placeholder="Escolha um..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="goiania">Goiânia</SelectItem>
                    <SelectItem value="cuiaba">Cuiabá</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setAddVenueOpen(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveVenue}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                Salvar Local
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Musician Modal */}
      <Dialog open={addMusicianOpen} onOpenChange={setAddMusicianOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Adicionar Músico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="musician-name" className="text-gray-900">Nome</Label>
              <Input
                id="musician-name"
                placeholder="Ex: João Silva"
                value={musicianName}
                onChange={(e) => setMusicianName(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="musician-instrument" className="text-gray-900">Instrumento/Função</Label>
              <Input
                id="musician-instrument"
                placeholder="Ex: Baixista"
                value={musicianInstrument}
                onChange={(e) => setMusicianInstrument(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="musician-fee" className="text-gray-900">Cachê Padrão</Label>
              <Input
                id="musician-fee"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ex: 150.00"
                value={musicianFee}
                onChange={(e) => setMusicianFee(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setAddMusicianOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveMusician}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                Cadastrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Locked Modal */}
      <DemoLockedModal open={lockedModalOpen} onOpenChange={setLockedModalOpen} />
    </SidebarProvider>
  );
};

export default DemoArtistShows;
