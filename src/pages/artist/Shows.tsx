import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Bell, Plus, Calendar as CalendarIcon, Clock, MapPin, DollarSign, Edit, Trash2, Music2, Users, List, Grid3x3, ChevronDown, ChevronUp, MoreVertical, TrendingDown, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Musician {
  id: string;
  name: string;
  instrument: string;
  default_fee: number;
}

interface Venue {
  id: string;
  name: string;
  address: string | null;
}

interface TeamMember {
  musicianId?: string;
  name: string;
  instrument: string;
  cost: number;
}

interface AdditionalExpense {
  description: string;
  cost: number;
}

interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
  is_private_event: boolean;
  expenses_team: TeamMember[];
  expenses_other: AdditionalExpense[];
  team_musician_ids: string[];
}

const ArtistShows = () => {
  const { user, userData, userRole } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Shows dialog
  const [showDialogOpen, setShowDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showFormData, setShowFormData] = useState({
    venue_id: '',
    custom_venue: '',
    date_local: '',
    time_local: '',
    fee: '',
    is_private_event: false,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);

  // Musicians dialog
  const [musicianDialogOpen, setMusicianDialogOpen] = useState(false);
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [musicianFormData, setMusicianFormData] = useState({
    name: '',
    instrument: '',
    default_fee: '',
  });

  // Venues dialog
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([fetchShows(), fetchMusicians(), fetchVenues()]);
  };

  const fetchShows = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('uid', user.id)
        .order('date_local', { ascending: true });

      if (error) throw error;
      
      const typedShows = (data || []).map(show => ({
        ...show,
        expenses_team: (show.expenses_team as any) || [],
        expenses_other: (show.expenses_other as any) || [],
      })) as Show[];
      
      setShows(typedShows);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching shows:', error);
      toast.error('Erro ao carregar shows');
    } finally {
      setLoading(false);
    }
  };

  const fetchMusicians = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('musicians')
        .select('*')
        .eq('owner_uid', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setMusicians(data || []);
    } catch (error: any) {
      console.error('Error fetching musicians:', error);
    }
  };

  const fetchVenues = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_uid', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setVenues(data || []);
    } catch (error: any) {
      console.error('Error fetching venues:', error);
    }
  };

  // Show handlers
  const handleShowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const venueName = showFormData.is_private_event 
        ? showFormData.custom_venue 
        : venues.find(v => v.id === showFormData.venue_id)?.name || showFormData.custom_venue;

      if (!venueName) {
        toast.error('Selecione ou digite o nome do local');
        return;
      }

      const teamMusicianIds = teamMembers
        .filter(m => m.musicianId)
        .map(m => m.musicianId!);

      const showData = {
        venue_name: venueName,
        date_local: showFormData.date_local,
        time_local: showFormData.time_local,
        fee: parseFloat(showFormData.fee),
        is_private_event: showFormData.is_private_event,
        expenses_team: teamMembers,
        expenses_other: additionalExpenses,
        team_musician_ids: teamMusicianIds,
        uid: user.id,
      };

      if (editingShow) {
        const { error } = await supabase
          .from('shows')
          .update({
            ...showData,
            expenses_team: showData.expenses_team as any,
            expenses_other: showData.expenses_other as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingShow.id);

        if (error) throw error;
        toast.success('Show atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('shows')
          .insert({
            ...showData,
            expenses_team: showData.expenses_team as any,
            expenses_other: showData.expenses_other as any,
          });

        if (error) throw error;
        toast.success('Show cadastrado com sucesso!');
      }

      setShowDialogOpen(false);
      resetShowForm();
      fetchShows();
    } catch (error: any) {
      console.error('Error saving show:', error);
      toast.error('Erro ao salvar show');
    }
  };

  const handleShowDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este show?')) return;

    try {
      const { error } = await supabase
        .from('shows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Show excluído com sucesso!');
      fetchShows();
    } catch (error: any) {
      console.error('Error deleting show:', error);
      toast.error('Erro ao excluir show');
    }
  };

  const handleShowEdit = (show: Show) => {
    setEditingShow(show);
    setShowFormData({
      venue_id: '',
      custom_venue: show.venue_name,
      date_local: show.date_local,
      time_local: show.time_local,
      fee: show.fee.toString(),
      is_private_event: show.is_private_event,
    });
    setTeamMembers(show.expenses_team || []);
    setAdditionalExpenses(show.expenses_other || []);
    setShowDialogOpen(true);
  };

  const resetShowForm = () => {
    setShowFormData({
      venue_id: '',
      custom_venue: '',
      date_local: '',
      time_local: '',
      fee: '',
      is_private_event: false,
    });
    setTeamMembers([]);
    setAdditionalExpenses([]);
    setEditingShow(null);
  };

  // Musician handlers
  const handleMusicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const musicianData = {
        name: musicianFormData.name,
        instrument: musicianFormData.instrument,
        default_fee: parseFloat(musicianFormData.default_fee),
        owner_uid: user.id,
      };

      if (editingMusician) {
        const { error } = await supabase
          .from('musicians')
          .update(musicianData)
          .eq('id', editingMusician.id);

        if (error) throw error;
        toast.success('Músico atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('musicians')
          .insert(musicianData);

        if (error) throw error;
        toast.success('Músico cadastrado com sucesso!');
      }

      setMusicianDialogOpen(false);
      resetMusicianForm();
      fetchMusicians();
    } catch (error: any) {
      toast.error('Erro ao salvar músico');
      console.error(error);
    }
  };

  const handleMusicianEdit = (musician: Musician) => {
    setEditingMusician(musician);
    setMusicianFormData({
      name: musician.name,
      instrument: musician.instrument,
      default_fee: musician.default_fee.toString(),
    });
    setMusicianDialogOpen(true);
  };

  const handleMusicianDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este músico?')) return;

    try {
      const { error } = await supabase
        .from('musicians')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Músico excluído com sucesso!');
      fetchMusicians();
    } catch (error: any) {
      toast.error('Erro ao excluir músico');
      console.error(error);
    }
  };

  const resetMusicianForm = () => {
    setMusicianFormData({ name: '', instrument: '', default_fee: '' });
    setEditingMusician(null);
  };

  // Venue handlers
  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const venueData = {
        name: venueFormData.name,
        address: venueFormData.address || null,
        owner_uid: user.id,
      };

      if (editingVenue) {
        const { error } = await supabase
          .from('venues')
          .update(venueData)
          .eq('id', editingVenue.id);

        if (error) throw error;
        toast.success('Local atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('venues')
          .insert(venueData);

        if (error) throw error;
        toast.success('Local cadastrado com sucesso!');
      }

      setVenueDialogOpen(false);
      resetVenueForm();
      fetchVenues();
    } catch (error: any) {
      toast.error('Erro ao salvar local');
      console.error(error);
    }
  };

  const handleVenueEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setVenueFormData({
      name: venue.name,
      address: venue.address || '',
    });
    setVenueDialogOpen(true);
  };

  const handleVenueDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;

    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Local excluído com sucesso!');
      fetchVenues();
    } catch (error: any) {
      toast.error('Erro ao excluir local');
      console.error(error);
    }
  };

  const resetVenueForm = () => {
    setVenueFormData({ name: '', address: '' });
    setEditingVenue(null);
  };

  // Team member helpers
  const addTeamMember = () => {
    // Se houver músicos cadastrados, adiciona o primeiro como padrão
    if (musicians.length > 0) {
      const firstMusician = musicians[0];
      setTeamMembers([...teamMembers, {
        musicianId: firstMusician.id,
        name: firstMusician.name,
        instrument: firstMusician.instrument,
        cost: firstMusician.default_fee,
      }]);
    } else {
      // Se não houver músicos, adiciona um membro vazio
      setTeamMembers([...teamMembers, { name: '', instrument: '', cost: 0 }]);
    }
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    const updated = [...teamMembers];
    
    if (field === 'musicianId' && value) {
      const musician = musicians.find(m => m.id === value);
      if (musician) {
        updated[index] = {
          musicianId: musician.id,
          name: musician.name,
          instrument: musician.instrument,
          cost: musician.default_fee,
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setTeamMembers(updated);
  };

  const addExpense = () => {
    setAdditionalExpenses([...additionalExpenses, { description: '', cost: 0 }]);
  };

  const removeExpense = (index: number) => {
    setAdditionalExpenses(additionalExpenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: keyof AdditionalExpense, value: any) => {
    const updated = [...additionalExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalExpenses(updated);
  };

  const toggleShowExpanded = (showId: string) => {
    const newExpanded = new Set(expandedShows);
    if (newExpanded.has(showId)) {
      newExpanded.delete(showId);
    } else {
      newExpanded.add(showId);
    }
    setExpandedShows(newExpanded);
  };

  const calculateTotals = () => {
    const totalRevenue = shows.reduce((sum, show) => sum + show.fee, 0);
    const totalExpenses = shows.reduce((sum, show) => {
      const teamCosts = show.expenses_team.reduce((teamSum, member) => teamSum + member.cost, 0);
      const otherCosts = show.expenses_other.reduce((otherSum, expense) => otherSum + expense.cost, 0);
      return sum + teamCosts + otherCosts;
    }, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    return { totalRevenue, totalExpenses, netProfit };
  };

  const calculateShowExpenses = (show: Show) => {
    const teamCosts = show.expenses_team.reduce((sum, member) => sum + member.cost, 0);
    const otherCosts = show.expenses_other.reduce((sum, expense) => sum + expense.cost, 0);
    return teamCosts + otherCosts;
  };

  const calculateShowProfit = (show: Show) => {
    return show.fee - calculateShowExpenses(show);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Shows</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>
              <UserMenu userName={userData?.name} userRole={userRole} />
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-5xl mx-auto">
              <Tabs defaultValue="shows" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white p-0 h-auto">
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
                <TabsContent value="shows" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Agenda de Shows</h2>
                        <p className="text-sm text-gray-500">
                          Atualizado em {format(lastUpdated, "dd/MM/yyyy 'às' HH:mm:ss")}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setViewMode('list')}
                          className={viewMode === 'list' ? 'bg-[#EAD6F5] text-gray-900 hover:bg-[#EAD6F5]' : 'bg-white text-gray-900'}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setViewMode('grid')}
                          className={viewMode === 'grid' ? 'bg-[#EAD6F5] text-gray-900 hover:bg-[#EAD6F5]' : 'bg-white text-gray-900'}
                        >
                          <Grid3x3 className="w-4 h-4" />
                        </Button>
                        <Select defaultValue="week">
                          <SelectTrigger className="w-[160px] bg-white text-gray-900">
                            <CalendarIcon className="w-4 h-4 mr-2 text-gray-900" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="week" className="text-gray-900">Esta Semana</SelectItem>
                            <SelectItem value="month" className="text-gray-900">Este Mês</SelectItem>
                            <SelectItem value="all" className="text-gray-900">Todos</SelectItem>
                          </SelectContent>
                        </Select>
                        <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={resetShowForm} className="bg-primary hover:bg-primary/90 text-white">
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900">
                                {editingShow ? 'Editar Show' : 'Adicionar Novo Show'}
                              </DialogTitle>
                              <p className="text-sm text-muted-foreground">
                                Preencha as informações abaixo para gerenciar o show.
                              </p>
                            </DialogHeader>
                            <form onSubmit={handleShowSubmit} className="space-y-6">
                              <div className="space-y-4">
                                <Button
                                  type="button"
                                  variant={showFormData.is_private_event ? "default" : "outline"}
                                  onClick={() => setShowFormData({ ...showFormData, is_private_event: !showFormData.is_private_event })}
                                  className={showFormData.is_private_event ? "bg-primary hover:bg-primary/90 text-white" : "bg-white hover:bg-gray-50 text-gray-900"}
                                >
                                  Evento Particular
                                </Button>

                                {showFormData.is_private_event ? (
                                  <div>
                                    <Label htmlFor="custom_venue" className="text-gray-900">Nome do local</Label>
                                    <Input
                                      id="custom_venue"
                                      value={showFormData.custom_venue}
                                      onChange={(e) => setShowFormData({ ...showFormData, custom_venue: e.target.value })}
                                      placeholder="Ex: Casamento Ana e Pedro"
                                      className="bg-white text-gray-900"
                                      required
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <Label htmlFor="venue_id" className="text-gray-900">Nome do local</Label>
                                    <Select value={showFormData.venue_id} onValueChange={(value) => setShowFormData({ ...showFormData, venue_id: value })}>
                                      <SelectTrigger className="bg-white text-gray-900">
                                        <SelectValue placeholder="Selecione um local" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white">
                                        {venues.map((venue) => (
                                          <SelectItem key={venue.id} value={venue.id}>
                                            {venue.name}
                                          </SelectItem>
                                        ))}
                                        <SelectItem value="custom">Outro local...</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {showFormData.venue_id === 'custom' && (
                                      <Input
                                        className="mt-2 bg-white text-gray-900"
                                        value={showFormData.custom_venue}
                                        onChange={(e) => setShowFormData({ ...showFormData, custom_venue: e.target.value })}
                                        placeholder="Digite o nome do local"
                                        required
                                      />
                                    )}
                                  </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label htmlFor="date_local" className="text-gray-900">Data do show</Label>
                                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal bg-white text-gray-900",
                                            !showFormData.date_local && "text-gray-500"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {showFormData.date_local ? format(new Date(showFormData.date_local), "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0 bg-primary border-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={showFormData.date_local ? new Date(showFormData.date_local) : undefined}
                                          onSelect={(date) => {
                                            if (date) {
                                              setShowFormData({ ...showFormData, date_local: format(date, 'yyyy-MM-dd') });
                                              setCalendarOpen(false);
                                            }
                                          }}
                                          initialFocus
                                          className="bg-primary text-white pointer-events-auto"
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <div>
                                    <Label htmlFor="time_local" className="text-gray-900">Horário</Label>
                                    <Input
                                      id="time_local"
                                      type="time"
                                      value={showFormData.time_local}
                                      onChange={(e) => setShowFormData({ ...showFormData, time_local: e.target.value })}
                                      className="bg-primary text-white placeholder:text-white/70 [&::-webkit-calendar-picker-indicator]:invert"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="duration" className="text-gray-900">Duração de show</Label>
                                    <Select defaultValue="4h">
                                      <SelectTrigger className="bg-white text-gray-900">
                                        <SelectValue placeholder="Horas..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white">
                                        <SelectItem value="2h" className="text-gray-900">2 horas</SelectItem>
                                        <SelectItem value="3h" className="text-gray-900">3 horas</SelectItem>
                                        <SelectItem value="4h" className="text-gray-900">4 horas</SelectItem>
                                        <SelectItem value="5h" className="text-gray-900">5 horas</SelectItem>
                                        <SelectItem value="6h" className="text-gray-900">6 horas</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="fee" className="text-gray-900">Cachê (R$)</Label>
                                  <Input
                                    id="fee"
                                    type="text"
                                    value={showFormData.fee}
                                    onChange={(e) => setShowFormData({ ...showFormData, fee: e.target.value })}
                                    placeholder="R$ 0,00"
                                    className="bg-white text-gray-900 placeholder:text-gray-500"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">Equipe/Músicos</h3>
                                    <p className="text-xs text-gray-900">Custo total: R$ {teamMembers.reduce((sum, m) => sum + m.cost, 0).toFixed(2)}</p>
                                  </div>
                                  <Button type="button" variant="outline" onClick={addTeamMember} className="bg-white hover:bg-gray-50 text-gray-900">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar
                                  </Button>
                                </div>

                                {teamMembers.map((member, index) => (
                                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-gray-900">Membro</Label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeTeamMember(index)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Select
                                          value={member.musicianId || ''}
                                          onValueChange={(value) => {
                                            if (value === 'freelancer') {
                                              updateTeamMember(index, 'musicianId', undefined);
                                            } else {
                                              updateTeamMember(index, 'musicianId', value);
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="bg-white text-gray-900">
                                            <SelectValue placeholder="Selecione um músico" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-white">
                                            {musicians.map((m) => (
                                              <SelectItem key={m.id} value={m.id} className="text-gray-900">
                                                {m.name} - {m.instrument}
                                              </SelectItem>
                                            ))}
                                            <SelectItem value="freelancer" className="text-gray-900">Freelancer</SelectItem>
                                          </SelectContent>
                                        </Select>

                                        {!member.musicianId && (
                                          <>
                                            <Input
                                              placeholder="Nome"
                                              value={member.name}
                                              onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                              className="mt-2 bg-white text-gray-900 placeholder:text-gray-500"
                                              required
                                            />
                                            <Input
                                              placeholder="Instrumento"
                                              value={member.instrument}
                                              onChange={(e) => updateTeamMember(index, 'instrument', e.target.value)}
                                              className="mt-2 bg-white text-gray-900 placeholder:text-gray-500"
                                              required
                                            />
                                          </>
                                        )}
                                      </div>
                                      <div>
                                        <Input
                                          type="text"
                                          placeholder="Custo (R$)"
                                          value={member.cost || ''}
                                          onChange={(e) => updateTeamMember(index, 'cost', parseFloat(e.target.value) || 0)}
                                          className="bg-white text-gray-900 placeholder:text-gray-500"
                                          required
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">Despesas Adicionais (Optional)</h3>
                                    <p className="text-xs text-gray-900">Custo total: R$ {additionalExpenses.reduce((sum, e) => sum + e.cost, 0).toFixed(2)}</p>
                                  </div>
                                  <Button type="button" variant="outline" onClick={addExpense} className="bg-white hover:bg-gray-50 text-gray-900">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Despesa
                                  </Button>
                                </div>

                                {additionalExpenses.map((expense, index) => (
                                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-gray-900">Despesa</Label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeExpense(index)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <Input
                                        placeholder="Descrição"
                                        value={expense.description}
                                        onChange={(e) => updateExpense(index, 'description', e.target.value)}
                                        className="bg-white text-gray-900"
                                        required
                                      />
                                      <Input
                                        type="text"
                                        placeholder="Valor (R$)"
                                        value={expense.cost || ''}
                                        onChange={(e) => updateExpense(index, 'cost', parseFloat(e.target.value) || 0)}
                                        className="bg-white text-gray-900"
                                        required
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setShowDialogOpen(false)} className="flex-1 bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                                  Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                                  Salvar Show
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {loading ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">Carregando...</p>
                      </div>
                    ) : shows.length === 0 ? (
                      <Card className="p-8 text-center bg-white border border-gray-200">
                        <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Nenhum show agendado</p>
                        <p className="text-sm text-gray-400">
                          Clique em "Adicionar" para cadastrar seu primeiro evento
                        </p>
                      </Card>
                    ) : (
                      <>
                        {viewMode === 'list' ? (
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-[1fr,120px,120px,120px,80px] gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-600">
                              <div>Data e Local</div>
                              <div className="text-center">Cachê</div>
                              <div className="text-center">Despesas</div>
                              <div className="text-center">Lucro</div>
                              <div className="text-center">Ações</div>
                            </div>
                            {shows.map((show) => {
                              const expenses = calculateShowExpenses(show);
                              const profit = calculateShowProfit(show);
                              const isExpanded = expandedShows.has(show.id);
                              
                              return (
                                <div key={show.id} className="border-b last:border-b-0">
                                  <div className="grid grid-cols-[1fr,120px,120px,120px,80px] gap-4 p-4 items-center hover:bg-gray-50">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => toggleShowExpanded(show.id)}
                                      >
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </Button>
                                      <div>
                                        <div className="font-semibold text-gray-900">{show.venue_name}</div>
                                        <div className="text-sm text-gray-600">
                                          {format(new Date(show.date_local), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} ⏰ {show.time_local}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-center text-green-600 font-semibold">R$ {show.fee.toFixed(2).replace('.', ',')}</div>
                                    <div className="text-center text-red-600 font-semibold">R$ {expenses.toFixed(2).replace('.', ',')}</div>
                                    <div className="text-center">
                                      <span className="inline-block px-3 py-1 rounded-full bg-primary text-white font-semibold text-sm">
                                        R$ {profit.toFixed(2).replace('.', ',')}
                                      </span>
                                    </div>
                                    <div className="flex justify-center">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          <DropdownMenuItem onClick={() => handleShowEdit(show)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleShowDelete(show.id)} className="text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                  {isExpanded && show.expenses_team.length > 0 && (
                                    <div className="px-4 pb-4 bg-[#F5F0FA]">
                                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                        <Users className="w-4 h-4" />
                                        Equipe
                                      </div>
                                      {show.expenses_team.map((member, idx) => (
                                        <div key={idx} className="flex justify-between text-sm text-gray-600 ml-6 mb-1">
                                          <span>{member.name} ({member.instrument})</span>
                                          <span>R$ {member.cost.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {shows.map((show) => {
                              const expenses = calculateShowExpenses(show);
                              const profit = calculateShowProfit(show);
                              const isExpanded = expandedShows.has(show.id);
                              const showDate = new Date(show.date_local);
                              
                              return (
                                <Card key={show.id} className="bg-white border border-gray-200 overflow-hidden">
                                  <div className="p-6">
                                    <div className="flex gap-4">
                                      <div className="flex-shrink-0 w-16 text-center bg-[#F5F0FA] rounded-lg p-2">
                                        <div className="text-xs text-primary font-semibold uppercase">{format(showDate, 'MMM', { locale: ptBR })}</div>
                                        <div className="text-3xl font-bold text-primary">{format(showDate, 'dd')}</div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                          <div>
                                            <h3 className="text-lg font-bold text-gray-900">{show.venue_name}</h3>
                                            <p className="text-sm text-gray-600">
                                              {format(showDate, "EEEE", { locale: ptBR })} • ⏰ {show.time_local}
                                            </p>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                              <DropdownMenuItem onClick={() => handleShowEdit(show)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleShowDelete(show.id)} className="text-red-600">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                        <div className="flex gap-6 text-sm">
                                          <div className="text-center">
                                            <div className="text-gray-600 text-xs">Cachê</div>
                                            <div className="text-green-600 font-semibold">R$ {show.fee.toFixed(2).replace('.', ',')}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-gray-600 text-xs">Despesas</div>
                                            <div className="text-red-600 font-semibold">R$ {expenses.toFixed(2).replace('.', ',')}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-gray-600 text-xs">Lucro</div>
                                            <div className="px-3 py-1 rounded-full bg-primary text-white font-semibold text-sm inline-block">
                                              R$ {profit.toFixed(2).replace('.', ',')}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {show.expenses_team.length > 0 && (
                                      <Collapsible open={isExpanded} onOpenChange={() => toggleShowExpanded(show.id)}>
                                        <CollapsibleTrigger asChild>
                                          <Button variant="ghost" className="w-full mt-4 bg-[#F5F0FA] hover:bg-[#EAD6F5] text-primary">
                                            Detalhes das Despesas
                                            {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                          </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-4">
                                          <div className="p-4 bg-[#F5F0FA] rounded-lg">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                              <Users className="w-4 h-4" />
                                              Equipe
                                            </div>
                                            {show.expenses_team.map((member, idx) => (
                                              <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>{member.name} ({member.instrument})</span>
                                                <span>R$ {member.cost.toFixed(2).replace('.', ',')}</span>
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
                        )}
                        
                        <Card className="p-6 bg-[#F5F0FA] border-0">
                          <div className="grid grid-cols-3 gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Receita Bruta</div>
                                <div className="text-xl font-bold text-gray-900">R$ {calculateTotals().totalRevenue.toFixed(2).replace('.', ',')}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Despesas</div>
                                <div className="text-xl font-bold text-gray-900">R$ {calculateTotals().totalExpenses.toFixed(2).replace('.', ',')}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <ArrowUpRight className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Lucro Líquido</div>
                                <div className="text-xl font-bold text-gray-900">R$ {calculateTotals().netProfit.toFixed(2).replace('.', ',')}</div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* LOCAIS E BARES TAB */}
                <TabsContent value="venues" className="mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Locais e Bares</h2>
                      <p className="text-gray-600">Gerencie os locais onde você realiza shows</p>
                    </div>
                    
                    <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetVenueForm} className="bg-primary hover:bg-primary/90 text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>
                            {editingVenue ? 'Editar Local' : 'Adicionar Local'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleVenueSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="venue_name">Nome do Local *</Label>
                            <Input
                              id="venue_name"
                              value={venueFormData.name}
                              onChange={(e) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                              placeholder="Ex: Bar do João"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="venue_address">Endereço (opcional)</Label>
                            <Input
                              id="venue_address"
                              value={venueFormData.address}
                              onChange={(e) => setVenueFormData({ ...venueFormData, address: e.target.value })}
                              placeholder="Ex: Rua das Flores, 123"
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            {editingVenue ? 'Atualizar' : 'Cadastrar'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {venues.length === 0 ? (
                    <Card className="p-8 text-center bg-white border border-gray-200">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Nenhum local cadastrado</p>
                      <p className="text-sm text-gray-400">
                        Adicione os locais onde você costuma fazer shows
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {venues.map((venue) => (
                        <Card key={venue.id} className="p-4 bg-white border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                                {venue.address && (
                                  <p className="text-sm text-gray-600">{venue.address}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleVenueEdit(venue)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleVenueDelete(venue.id)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* MÚSICOS E EQUIPE TAB */}
                <TabsContent value="musicians" className="mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Músicos e Equipe</h2>
                      <p className="text-gray-600">Gerencie seus músicos e cachês padrão</p>
                    </div>
                    
                    <Dialog open={musicianDialogOpen} onOpenChange={setMusicianDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetMusicianForm} className="bg-primary hover:bg-primary/90 text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>
                            {editingMusician ? 'Editar Músico' : 'Adicionar Músico'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleMusicianSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="musician_name">Nome *</Label>
                            <Input
                              id="musician_name"
                              value={musicianFormData.name}
                              onChange={(e) => setMusicianFormData({ ...musicianFormData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="musician_instrument">Instrumento *</Label>
                            <Input
                              id="musician_instrument"
                              value={musicianFormData.instrument}
                              onChange={(e) => setMusicianFormData({ ...musicianFormData, instrument: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="musician_fee">Cachê Padrão (R$) *</Label>
                            <Input
                              id="musician_fee"
                              type="number"
                              step="0.01"
                              value={musicianFormData.default_fee}
                              onChange={(e) => setMusicianFormData({ ...musicianFormData, default_fee: e.target.value })}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            {editingMusician ? 'Atualizar' : 'Cadastrar'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {musicians.length === 0 ? (
                    <Card className="p-8 text-center bg-white border border-gray-200">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Nenhum músico cadastrado</p>
                      <p className="text-sm text-gray-400">
                        Adicione músicos da sua equipe para facilitar o cadastro de shows
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {musicians.map((musician) => (
                        <Card key={musician.id} className="p-4 bg-white border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Music2 className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{musician.name}</h3>
                                <p className="text-sm text-gray-600">{musician.instrument}</p>
                                <p className="text-sm font-medium text-green-600">
                                  Cachê padrão: R$ {musician.default_fee.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleMusicianEdit(musician)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleMusicianDelete(musician.id)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
        
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistShows;
