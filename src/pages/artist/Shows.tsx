import { useState, useEffect, useRef } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Bell, Plus, Calendar as CalendarIcon, Clock, MapPin, DollarSign, Edit, Trash2, Music2, Users, List, Grid3x3, ChevronDown, ChevronUp, MoreVertical, TrendingDown, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { brazilStates, citiesByState, instruments } from '@/data/brazilLocations';
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
  type: string;
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
  const {
    user,
    userData,
    userRole
  } = useAuth();
  const isMobile = useIsMobile();
  const [shows, setShows] = useState<Show[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showFilter, setShowFilter] = useState<string>('upcoming');
  
  // Check if selected date is in the past
  const isDateInPast = () => {
    if (!showFormData.date_local) return false;
    const selectedDate = new Date(showFormData.date_local + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  // Shows dialog
  const [showDialogOpen, setShowDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showFormData, setShowFormData] = useState({
    venue_id: '',
    custom_venue: '',
    date_local: '',
    time_local: '20:00',
    fee: '',
    is_private_event: false
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);

  // Musicians dialog
  const [musicianDialogOpen, setMusicianDialogOpen] = useState(false);
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [musicianFormData, setMusicianFormData] = useState({
    name: '',
    instrument: '',
    customInstrument: '',
    default_fee: ''
  });

  // Venues dialog
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    state: '',
    city: '',
    customCity: ''
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);
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
      const {
        data,
        error
      } = await supabase.from('shows').select('*').eq('uid', user.id).order('date_local', {
        ascending: true
      });
      if (error) throw error;
      const typedShows = (data || []).map(show => ({
        ...show,
        expenses_team: show.expenses_team as any || [],
        expenses_other: show.expenses_other as any || []
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
      const {
        data,
        error
      } = await supabase.from('musicians').select('*').eq('owner_uid', user.id).order('name', {
        ascending: true
      });
      if (error) throw error;
      setMusicians(data || []);
    } catch (error: any) {
      console.error('Error fetching musicians:', error);
    }
  };
  const fetchVenues = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('venues').select('*').eq('owner_uid', user.id).order('name', {
        ascending: true
      });
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
      const venueName = showFormData.is_private_event ? showFormData.custom_venue : venues.find(v => v.id === showFormData.venue_id)?.name || showFormData.custom_venue;
      if (!venueName) {
        toast.error('Selecione ou digite o nome do local');
        return;
      }
      const teamMusicianIds = teamMembers.filter(m => m.musicianId).map(m => m.musicianId!);
      const showData = {
        venue_name: venueName,
        date_local: showFormData.date_local,
        time_local: showFormData.time_local,
        fee: parseFloat(showFormData.fee),
        is_private_event: showFormData.is_private_event,
        expenses_team: teamMembers,
        expenses_other: additionalExpenses,
        team_musician_ids: teamMusicianIds,
        uid: user.id
      };
      if (editingShow) {
        const {
          error
        } = await supabase.from('shows').update({
          ...showData,
          expenses_team: showData.expenses_team as any,
          expenses_other: showData.expenses_other as any,
          updated_at: new Date().toISOString()
        }).eq('id', editingShow.id);
        if (error) throw error;
        toast.success('Show atualizado com sucesso!');
      } else {
        const {
          error
        } = await supabase.from('shows').insert({
          ...showData,
          expenses_team: showData.expenses_team as any,
          expenses_other: showData.expenses_other as any
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
      const {
        error
      } = await supabase.from('shows').delete().eq('id', id);
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
      time_local: show.time_local || '20:00',
      fee: show.fee.toString(),
      is_private_event: show.is_private_event
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
      time_local: '20:00',
      fee: '',
      is_private_event: false
    });
    setTeamMembers([]);
    setAdditionalExpenses([]);
    setEditingShow(null);
  };

  // Musician handlers
  const handleMusicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const finalInstrument = musicianFormData.instrument === 'Outro...' ? musicianFormData.customInstrument : musicianFormData.instrument;
    try {
      const musicianData = {
        name: musicianFormData.name,
        instrument: finalInstrument,
        default_fee: parseFloat(musicianFormData.default_fee),
        owner_uid: user.id
      };
      if (editingMusician) {
        const {
          error
        } = await supabase.from('musicians').update(musicianData).eq('id', editingMusician.id);
        if (error) throw error;
        toast.success('Músico atualizado com sucesso!');
      } else {
        const {
          error
        } = await supabase.from('musicians').insert(musicianData);
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

    // Check if instrument is in the list
    const isCustomInstrument = !instruments.includes(musician.instrument);
    setMusicianFormData({
      name: musician.name,
      instrument: isCustomInstrument ? 'Outro...' : musician.instrument,
      customInstrument: isCustomInstrument ? musician.instrument : '',
      default_fee: musician.default_fee.toString()
    });
    setMusicianDialogOpen(true);
  };
  const handleMusicianDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este músico?')) return;
    try {
      const {
        error
      } = await supabase.from('musicians').delete().eq('id', id);
      if (error) throw error;
      toast.success('Músico excluído com sucesso!');
      fetchMusicians();
    } catch (error: any) {
      toast.error('Erro ao excluir músico');
      console.error(error);
    }
  };
  const resetMusicianForm = () => {
    setMusicianFormData({
      name: '',
      instrument: '',
      customInstrument: '',
      default_fee: ''
    });
    setEditingMusician(null);
  };

  // Venue handlers
  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const finalCity = venueFormData.city === 'Outro (digitar)' ? venueFormData.customCity : venueFormData.city;
    const stateLabel = brazilStates.find(s => s.value === venueFormData.state)?.value || '';
    const address = finalCity && stateLabel ? `${finalCity}, ${stateLabel}` : null;
    try {
      const venueData = {
        name: venueFormData.name,
        address: address,
        owner_uid: user.id
      };
      if (editingVenue) {
        const {
          error
        } = await supabase.from('venues').update(venueData).eq('id', editingVenue.id);
        if (error) throw error;
        toast.success('Local atualizado com sucesso!');
      } else {
        const {
          error
        } = await supabase.from('venues').insert(venueData);
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

    // Parse address to extract city and state
    let city = '';
    let state = '';
    let customCity = '';
    if (venue.address) {
      const parts = venue.address.split(', ');
      if (parts.length === 2) {
        city = parts[0];
        state = parts[1];

        // Check if city is in the state's list
        const stateData = brazilStates.find(s => s.value === state);
        if (stateData) {
          const cities = citiesByState[state] || [];
          if (!cities.includes(city)) {
            customCity = city;
            city = 'Outro (digitar)';
          }
        }
      }
    }
    setVenueFormData({
      name: venue.name,
      state: state,
      city: city,
      customCity: customCity
    });
    if (state) {
      setAvailableCities(citiesByState[state] || []);
    }
    setVenueDialogOpen(true);
  };
  const handleVenueDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;
    try {
      const {
        error
      } = await supabase.from('venues').delete().eq('id', id);
      if (error) throw error;
      toast.success('Local excluído com sucesso!');
      fetchVenues();
    } catch (error: any) {
      toast.error('Erro ao excluir local');
      console.error(error);
    }
  };
  const resetVenueForm = () => {
    setVenueFormData({
      name: '',
      state: '',
      city: '',
      customCity: ''
    });
    setAvailableCities([]);
    setEditingVenue(null);
  };
  const handleStateChange = (value: string) => {
    setVenueFormData({
      ...venueFormData,
      state: value,
      city: '',
      customCity: ''
    });
    setAvailableCities(citiesByState[value] || []);
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
        cost: firstMusician.default_fee
      }]);
    } else {
      // Se não houver músicos, adiciona um membro vazio
      setTeamMembers([...teamMembers, {
        name: '',
        instrument: '',
        cost: 0
      }]);
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
          cost: musician.default_fee
        };
      }
    } else if (field === 'musicianId' && !value) {
      // Se selecionar freelancer, limpa mas mantém o custo
      updated[index] = {
        name: '',
        instrument: '',
        cost: updated[index].cost || 0
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    setTeamMembers(updated);
  };
  const expensesSectionRef = useRef<HTMLDivElement>(null);
  const addExpense = () => {
    setAdditionalExpenses([...additionalExpenses, {
      type: '',
      description: '',
      cost: 0
    }]);

    // Auto-scroll para a seção de despesas
    setTimeout(() => {
      expensesSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 100);
  };
  const addAdditionalExpense = addExpense;
  const removeExpense = (index: number) => {
    setAdditionalExpenses(additionalExpenses.filter((_, i) => i !== index));
  };
  const removeAdditionalExpense = removeExpense;
  const updateExpense = (index: number, field: keyof AdditionalExpense, value: any) => {
    const updated = [...additionalExpenses];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setAdditionalExpenses(updated);
  };
  const updateAdditionalExpense = updateExpense;
  const toggleShowExpanded = (showId: string) => {
    const newExpanded = new Set(expandedShows);
    if (newExpanded.has(showId)) {
      newExpanded.delete(showId);
    } else {
      newExpanded.add(showId);
    }
    setExpandedShows(newExpanded);
  };
  const getFilteredShows = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (showFilter) {
      case 'upcoming':
        // Apenas shows com data >= hoje
        return shows.filter(show => {
          const [year, month, day] = show.date_local.split('-').map(Number);
          return new Date(year, month - 1, day) >= today;
        });
      case 'thisWeek':
        // Shows desta semana
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        return shows.filter(show => {
          const [year, month, day] = show.date_local.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          return d >= today && d <= endOfWeek;
        });
      case 'lastWeek':
        // Shows da semana passada
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return shows.filter(show => {
          const [year, month, day] = show.date_local.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          return d >= lastWeekStart && d <= lastWeekEnd;
        });
      case 'twoWeeksAgo':
        // Shows de 2 semanas atrás
        const twoWeeksAgoStart = new Date(today);
        twoWeeksAgoStart.setDate(today.getDate() - today.getDay() - 14);
        const twoWeeksAgoEnd = new Date(twoWeeksAgoStart);
        twoWeeksAgoEnd.setDate(twoWeeksAgoStart.getDate() + 6);
        return shows.filter(show => {
          const [year, month, day] = show.date_local.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          return d >= twoWeeksAgoStart && d <= twoWeeksAgoEnd;
        });
      case 'thisMonth':
        // Shows deste mês
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return shows.filter(show => {
          const [year, month, day] = show.date_local.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          return d >= startOfMonth && d <= endOfMonth;
        });
      case 'all':
      default:
        return shows;
    }
  };
  const filteredShows = getFilteredShows();
  const calculateTotals = () => {
    const totalRevenue = filteredShows.reduce((sum, show) => sum + show.fee, 0);
    const totalExpenses = filteredShows.reduce((sum, show) => {
      const teamCosts = show.expenses_team.reduce((teamSum, member) => teamSum + member.cost, 0);
      const otherCosts = show.expenses_other.reduce((otherSum, expense) => otherSum + expense.cost, 0);
      return sum + teamCosts + otherCosts;
    }, 0);
    const netProfit = totalRevenue - totalExpenses;
    return {
      totalRevenue,
      totalExpenses,
      netProfit
    };
  };
  const calculateShowExpenses = (show: Show) => {
    const teamCosts = show.expenses_team.reduce((sum, member) => sum + member.cost, 0);
    const otherCosts = show.expenses_other.reduce((sum, expense) => sum + expense.cost, 0);
    return teamCosts + otherCosts;
  };
  const calculateShowProfit = (show: Show) => {
    return show.fee - calculateShowExpenses(show);
  };
  return <SidebarProvider>
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
                <Bell className="w-5 h-5 text-gray-900" />
              </Button>
              <UserMenu userName={userData?.name} userRole={userRole} />
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
                      
                      <Select value={showFilter} onValueChange={setShowFilter}>
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

                      {/* Mobile/Desktop Modal - Only one renders based on screen size */}
                      {isMobile ? <Sheet open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                          <SheetTrigger asChild>
                            <Button onClick={resetShowForm} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                              <Plus className="w-5 h-5 mr-2" />
                              Adicionar
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto bg-white p-0 scrollbar-hide" style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                      }}>
                          <div className="p-6 pb-8">
                            <SheetHeader className="mb-4">
                              <SheetTitle className="text-gray-900 text-left">
                                {editingShow ? 'Editar Show' : 'Adicionar Novo Show'}
                              </SheetTitle>
                              <p className="text-sm text-gray-600 text-left">
                                Preencha as informações abaixo para gerenciar o show.
                              </p>
                            </SheetHeader>
                            <form onSubmit={handleShowSubmit} className="space-y-4">
                              <div className="space-y-3">
                                <Button type="button" variant={showFormData.is_private_event ? "default" : "outline"} onClick={() => setShowFormData({
                                ...showFormData,
                                is_private_event: !showFormData.is_private_event
                              })} className={showFormData.is_private_event ? "bg-primary hover:bg-primary/90 text-white w-full" : "bg-white hover:bg-gray-50 text-gray-900 w-full"}>
                                  Evento Particular
                                </Button>

                                {showFormData.is_private_event ? <div>
                                    <Label htmlFor="custom_venue" className="text-gray-900 text-sm font-medium">Nome do local</Label>
                                    <Input id="custom_venue" value={showFormData.custom_venue} onChange={e => setShowFormData({
                                  ...showFormData,
                                  custom_venue: e.target.value
                                })} placeholder="Ex: Casamento Ana e Pedro" className="bg-white text-gray-900 mt-1.5 h-10" required />
                                  </div> : <div>
                                    <Label htmlFor="venue_id" className="text-gray-900 text-sm font-medium">Nome do local</Label>
                                    <Select value={showFormData.venue_id} onValueChange={value => setShowFormData({
                                  ...showFormData,
                                  venue_id: value
                                })}>
                                      <SelectTrigger className="bg-white text-gray-900 mt-1.5 h-10">
                                        <SelectValue placeholder="Selecione um local" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white z-[100]">
                                        {venues.length === 0 ? <div className="p-3 text-center">
                                            <p className="text-sm text-gray-500 break-words">Nenhum local cadastrado</p>
                                            <p className="text-xs text-gray-400 mt-1">Adicione em Locais</p>
                                          </div> : <>
                                            {venues.map(venue => <SelectItem key={venue.id} value={venue.id}>
                                                {venue.name}
                                              </SelectItem>)}
                                            <SelectItem value="custom">Outro local...</SelectItem>
                                          </>}
                                      </SelectContent>
                                    </Select>
                                    {showFormData.venue_id === 'custom' && <Input className="mt-2 bg-white text-gray-900 h-10" value={showFormData.custom_venue} onChange={e => setShowFormData({
                                  ...showFormData,
                                  custom_venue: e.target.value
                                })} placeholder="Digite o nome do local" required />}
                                  </div>}

                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor="date_local_mobile" className="text-gray-900 text-sm font-medium">Data do show</Label>
                                    <Input id="date_local_mobile" type="date" value={showFormData.date_local} onChange={e => setShowFormData({
                                    ...showFormData,
                                    date_local: e.target.value
                                  })} className="bg-white text-gray-900 mt-1.5" required />
                                    
                                    {isDateInPast() && (
                                      <Alert className="mt-2 border-orange-200 bg-orange-50">
                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                        <AlertDescription className="text-orange-800 text-sm">
                                          A data selecionada está no passado. Isso é apenas um lembrete.
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="time_local_mobile" className="text-gray-900 text-sm font-medium">Horário</Label>
                                    <Input id="time_local_mobile" type="time" value={showFormData.time_local} onChange={e => setShowFormData({
                                    ...showFormData,
                                    time_local: e.target.value
                                  })} className="bg-white text-gray-900 mt-1.5" required />
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="duration_mobile" className="text-gray-900 text-sm font-medium">Duração de show</Label>
                                  <Select defaultValue="4h">
                                    <SelectTrigger className="bg-white text-gray-900 mt-1.5 h-10">
                                      <SelectValue placeholder="Horas..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white z-[100]">
                                      <SelectItem value="1h">1 hora</SelectItem>
                                      <SelectItem value="2h">2 horas</SelectItem>
                                      <SelectItem value="3h">3 horas</SelectItem>
                                      <SelectItem value="4h">4 horas</SelectItem>
                                      <SelectItem value="5h">5 horas</SelectItem>
                                      <SelectItem value="6h">6 horas</SelectItem>
                                      <SelectItem value="7h">7 horas</SelectItem>
                                      <SelectItem value="8h">8 horas</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="fee_mobile" className="text-gray-900 text-sm font-medium">Cachê</Label>
                                  <CurrencyInput id="fee_mobile" value={showFormData.fee} onChange={value => setShowFormData({
                                  ...showFormData,
                                  fee: value
                                })} className="bg-white text-gray-900 placeholder:text-gray-500 mt-1.5 h-10" required />
                                </div>
                              </div>

                              <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">Equipe/Músicos</h3>
                                    <p className="text-xs text-gray-600">Custo total: R$ {teamMembers.reduce((sum, m) => sum + m.cost, 0).toFixed(2)}</p>
                                  </div>
                                  <Button type="button" variant="outline" size="sm" onClick={addTeamMember} className="bg-white hover:bg-gray-50 text-gray-900">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Adicionar
                                  </Button>
                                </div>

                                {teamMembers.map((member, index) => <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-gray-900 text-xs">Membro</Label>
                                      <Button type="button" variant="ghost" size="sm" onClick={() => removeTeamMember(index)} className="text-destructive hover:text-destructive h-7 w-7 p-0">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <Select value={member.musicianId || ''} onValueChange={value => {
                                    if (value === 'freelancer') {
                                      updateTeamMember(index, 'musicianId', undefined);
                                    } else {
                                      updateTeamMember(index, 'musicianId', value);
                                    }
                                  }}>
                                        <SelectTrigger className="bg-white text-gray-900 text-sm h-9">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white z-[200]">
                                          {musicians.length === 0 ? <div className="p-3 text-center">
                                              <p className="text-sm text-gray-500 break-words">Nenhum músico cadastrado</p>
                                              <p className="text-xs text-gray-400 mt-1">Adicione em Músicos</p>
                                            </div> : <>
                                              {musicians.map(m => <SelectItem key={m.id} value={m.id} className="text-sm">
                                                  {m.name}
                                                </SelectItem>)}
                                              <SelectItem value="freelancer" className="text-sm">Freelancer</SelectItem>
                                            </>}
                                        </SelectContent>
                                      </Select>

                                      <CurrencyInput value={member.cost || 0} onChange={value => updateTeamMember(index, 'cost', parseFloat(value) || 0)} className="bg-white text-gray-900 placeholder:text-gray-500 text-sm h-9" required />
                                    </div>
                                  </div>)}
                              </div>

                              <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">Despesas Adicionais</h3>
                                    <p className="text-xs text-gray-600">Custo total: R$ {additionalExpenses.reduce((sum, e) => sum + e.cost, 0).toFixed(2)}</p>
                                  </div>
                                  <Button type="button" variant="outline" size="sm" onClick={addExpense} className="bg-white hover:bg-gray-50 text-gray-900">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Adicionar
                                  </Button>
                                </div>

                                {additionalExpenses.map((expense, index) => <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-gray-900 text-xs">Despesa</Label>
                                      <Button type="button" variant="ghost" size="sm" onClick={() => removeExpense(index)} className="text-destructive hover:text-destructive h-7 w-7 p-0">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>

                                    <div className="space-y-2">
                                      <Select value={expense.type} onValueChange={value => updateExpense(index, 'type', value)}>
                                        <SelectTrigger className="bg-white text-gray-900 text-sm h-9">
                                          <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white z-[200]">
                                          <SelectItem value="transporte" className="text-sm">Transporte</SelectItem>
                                          <SelectItem value="alimentacao" className="text-sm">Alimentação</SelectItem>
                                          <SelectItem value="hospedagem" className="text-sm">Hospedagem</SelectItem>
                                          <SelectItem value="equipamento" className="text-sm">Equipamento</SelectItem>
                                          <SelectItem value="outro" className="text-sm">Outro</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      
                                      {expense.type === 'outro' && (
                                        <Input 
                                          placeholder="Digite o tipo" 
                                          value={expense.description} 
                                          onChange={e => updateExpense(index, 'description', e.target.value)} 
                                          className="bg-white text-gray-900 placeholder:text-gray-500 text-sm h-9" 
                                          required 
                                        />
                                      )}
                                      
                                      {expense.type !== 'outro' && (
                                        <Input 
                                          placeholder="Descrição" 
                                          value={expense.description} 
                                          onChange={e => updateExpense(index, 'description', e.target.value)} 
                                          className="bg-white text-gray-900 placeholder:text-gray-500 text-sm h-9" 
                                          required 
                                        />
                                      )}
                                      
                                      <CurrencyInput value={expense.cost || 0} onChange={value => updateExpense(index, 'cost', parseFloat(value) || 0)} className="bg-white text-gray-900 placeholder:text-gray-500 text-sm h-9" required />
                                    </div>
                                  </div>)}
                              </div>

                              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                                <Button type="button" variant="outline" onClick={() => setShowDialogOpen(false)} className="flex-1 bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                                  Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                                  Salvar Show
                                </Button>
                              </div>
                            </form>
                          </div>
                        </SheetContent>
                      </Sheet> : <Button onClick={() => {
                      resetShowForm();
                      setShowDialogOpen(true);
                    }} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                          <Plus className="w-5 h-5 mr-2" />
                          Adicionar
                        </Button>}
                    </Card>

                    {/* Desktop header */}
                    <div className="hidden md:flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Agenda de Shows</h2>
                        <p className="text-sm text-gray-500">
                          Atualizado em {format(lastUpdated, "dd/MM/yyyy 'às' HH:mm:ss")}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-[#EAD6F5] text-gray-900 hover:bg-[#EAD6F5]' : 'bg-white text-gray-900'}>
                          <List className="w-4 h-4" />
                        </Button>
                        <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-[#EAD6F5] text-gray-900 hover:bg-[#EAD6F5]' : 'bg-white text-gray-900'}>
                          <Grid3x3 className="w-4 h-4" />
                        </Button>
                        <Select value={showFilter} onValueChange={setShowFilter}>
                          <SelectTrigger className="w-[180px] bg-white text-gray-900">
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
                        {isMobile ? <Button onClick={() => {
                        resetShowForm();
                        setShowDialogOpen(true);
                      }} className="bg-primary hover:bg-primary/90 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                          </Button> : <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                            <DialogTrigger asChild>
                              <Button onClick={resetShowForm} className="bg-primary hover:bg-primary/90 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white">
                              <DialogHeader>
                                <DialogTitle className="text-gray-900">
                                  {editingShow ? 'Editar Show' : 'Adicionar Novo Show'}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground">
                                  Preencha as informações abaixo para gerenciar o show.
                                </p>
                              </DialogHeader>
                              
                              <form onSubmit={handleShowSubmit} className="space-y-4">
                                <div className="max-h-[70vh] overflow-y-auto scrollbar-hide px-1" style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none',
                              WebkitOverflowScrolling: 'touch'
                            }}>
                                  <div className="space-y-6">
                                    <div className="space-y-4">
                                      <Button type="button" variant={showFormData.is_private_event ? "default" : "outline"} onClick={() => setShowFormData({
                                    ...showFormData,
                                    is_private_event: !showFormData.is_private_event
                                  })} className={showFormData.is_private_event ? "bg-primary hover:bg-primary/90 text-white" : "bg-white hover:bg-gray-50 text-gray-900"}>
                                        Evento Particular
                                      </Button>

                                      {showFormData.is_private_event ? <div>
                                          <Label htmlFor="custom_venue" className="text-gray-900">Nome do local</Label>
                                          <Input id="custom_venue" value={showFormData.custom_venue} onChange={e => setShowFormData({
                                      ...showFormData,
                                      custom_venue: e.target.value
                                    })} placeholder="Ex: Casamento Ana e Pedro" className="bg-white text-gray-900" required />
                                        </div> : <div>
                                          <Label htmlFor="venue_id" className="text-gray-900">Nome do local</Label>
                                          <Select value={showFormData.venue_id} onValueChange={value => setShowFormData({
                                      ...showFormData,
                                      venue_id: value
                                    })}>
                                            <SelectTrigger className="bg-white text-gray-900">
                                              <SelectValue placeholder="Selecione um local" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                              {venues.length === 0 ? <div className="p-3 text-center">
                                                  <p className="text-sm text-gray-500 break-words">Nenhum local cadastrado</p>
                                                  <p className="text-xs text-gray-400 mt-1">Adicione em Locais</p>
                                                </div> : <>
                                                  {venues.map(venue => <SelectItem key={venue.id} value={venue.id}>
                                                      {venue.name}
                                                    </SelectItem>)}
                                                  <SelectItem value="custom">Outro local...</SelectItem>
                                                </>}
                                            </SelectContent>
                                          </Select>
                                          {showFormData.venue_id === 'custom' && <Input className="mt-2 bg-white text-gray-900" value={showFormData.custom_venue} onChange={e => setShowFormData({
                                      ...showFormData,
                                      custom_venue: e.target.value
                                    })} placeholder="Digite o nome do local" required />}
                                        </div>}

                                      <div className="space-y-4">
                                        <div className="col-span-3">
                                          <Label htmlFor="date_local" className="text-gray-900">Data do show</Label>
                                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                            <PopoverTrigger asChild>
                                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white text-gray-900", !showFormData.date_local && "text-gray-500")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {showFormData.date_local ? (() => {
                                              const [year, month, day] = showFormData.date_local.split('-').map(Number);
                                              return format(new Date(year, month - 1, day), "dd/MM/yyyy", {
                                                locale: ptBR
                                              });
                                            })() : "Selecione a data"}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
                                              <Calendar 
                                                mode="single" 
                                                variant="light"
                                                selected={showFormData.date_local ? (() => {
                                            const [year, month, day] = showFormData.date_local.split('-').map(Number);
                                            return new Date(year, month - 1, day);
                                          })() : undefined} onSelect={date => {
                                            if (date) {
                                              const year = date.getFullYear();
                                              const month = String(date.getMonth() + 1).padStart(2, '0');
                                              const day = String(date.getDate()).padStart(2, '0');
                                              setShowFormData({
                                                ...showFormData,
                                                date_local: `${year}-${month}-${day}`
                                              });
                                              setCalendarOpen(false);
                                            }
                                          }} initialFocus className="pointer-events-auto" />
                                            </PopoverContent>
                                          </Popover>
                                          
                                          {isDateInPast() && (
                                            <Alert className="mt-2 border-orange-200 bg-orange-50">
                                              <AlertCircle className="h-4 w-4 text-orange-600" />
                                              <AlertDescription className="text-orange-800 text-sm">
                                                A data selecionada está no passado. Isso é apenas um lembrete.
                                              </AlertDescription>
                                            </Alert>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="time_local" className="text-gray-900">Horário</Label>
                                          <TimePicker value={showFormData.time_local} onChange={time => setShowFormData({
                                        ...showFormData,
                                        time_local: time
                                      })} />
                                        </div>
                                        <div>
                                          <Label htmlFor="duration" className="text-gray-900">Duração de show</Label>
                                          <Select defaultValue="4h">
                                            <SelectTrigger className="bg-white text-gray-900">
                                              <SelectValue placeholder="Horas..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                              <SelectItem value="1h" className="text-gray-900">1 hora</SelectItem>
                                              <SelectItem value="1.5h" className="text-gray-900">1 hora e meia</SelectItem>
                                              <SelectItem value="2h" className="text-gray-900">2 horas</SelectItem>
                                              <SelectItem value="2.5h" className="text-gray-900">2 horas e meia</SelectItem>
                                              <SelectItem value="3h" className="text-gray-900">3 horas</SelectItem>
                                              <SelectItem value="3.5h" className="text-gray-900">3 horas e meia</SelectItem>
                                              <SelectItem value="4h" className="text-gray-900">4 horas</SelectItem>
                                              <SelectItem value="4.5h" className="text-gray-900">4 horas e meia</SelectItem>
                                              <SelectItem value="5h" className="text-gray-900">5 horas</SelectItem>
                                              <SelectItem value="5.5h" className="text-gray-900">5 horas e meia</SelectItem>
                                              <SelectItem value="6h" className="text-gray-900">6 horas</SelectItem>
                                              <SelectItem value="6.5h" className="text-gray-900">6 horas e meia</SelectItem>
                                              <SelectItem value="7h" className="text-gray-900">7 horas</SelectItem>
                                              <SelectItem value="7.5h" className="text-gray-900">7 horas e meia</SelectItem>
                                              <SelectItem value="8h" className="text-gray-900">8 horas</SelectItem>
                                              <SelectItem value="8.5h" className="text-gray-900">8 horas e meia</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <div>
                                        <Label htmlFor="fee" className="text-gray-900">Cachê (R$)</Label>
                                        <CurrencyInput id="fee" value={showFormData.fee} onChange={value => setShowFormData({
                                      ...showFormData,
                                      fee: value
                                    })} placeholder="0,00" className="bg-white text-gray-900 placeholder:text-gray-500" required />
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

                                      {teamMembers.map((member, index) => <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-gray-900">Membro</Label>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeTeamMember(index)} className="text-destructive hover:text-destructive">
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                            <Select value={member.musicianId || ''} onValueChange={value => {
                                        if (value === 'freelancer') {
                                          updateTeamMember(index, 'musicianId', undefined);
                                        } else {
                                          updateTeamMember(index, 'musicianId', value);
                                        }
                                      }}>
                                              <SelectTrigger className="bg-white text-gray-900">
                                                <SelectValue placeholder="Selecione um músico" />
                                              </SelectTrigger>
                                              <SelectContent className="bg-white">
                                                {musicians.length === 0 ? <div className="p-3 text-center">
                                                    <p className="text-sm text-gray-500 break-words">Nenhum músico cadastrado</p>
                                                    <p className="text-xs text-gray-400 mt-1">Adicione em Músicos</p>
                                                  </div> : <>
                                                    {musicians.map(m => <SelectItem key={m.id} value={m.id} className="text-gray-900">
                                                        {m.name} - {m.instrument}
                                                      </SelectItem>)}
                                                    <SelectItem value="freelancer" className="text-gray-900">Freelancer</SelectItem>
                                                  </>}
                                              </SelectContent>
                                            </Select>

                                            <CurrencyInput placeholder="Custo (R$)" value={member.cost || 0} onChange={value => updateTeamMember(index, 'cost', parseFloat(value) || 0)} className="bg-white text-gray-900 placeholder:text-gray-500" required />
                                          </div>
                                        </div>)}
                                    </div>

                                    <div className="space-y-4" ref={expensesSectionRef}>
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h3 className="font-semibold text-gray-900">Despesas Adicionais</h3>
                                          <p className="text-xs text-gray-900">Custo total: R$ {additionalExpenses.reduce((sum, e) => sum + e.cost, 0).toFixed(2)}</p>
                                        </div>
                                        <Button type="button" variant="outline" onClick={addAdditionalExpense} className="bg-white hover:bg-gray-50 text-gray-900">
                                          <Plus className="w-4 h-4 mr-2" />
                                          Adicionar
                                        </Button>
                                      </div>

                                      {additionalExpenses.map((expense, index) => <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-gray-900">Despesa</Label>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeAdditionalExpense(index)} className="text-destructive hover:text-destructive">
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>

                                          <div className="space-y-3">
                                            <Select value={expense.type} onValueChange={value => updateAdditionalExpense(index, 'type', value)}>
                                              <SelectTrigger className="bg-white text-gray-900">
                                                <SelectValue placeholder="Tipo" />
                                              </SelectTrigger>
                                              <SelectContent className="bg-white">
                                                <SelectItem value="transporte" className="text-gray-900">Transporte</SelectItem>
                                                <SelectItem value="alimentacao" className="text-gray-900">Alimentação</SelectItem>
                                                <SelectItem value="hospedagem" className="text-gray-900">Hospedagem</SelectItem>
                                                <SelectItem value="equipamento" className="text-gray-900">Equipamento</SelectItem>
                                                <SelectItem value="outro" className="text-gray-900">Outro</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            
                                            {expense.type === 'outro' && (
                                              <Input 
                                                type="text" 
                                                placeholder="Digite o tipo" 
                                                value={expense.description} 
                                                onChange={e => updateAdditionalExpense(index, 'description', e.target.value)} 
                                                className="bg-white text-gray-900 placeholder:text-gray-500" 
                                                required 
                                              />
                                            )}
                                            
                                            {expense.type !== 'outro' && (
                                              <Input 
                                                type="text" 
                                                placeholder="Descrição" 
                                                value={expense.description} 
                                                onChange={e => updateAdditionalExpense(index, 'description', e.target.value)} 
                                                className="bg-white text-gray-900 placeholder:text-gray-500" 
                                                required 
                                              />
                                            )}

                                            <CurrencyInput placeholder="Custo (R$)" value={expense.cost || 0} onChange={value => updateAdditionalExpense(index, 'cost', parseFloat(value) || 0)} className="bg-white text-gray-900 placeholder:text-gray-500" required />
                                          </div>
                                        </div>)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-3 pt-2 border-t mt-2">
                                  <Button type="button" variant="outline" onClick={() => setShowDialogOpen(false)} className="flex-1 bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                                    Cancelar
                                  </Button>
                                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                                    Salvar Show
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                        </Dialog>}
                      </div>
                    </div>

                    {loading ? <div className="text-center py-12">
                        <p className="text-gray-500">Carregando...</p>
                      </div> : filteredShows.length === 0 ? <Card className="p-8 text-center bg-white border border-gray-200">
                        <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum show encontrado para o filtro selecionado.</p>
                      </Card> : <>
                        {viewMode === 'list' && !isMobile ? <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-[1fr,120px,120px,120px,80px] gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-600">
                              <div>Data e Local</div>
                              <div className="text-center">Cachê</div>
                              <div className="text-center">Despesas</div>
                              <div className="text-center">Lucro</div>
                              <div className="text-center">Ações</div>
                            </div>
                            {filteredShows.map(show => {
                        const expenses = calculateShowExpenses(show);
                        const profit = calculateShowProfit(show);
                        const isExpanded = expandedShows.has(show.id);
                        const [year, month, day] = show.date_local.split('-').map(Number);
                        const showDate = new Date(year, month - 1, day);
                        return <div key={show.id} className="border-b last:border-b-0">
                                  <div className="grid grid-cols-[1fr,120px,120px,120px,80px] gap-4 p-4 items-center hover:bg-gray-50">
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleShowExpanded(show.id)}>
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </Button>
                                      <div>
                                        <div className="font-semibold text-gray-900">{show.venue_name}</div>
                                        <div className="text-sm text-gray-600">
                                          {(() => {
                                            const [year, month, day] = show.date_local.split('-').map(Number);
                                            const date = new Date(year, month - 1, day);
                                            const dayOfWeek = format(date, "EEEE", { locale: ptBR });
                                            const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
                                            return `${capitalizedDay}, ${format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
                                          })()}
                                          {show.time_local && ` 🕐 ${show.time_local}`}
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
                                        <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg z-50">
                                          <DropdownMenuItem onClick={() => handleShowEdit(show)} className="text-gray-900 hover:bg-purple-50 cursor-pointer">
                                            <Edit className="w-4 h-4 mr-2 text-primary" />
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleShowDelete(show.id)} className="text-red-600 hover:bg-red-50 cursor-pointer">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                  {isExpanded && show.expenses_team.length > 0 && <div className="px-4 pb-4 bg-[#F5F0FA]">
                                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                        <Users className="w-4 h-4" />
                                        Equipe
                                      </div>
                                      {show.expenses_team.map((member, idx) => <div key={idx} className="flex justify-between text-sm text-gray-600 ml-6 mb-1">
                                          <span>{member.name} ({member.instrument})</span>
                                          <span>R$ {member.cost.toFixed(2).replace('.', ',')}</span>
                                        </div>)}
                                    </div>}
                                </div>;
                      })}
                          </div> : <div className="grid gap-4 md:grid-cols-2">
                            {filteredShows.map(show => {
                        const expenses = calculateShowExpenses(show);
                        const profit = calculateShowProfit(show);
                        const isExpanded = expandedShows.has(show.id);
                        const [year, month, day] = show.date_local.split('-').map(Number);
                        const showDate = new Date(year, month - 1, day);
                        return <Card key={show.id} className="bg-white border border-gray-200 overflow-hidden">
                                  <div className="p-4 md:p-6">
                                    <div className="flex gap-3 md:gap-4">
                                      <div className="flex-shrink-0 w-16 text-center bg-[#F5F0FA] rounded-lg p-2 border-2 border-purple-200">
                                        <div className="text-xs text-primary font-bold uppercase">{format(showDate, 'MMM', {
                                    locale: ptBR
                                  })}</div>
                                        <div className="text-3xl font-bold text-gray-900">{format(showDate, 'dd')}</div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                          <div>
                                            <h3 className="text-base md:text-lg font-bold text-gray-900">{show.venue_name}</h3>
                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                              {format(showDate, "EEEE", {
                                        locale: ptBR
                                      })} • 
                                              <Clock className="w-3 h-3" />
                                              {show.time_local}
                                            </p>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4 text-stone-950" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg z-50">
                                              <DropdownMenuItem onClick={() => handleShowEdit(show)} className="text-gray-900 hover:bg-purple-50 cursor-pointer">
                                                <Edit className="w-4 h-4 mr-2 text-primary" />
                                                Editar
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleShowDelete(show.id)} className="text-red-600 hover:bg-red-50 cursor-pointer">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
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

                                    {show.expenses_team.length > 0 && <Collapsible open={isExpanded} onOpenChange={() => toggleShowExpanded(show.id)}>
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
                                            {show.expenses_team.map((member, idx) => <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span className="text-gray-500">{member.name} ({member.instrument})</span>
                                                <span className="font-medium">R$ {member.cost.toFixed(2).replace('.', ',')}</span>
                                              </div>)}
                                          </div>
                                        </CollapsibleContent>
                                      </Collapsible>}
                                  </div>
                                </Card>;
                      })}
                          </div>}
                        
                        {/* Financial summary - Mobile and Desktop */}
                        <Card className="p-4 md:p-6 bg-[#F5F0FA] border-0 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Receita Bruta</div>
                                <div className="text-lg md:text-xl font-bold text-gray-900">R$ {calculateTotals().totalRevenue.toFixed(2).replace('.', ',')}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Despesas</div>
                                <div className="text-lg md:text-xl font-bold text-gray-900">R$ {calculateTotals().totalExpenses.toFixed(2).replace('.', ',')}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <ArrowUpRight className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Lucro Líquido</div>
                                <div className="text-lg md:text-xl font-bold text-gray-900">R$ {calculateTotals().netProfit.toFixed(2).replace('.', ',')}</div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </>}
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
                      <DialogContent className="bg-white text-gray-900 max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 text-xl font-semibold">
                            {editingVenue ? 'Editar Local/Bar' : 'Adicionar Novo Local/Bar'}
                          </DialogTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Cadastre um local fixo para selecioná-lo facilmente ao agendar shows.
                          </p>
                          <p className="text-xs text-gray-500 italic mt-1">
                            (Caso for um particular, adicione pela aba "Agenda de Shows".)
                          </p>
                        </DialogHeader>
                        <form onSubmit={handleVenueSubmit} className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="venue_name" className="text-gray-900 font-medium">Nome do Local/Bar</Label>
                            <Input id="venue_name" value={venueFormData.name} onChange={e => setVenueFormData({
                            ...venueFormData,
                            name: e.target.value
                          })} placeholder="Ex: Bar do Zé" required className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="venue_state" className="text-gray-900 font-medium">Estado</Label>
                              <Select value={venueFormData.state} onValueChange={handleStateChange} required>
                                <SelectTrigger id="venue_state" className="mt-1.5 bg-white border-gray-300 text-gray-900">
                                  <SelectValue placeholder="Selecione o estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-white max-h-[200px] z-50">
                                  {brazilStates.map(state => <SelectItem key={state.value} value={state.value} className="text-gray-900">
                                      {state.label}
                                    </SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="venue_city" className="text-gray-900 font-medium">Cidade</Label>
                              <Select value={venueFormData.city} onValueChange={value => setVenueFormData({
                              ...venueFormData,
                              city: value,
                              customCity: ''
                            })} disabled={!venueFormData.state} required>
                                <SelectTrigger id="venue_city" className="mt-1.5 bg-white border-gray-300 text-gray-900">
                                  <SelectValue placeholder="Escolha um estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-white max-h-[200px] z-50">
                                  {availableCities.map(city => <SelectItem key={city} value={city} className="text-gray-900">
                                      {city}
                                    </SelectItem>)}
                                  <SelectItem value="Outro (digitar)" className="text-gray-900">Outro (digitar)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {venueFormData.city === 'Outro (digitar)' && <div>
                              <Label htmlFor="venue_custom_city" className="text-gray-900 font-medium">Qual cidade?</Label>
                              <Input id="venue_custom_city" value={venueFormData.customCity} onChange={e => setVenueFormData({
                            ...venueFormData,
                            customCity: e.target.value
                          })} placeholder="Digite o nome da cidade" required className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
                            </div>}

                          <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setVenueDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                              Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 bg-primary text-white hover:bg-primary/90">
                              Salvar Local
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {venues.length === 0 ? <Card className="p-8 text-center bg-white border border-gray-200">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Nenhum local cadastrado</p>
                      <p className="text-sm text-gray-400">
                        Adicione os locais onde você costuma fazer shows
                      </p>
                    </Card> : <div className="grid gap-4">
                      {venues.map(venue => <Card key={venue.id} className="p-4 bg-white border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                                {venue.address && <p className="text-sm text-gray-600">{venue.address}</p>}
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
                        </Card>)}
                    </div>}
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
                      <DialogContent className="bg-white text-gray-900 max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 text-xl font-semibold">
                            {editingMusician ? 'Editar Músico/Equipe' : 'Adicionar Novo Músico/Equipe'}
                          </DialogTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Cadastre músicos da sua equipe para facilitar o registro de shows.
                          </p>
                        </DialogHeader>
                        <form onSubmit={handleMusicianSubmit} className="space-y-4 mt-4">
                          {/* Quick Freelancer Button */}
                          <Button type="button" className="w-full bg-primary text-white hover:bg-primary/90" onClick={() => setMusicianFormData({
                          ...musicianFormData,
                          name: 'Freelancer',
                          instrument: 'Freelancer',
                          customInstrument: ''
                        })}>
                            <Users className="w-4 h-4 mr-2" />
                            Adicionar Freelancer Rápido
                          </Button>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-gray-500">ou preencha manualmente</span>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="musician_name" className="text-gray-900 font-medium">Nome *</Label>
                            <Input id="musician_name" value={musicianFormData.name} onChange={e => setMusicianFormData({
                            ...musicianFormData,
                            name: e.target.value
                          })} placeholder="Ex: João Silva" required disabled={musicianFormData.instrument === 'Freelancer'} className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" />
                          </div>
                          <div>
                            <Label htmlFor="musician_instrument" className="text-gray-900 font-medium">Função/Instrumento *</Label>
                            <Select value={musicianFormData.instrument} onValueChange={value => {
                            if (value === 'Freelancer') {
                              setMusicianFormData({
                                ...musicianFormData,
                                instrument: value,
                                name: 'Freelancer',
                                customInstrument: ''
                              });
                            } else {
                              setMusicianFormData({
                                ...musicianFormData,
                                instrument: value,
                                customInstrument: ''
                              });
                            }
                          }} required>
                              <SelectTrigger id="musician_instrument" className="mt-1.5 bg-white border-gray-300 text-gray-900">
                                <SelectValue placeholder="Selecione uma função" />
                              </SelectTrigger>
                              <SelectContent className="bg-white max-h-[200px] z-50">
                                {instruments.map(instrument => <SelectItem key={instrument} value={instrument} className="text-gray-900">
                                    {instrument}
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {musicianFormData.instrument === 'Outro...' && <div>
                              <Label htmlFor="custom_instrument" className="text-gray-900 font-medium">Qual função?</Label>
                              <Input id="custom_instrument" value={musicianFormData.customInstrument} onChange={e => setMusicianFormData({
                            ...musicianFormData,
                            customInstrument: e.target.value
                          })} placeholder="Digite a função/instrumento" required className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
                            </div>}
                          <div>
                            <Label htmlFor="musician_fee" className="text-gray-900 font-medium">Cachê Padrão (R$) *</Label>
                            <CurrencyInput id="musician_fee" value={musicianFormData.default_fee} onChange={value => setMusicianFormData({
                            ...musicianFormData,
                            default_fee: value
                          })} placeholder="0,00" required className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setMusicianDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                              Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 bg-primary text-white hover:bg-primary/90">
                              {editingMusician ? 'Salvar' : 'Cadastrar'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {musicians.length === 0 ? <Card className="p-8 text-center bg-white border border-gray-200">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Nenhum músico cadastrado</p>
                      <p className="text-sm text-gray-400">
                        Adicione músicos da sua equipe para facilitar o cadastro de shows
                      </p>
                    </Card> : <div className="grid gap-4">
                      {musicians.map(musician => <Card key={musician.id} className="p-4 bg-white border border-gray-200">
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
                        </Card>)}
                    </div>}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
        
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>;
};
export default ArtistShows;