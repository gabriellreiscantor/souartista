import { useState, useEffect, useRef } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Plus, Calendar, Clock, MapPin, DollarSign, Edit, Trash2, X, Music2, Mic2, ChevronDown, ChevronUp, Users, TrendingDown, ArrowUpRight, Guitar, Calendar as CalendarIcon, LayoutGrid, List } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInAppReview } from '@/hooks/useInAppReview';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
interface Artist {
  id: string;
  name: string;
  owner_uid: string;
}
interface Instrument {
  id: string;
  name: string;
  owner_uid: string;
}
interface Venue {
  id: string;
  name: string;
  address: string | null;
  owner_uid: string;
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
  expenses_team: Array<{
    musicianId?: string;
    name: string;
    instrument: string;
    cost: number;
  }>;
  expenses_other: AdditionalExpense[];
  uid: string;
}
const MusicianShows = () => {
  const isMobile = useIsMobile();
  const { requestReview } = useInAppReview();
  const {
    user,
    userData,
    userRole,
    loading: authLoading
  } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilter, setShowFilter] = useState<string>('upcoming');
  const [isSavingShow, setIsSavingShow] = useState(false);
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'show' | 'artist' | 'instrument' | 'venue' } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.warn('[MusicianShows] No user found, redirecting to login');
      toast.error('Por favor, faça login para acessar esta página');
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  // Shows dialog
  const [showDialogOpen, setShowDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showFormData, setShowFormData] = useState({
    artist_id: '',
    venue_id: '',
    custom_venue: '',
    date_local: '',
    time_local: '20:00',
    fee: '',
    instrument_id: '',
    duration: '4h',
    is_private_event: false
  });
  const [personalExpenses, setPersonalExpenses] = useState<AdditionalExpense[]>([]);

  // Artists dialog
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [artistFormData, setArtistFormData] = useState({
    name: ''
  });

  // Instruments dialog
  const [instrumentDialogOpen, setInstrumentDialogOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [instrumentFormData, setInstrumentFormData] = useState({
    name: '',
    customInstrument: ''
  });

  // Venues dialog
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    address: ''
  });
  const [connectionTest, setConnectionTest] = useState<'testing' | 'ok' | 'error'>('testing');
  useEffect(() => {
    const testConnection = async () => {
      if (!user) {
        console.log('=== AGUARDANDO AUTENTICAÇÃO ===');
        return;
      }
      try {
        console.log('=== TESTE DE CONEXÃO ===');
        console.log('User ID:', user?.id);
        console.log('User Email:', user?.email);
        console.log('User Data:', userData);
        console.log('User Role:', userRole);
        const {
          error
        } = await supabase.from('musician_venues').select('id').limit(1);
        if (error) {
          console.error('Erro no teste de conexão:', error);
          setConnectionTest('error');
          toast.error('Erro de conexão com o banco de dados');
        } else {
          console.log('Conexão OK com Supabase');
          setConnectionTest('ok');
        }
      } catch (err) {
        console.error('Erro no teste:', err);
        setConnectionTest('error');
      }
    };
    testConnection();
  }, [user, userData, userRole]);
  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);
  const fetchAll = async () => {
    await Promise.all([fetchShows(), fetchArtists(), fetchInstruments(), fetchVenues()]);
    setLastUpdated(new Date());
  };
  const fetchShows = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('shows').select('*').contains('team_musician_ids', [user.id]).order('date_local', {
        ascending: true
      });
      if (error) throw error;
      const typedShows = (data || []).map(show => ({
        ...show,
        expenses_team: show.expenses_team as any || [],
        expenses_other: show.expenses_other as any || []
      })) as Show[];
      setShows(typedShows);
    } catch (error: any) {
      console.error('Error fetching shows:', error);
      toast.error('Erro ao carregar shows');
    } finally {
      setLoading(false);
    }
  };
  const fetchArtists = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('artists').select('*').eq('owner_uid', user.id).order('name', {
        ascending: true
      });
      if (error) throw error;
      setArtists(data || []);
    } catch (error: any) {
      console.error('Error fetching artists:', error);
    }
  };
  const fetchInstruments = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('musician_instruments').select('*').eq('owner_uid', user.id).order('name', {
        ascending: true
      });
      if (error) throw error;
      setInstruments(data || []);
    } catch (error: any) {
      console.error('Error fetching instruments:', error);
    }
  };
  const fetchVenues = async () => {
    if (!user) return;
    try {
      console.log('Buscando locais para usuário:', user.id);
      const {
        data,
        error
      } = await supabase.from('musician_venues').select('*').eq('owner_uid', user.id).order('name', {
        ascending: true
      });
      if (error) {
        console.error('Erro ao buscar locais:', error);
        throw error;
      }
      console.log('Locais carregados:', data?.length || 0);
      setVenues(data || []);
    } catch (error: any) {
      console.error('Error fetching venues:', error);
      if (error?.message?.includes('Failed to fetch')) {
        // Tentar reconectar após um delay
        setTimeout(() => {
          console.log('Tentando reconectar...');
          fetchVenues();
        }, 2000);
      }
    }
  };

  // Show handlers
  const handleShowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || isSavingShow) return;
    
    // Check for internet connection
    if (!navigator.onLine) {
      toast.error('Você está offline. Conecte-se à internet para salvar.');
      return;
    }
    
    setIsSavingShow(true);
    try {
      const selectedArtist = artists.find(a => a.id === showFormData.artist_id);
      const selectedInstrument = instruments.find(i => i.id === showFormData.instrument_id);
      const venueName = showFormData.is_private_event ? showFormData.custom_venue : venues.find(v => v.id === showFormData.venue_id)?.name || showFormData.custom_venue;
      if (!selectedArtist) {
        toast.error('Selecione um artista');
        return;
      }
      if (!selectedInstrument) {
        toast.error('Selecione um instrumento');
        return;
      }
      if (!venueName) {
        toast.error('Selecione ou digite o nome do local');
        return;
      }
      const musicianEntry = {
        musicianId: user.id,
        name: userData.name,
        instrument: selectedInstrument.name,
        cost: parseFloat(showFormData.fee)
      };
      const showData = {
        venue_name: venueName,
        date_local: showFormData.date_local,
        time_local: showFormData.time_local,
        fee: parseFloat(showFormData.fee),
        is_private_event: showFormData.is_private_event,
        expenses_team: [musicianEntry],
        expenses_other: personalExpenses,
        team_musician_ids: [user.id],
        uid: selectedArtist.owner_uid
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
        
        // Request in-app review after creating a new show
        requestReview(shows.length + 1);
      }
      setShowDialogOpen(false);
      resetShowForm();
      fetchShows();
    } catch (error: any) {
      console.error('Error saving show:', error);
      toast.error('Erro ao salvar show');
    } finally {
      setIsSavingShow(false);
    }
  };
  const handleShowDelete = (id: string) => {
    setItemToDelete({ id, type: 'show' });
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'show') {
        const { error } = await supabase.from('shows').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        toast.success('Show excluído com sucesso!');
        fetchShows();
      } else if (itemToDelete.type === 'artist') {
        const { error } = await supabase.from('artists').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        toast.success('Artista excluído com sucesso!');
        fetchArtists();
      } else if (itemToDelete.type === 'instrument') {
        const { error } = await supabase.from('musician_instruments').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        toast.success('Instrumento excluído!');
        fetchInstruments();
      } else if (itemToDelete.type === 'venue') {
        const { error } = await supabase.from('musician_venues').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        toast.success('Local excluído!');
        fetchVenues();
      }
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error('Erro ao excluir');
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };
  const handleShowEdit = (show: Show) => {
    setEditingShow(show);
    const myEntry = show.expenses_team.find(e => e.musicianId === user?.id);
    const savedInstrument = myEntry?.instrument || '';

    // Find instrument by name
    const matchingInstrument = instruments.find(i => i.name === savedInstrument);

    // Find venue by name
    const matchingVenue = venues.find(v => v.name === show.venue_name);
    setShowFormData({
      artist_id: '',
      venue_id: matchingVenue?.id || '',
      custom_venue: show.venue_name,
      date_local: show.date_local,
      time_local: show.time_local || '20:00',
      fee: myEntry?.cost.toString() || show.fee.toString(),
      instrument_id: matchingInstrument?.id || '',
      duration: '4h',
      is_private_event: show.is_private_event || false
    });
    setPersonalExpenses(show.expenses_other || []);
    setShowDialogOpen(true);
  };
  const resetShowForm = () => {
    setShowFormData({
      artist_id: '',
      venue_id: '',
      custom_venue: '',
      date_local: '',
      time_local: '20:00',
      fee: '',
      instrument_id: '',
      duration: '4h',
      is_private_event: false
    });
    setPersonalExpenses([]);
    setEditingShow(null);
  };

  // Artist handlers
  const handleArtistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }
    if (!artistFormData.name || artistFormData.name.trim() === '') {
      toast.error('Nome do artista é obrigatório');
      return;
    }
    try {
      const artistData = {
        name: artistFormData.name.trim(),
        owner_uid: user.id
      };
      console.log('Salvando artista:', artistData);
      if (editingArtist) {
        const {
          error
        } = await supabase.from('artists').update(artistData).eq('id', editingArtist.id);
        if (error) {
          console.error('Erro do Supabase:', error);
          throw error;
        }
        toast.success('Artista atualizado!');
      } else {
        const {
          error
        } = await supabase.from('artists').insert(artistData);
        if (error) {
          console.error('Erro do Supabase:', error);
          throw error;
        }
        toast.success('Artista cadastrado!');
      }
      setArtistDialogOpen(false);
      resetArtistForm();
      await fetchArtists();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      if (error?.message?.includes('Failed to fetch')) {
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        toast.error(error?.message || 'Erro ao salvar artista');
      }
    }
  };
  const handleArtistEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setArtistFormData({
      name: artist.name
    });
    setArtistDialogOpen(true);
  };
  const handleArtistDelete = (id: string) => {
    setItemToDelete({ id, type: 'artist' });
    setDeleteConfirmOpen(true);
  };
  const resetArtistForm = () => {
    setArtistFormData({
      name: ''
    });
    setEditingArtist(null);
  };

  // Instrument handlers
  const handleInstrumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }
    if (!instrumentFormData.name || instrumentFormData.name.trim() === '') {
      toast.error('Nome do instrumento é obrigatório');
      return;
    }

    // Se for "Outro", usar o customInstrument
    const finalInstrumentName = instrumentFormData.name === 'Outro' ? instrumentFormData.customInstrument.trim() : instrumentFormData.name.trim();
    if (!finalInstrumentName) {
      toast.error('Por favor, especifique o nome do instrumento');
      return;
    }
    try {
      const instrumentData = {
        name: finalInstrumentName,
        owner_uid: user.id
      };
      console.log('Salvando instrumento:', instrumentData);
      if (editingInstrument) {
        const {
          error
        } = await supabase.from('musician_instruments').update(instrumentData).eq('id', editingInstrument.id);
        if (error) {
          console.error('Erro do Supabase:', error);
          throw error;
        }
        toast.success('Instrumento atualizado!');
      } else {
        const {
          error
        } = await supabase.from('musician_instruments').insert(instrumentData);
        if (error) {
          console.error('Erro do Supabase:', error);
          throw error;
        }
        toast.success('Instrumento cadastrado!');
      }
      setInstrumentDialogOpen(false);
      resetInstrumentForm();
      await fetchInstruments();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      if (error?.message?.includes('Failed to fetch')) {
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        toast.error(error?.message || 'Erro ao salvar instrumento');
      }
    }
  };
  const handleInstrumentEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setInstrumentFormData({
      name: instrument.name,
      customInstrument: ''
    });
    setInstrumentDialogOpen(true);
  };
  const handleInstrumentDelete = (id: string) => {
    setItemToDelete({ id, type: 'instrument' });
    setDeleteConfirmOpen(true);
  };
  const resetInstrumentForm = () => {
    setInstrumentFormData({
      name: '',
      customInstrument: ''
    });
    setEditingInstrument(null);
  };

  // Venue handlers
  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== INÍCIO SUBMIT ===');
    console.log('User no submit:', user);
    console.log('User ID:', user?.id);
    console.log('User Email:', user?.email);
    console.log('Form data:', venueFormData);
    if (!venueFormData.name || venueFormData.name.trim() === '') {
      console.error('Nome vazio');
      toast.error('Nome do local é obrigatório');
      return;
    }

    // Pegar o ID do usuário diretamente da sessão
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || user?.id;
    console.log('Session User ID:', session?.user?.id);
    console.log('User ID final:', userId);
    if (!userId) {
      console.error('Sem ID de usuário');
      toast.error('Erro de autenticação. Tente fazer login novamente.');
      return;
    }
    try {
      const venueData = {
        name: venueFormData.name.trim(),
        address: venueFormData.address ? venueFormData.address.trim() : null,
        owner_uid: userId
      };
      console.log('Dados a salvar:', venueData);
      console.log('Editando?', !!editingVenue);
      if (editingVenue) {
        console.log('Fazendo UPDATE...');
        const {
          data,
          error
        } = await supabase.from('musician_venues').update(venueData).eq('id', editingVenue.id).select();
        console.log('Resultado UPDATE:', {
          data,
          error
        });
        if (error) throw error;
        toast.success('Local atualizado!');
      } else {
        console.log('Fazendo INSERT...');
        const {
          data,
          error
        } = await supabase.from('musician_venues').insert(venueData).select();
        console.log('Resultado INSERT:', {
          data,
          error
        });
        if (error) throw error;
        toast.success('Local cadastrado!');
      }
      console.log('Fechando dialog...');
      setVenueDialogOpen(false);
      resetVenueForm();
      console.log('Recarregando lista...');
      await fetchVenues();
      console.log('=== FIM SUBMIT ===');
    } catch (error: any) {
      console.error('=== ERRO NO SUBMIT ===');
      console.error('Erro completo:', error);
      console.error('Message:', error?.message);
      console.error('Code:', error?.code);
      console.error('Details:', error?.details);
      toast.error(error?.message || 'Erro ao salvar local');
    }
  };
  const handleVenueEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setVenueFormData({
      name: venue.name,
      address: venue.address || ''
    });
    setVenueDialogOpen(true);
  };
  const handleVenueDelete = (id: string) => {
    setItemToDelete({ id, type: 'venue' });
    setDeleteConfirmOpen(true);
  };
  const resetVenueForm = () => {
    setVenueFormData({
      name: '',
      address: ''
    });
    setEditingVenue(null);
  };
  const expensesSectionRef = useRef<HTMLDivElement>(null);
  const addExpense = () => {
    setPersonalExpenses([...personalExpenses, {
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
  const removeExpense = (index: number) => {
    setPersonalExpenses(personalExpenses.filter((_, i) => i !== index));
  };
  const updateExpense = (index: number, field: keyof AdditionalExpense, value: any) => {
    const updated = [...personalExpenses];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setPersonalExpenses(updated);
  };
  const getMyFee = (show: Show) => {
    const myEntry = show.expenses_team.find(e => e.musicianId === user?.id);
    return myEntry?.cost || show.fee;
  };
  const getMyInstrument = (show: Show) => {
    const myEntry = show.expenses_team.find(e => e.musicianId === user?.id);
    return myEntry?.instrument || '';
  };
  const toggleShowExpanded = (showId: string) => {
    setExpandedShows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(showId)) {
        newSet.delete(showId);
      } else {
        newSet.add(showId);
      }
      return newSet;
    });
  };

  // Função de filtro por período
  const getFilteredShows = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Início desta semana (domingo)
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - today.getDay());
    
    // Fim desta semana (sábado)
    const endOfThisWeek = new Date(startOfThisWeek);
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);

    switch (showFilter) {
      case 'upcoming':
        // Shows de hoje em diante
        return shows.filter(show => {
          const [year, month, day] = show.date_local.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          return d >= today;
        });
      case 'thisWeek':
        // Shows desta semana
        return shows.filter(show => {
          const [year, month, day] = show.date_local.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          return d >= startOfThisWeek && d <= endOfThisWeek;
        });
      case 'lastWeek':
        // Shows da semana passada
        const lastWeekStart = new Date(startOfThisWeek);
        lastWeekStart.setDate(startOfThisWeek.getDate() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return shows.filter(show => {
          const [year, month, day] = show.date_local.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          return d >= lastWeekStart && d <= lastWeekEnd;
        });
      case 'twoWeeksAgo':
        // Shows de 2 semanas atrás
        const twoWeeksAgoStart = new Date(startOfThisWeek);
        twoWeeksAgoStart.setDate(startOfThisWeek.getDate() - 14);
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
    const totalRevenue = filteredShows.reduce((sum, show) => sum + getMyFee(show), 0);
    const totalExpenses = filteredShows.reduce((sum, show) => {
      const showExpenses = show.expenses_other.reduce((expSum, e) => expSum + e.cost, 0);
      return sum + showExpenses;
    }, 0);
    const netProfit = totalRevenue - totalExpenses;
    return {
      totalRevenue,
      totalExpenses,
      netProfit
    };
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <MusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Shows</h1>
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
            {connectionTest === 'error' && <Card className="mb-4 p-4 bg-red-50 border-red-200">
                <p className="text-red-800 text-sm">
                  ⚠️ Problema de conexão detectado. Tente recarregar a página ou verifique sua conexão.
                </p>
              </Card>}
            
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

                {/* SHOWS TAB */}
                <TabsContent value="shows" className="mt-0 md:mt-6">
                  {/* Mobile header */}
                  <Card className="md:hidden bg-white border border-gray-200 p-4 space-y-3 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Meus Freelas</h2>
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
                    
                    <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetShowForm} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                          <Plus className="w-5 h-5 mr-2" />
                          Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white text-gray-900">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 font-semibold">
                            {editingShow ? 'Editar Show' : 'Adicionar Show'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleShowSubmit} className="space-y-6">
...
                        </form>
                      </DialogContent>
                    </Dialog>
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

                      <Select value={showFilter} onValueChange={setShowFilter}>
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
                      
                      <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={resetShowForm} className="bg-primary hover:bg-primary/90 text-slate-50">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white text-gray-900">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 font-semibold">
                            {editingShow ? 'Editar Show' : 'Adicionar Show'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleShowSubmit} className="space-y-4">
                          <div className="max-h-[65vh] overflow-y-auto px-1 space-y-6 scrollbar-hide" style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                          }}>
                          <div className="space-y-4">
                            <Button type="button" variant={showFormData.is_private_event ? "default" : "outline"} onClick={() => setShowFormData({
                                ...showFormData,
                                is_private_event: !showFormData.is_private_event
                              })} className={showFormData.is_private_event ? "bg-primary hover:bg-primary/90 text-white w-full" : "bg-white hover:bg-gray-50 text-gray-900 border-gray-300 w-full"}>
                              Evento Particular
                            </Button>

                            <h3 className="font-semibold text-gray-900">Informações do Show</h3>
                            
                            <div>
                              <Label htmlFor="artist_id" className="text-gray-900 font-medium">Artista *</Label>
                              <Select value={showFormData.artist_id} onValueChange={value => setShowFormData({
                                  ...showFormData,
                                  artist_id: value
                                })} required>
                                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                  <SelectValue placeholder="Selecione o artista" />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-50">
                                  {artists.length === 0 ? <div className="p-3 text-center">
                                      <p className="text-sm text-gray-500 break-words">Nenhum artista cadastrado</p>
                                      <p className="text-xs text-gray-400 mt-1">Adicione em Artistas</p>
                                    </div> : artists.map(artist => <SelectItem key={artist.id} value={artist.id} className="text-gray-900">
                                      {artist.name}
                                    </SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            {showFormData.is_private_event ? <div>
                                <Label htmlFor="custom_venue" className="text-gray-900 font-medium">Nome do local *</Label>
                                <Input id="custom_venue" value={showFormData.custom_venue} onChange={e => setShowFormData({
                                  ...showFormData,
                                  custom_venue: e.target.value
                                })} className="bg-white border-gray-300 text-gray-900" placeholder="Digite o nome do local" required />
                              </div> : <div>
                                <Label htmlFor="venue_id" className="text-gray-900 font-medium">Local do Show *</Label>
                                <Select value={showFormData.venue_id} onValueChange={value => setShowFormData({
                                  ...showFormData,
                                  venue_id: value
                                })} required>
                                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                    <SelectValue placeholder="Selecione o local" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white z-50">
                                    {venues.length === 0 ? <div className="p-3 text-center">
                                        <p className="text-sm text-gray-500 break-words">Nenhum local cadastrado</p>
                                        <p className="text-xs text-gray-400 mt-1">Adicione em Locais</p>
                                      </div> : venues.map(venue => <SelectItem key={venue.id} value={venue.id} className="text-gray-900">
                                        {venue.name}
                                      </SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <Label htmlFor="date_local" className="text-gray-900 font-medium">Data *</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-900 h-10", !showFormData.date_local && "text-muted-foreground")}>
                                      <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">
                                        {showFormData.date_local ? (() => {
                                            const [year, month, day] = showFormData.date_local.split('-').map(Number);
                                            return format(new Date(year, month - 1, day), "dd/MM/yyyy", {
                                              locale: ptBR
                                            });
                                          })() : "Selecione a data"}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                   <PopoverContent className="w-auto p-0 bg-white border-gray-200 z-[100]" align="start">
                                    <CalendarComponent 
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
                                        }
                                      }} initialFocus className="pointer-events-auto" />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div>
                                <Label htmlFor="time_local" className="text-gray-900 font-medium">Horário *</Label>
                                <TimePicker value={showFormData.time_local} onChange={time => setShowFormData({
                                    ...showFormData,
                                    time_local: time
                                  })} className="w-32" />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="duration" className="text-gray-900 font-medium">Duração do Show</Label>
                              <Select value={showFormData.duration} onValueChange={value => setShowFormData({
                                  ...showFormData,
                                  duration: value
                                })}>
                                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                  <SelectValue placeholder="Horas..." className="text-gray-900" />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-[100]">
                                  <SelectItem value="1h" className="text-gray-900">1 hora</SelectItem>
                                  <SelectItem value="1h30" className="text-gray-900">1 hora e meia</SelectItem>
                                  <SelectItem value="2h" className="text-gray-900">2 horas</SelectItem>
                                  <SelectItem value="2h30" className="text-gray-900">2 horas e meia</SelectItem>
                                  <SelectItem value="3h" className="text-gray-900">3 horas</SelectItem>
                                  <SelectItem value="3h30" className="text-gray-900">3 horas e meia</SelectItem>
                                  <SelectItem value="4h" className="text-gray-900">4 horas</SelectItem>
                                  <SelectItem value="4h30" className="text-gray-900">4 horas e meia</SelectItem>
                                  <SelectItem value="5h" className="text-gray-900">5 horas</SelectItem>
                                  <SelectItem value="5h30" className="text-gray-900">5 horas e meia</SelectItem>
                                  <SelectItem value="6h" className="text-gray-900">6 horas</SelectItem>
                                  <SelectItem value="6h30" className="text-gray-900">6 horas e meia</SelectItem>
                                  <SelectItem value="7h" className="text-gray-900">7 horas</SelectItem>
                                  <SelectItem value="7h30" className="text-gray-900">7 horas e meia</SelectItem>
                                  <SelectItem value="8h" className="text-gray-900">8 horas</SelectItem>
                                  <SelectItem value="8h30" className="text-gray-900">8 horas e meia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Seu Cachê</h3>
                            
                            <div>
                              <Label htmlFor="fee" className="text-gray-900 font-medium">Seu Cachê Individual *</Label>
                              <CurrencyInput id="fee" value={showFormData.fee} onChange={value => setShowFormData({
                                  ...showFormData,
                                  fee: value
                                })} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                            </div>

                            <div>
                              <Label htmlFor="instrument_id" className="text-gray-900 font-medium">Função/Instrumento *</Label>
                              <Select value={showFormData.instrument_id} onValueChange={value => setShowFormData({
                                  ...showFormData,
                                  instrument_id: value
                                })} required>
                                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                  <SelectValue placeholder="Selecione um instrumento" />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-50">
                                  {instruments.length === 0 ? <div className="p-3 text-center">
                                      <p className="text-sm text-gray-500 break-words">Nenhum instrumento cadastrado</p>
                                      <p className="text-xs text-gray-400 mt-1">Adicione em Instrumentos</p>
                                    </div> : instruments.map(instrument => <SelectItem key={instrument.id} value={instrument.id} className="text-gray-900">
                                      {instrument.name}
                                    </SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4" ref={expensesSectionRef}>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">Despesas Pessoais</h3>
                              <Button type="button" variant="outline" size="sm" onClick={addExpense} className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Despesa
                              </Button>
                            </div>

                            {personalExpenses.map((expense, index) => <Card key={index} className="p-4 bg-white border border-gray-200">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-gray-900 font-medium">Despesa {index + 1}</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeExpense(index)} className="text-stone-950 bg-slate-50">
                                      <X className="w-4 h-4 text-zinc-950 bg-[#ad5af2]" />
                                    </Button>
                                  </div>

                                  <Input placeholder="Descrição (ex: Uber, Cordas)" value={expense.description} onChange={e => updateExpense(index, 'description', e.target.value)} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                                  <CurrencyInput value={expense.cost} onChange={value => updateExpense(index, 'cost', parseFloat(value) || 0)} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                                </div>
                              </Card>)}
                          </div>
                          </div>

                          <div className="flex gap-3 pt-2 border-t">
                            <Button type="button" variant="outline" onClick={() => setShowDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={isSavingShow} className="flex-1 text-slate-50">
                              {isSavingShow ? 'Salvando...' : (editingShow ? 'Atualizar Show' : 'Cadastrar Show')}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    </div>
                  </div>

                  {loading ? <div className="text-center py-12">
                      <p className="text-gray-500">Carregando...</p>
                    </div> : shows.length === 0 ? <Card className="p-8 text-center bg-white border border-gray-200">
                      <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum show encontrado para o filtro selecionado.</p>
                    </Card> : <>
                        {viewMode === 'list' && !isMobile ? <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-[1fr,120px,120px,120px,80px] gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-600">
                              <div>Data e Local</div>
                              <div className="text-center">Cachê</div>
                              <div className="text-center">Despesas</div>
                              <div className="text-center">Líquido</div>
                              <div className="text-center">Ações</div>
                            </div>
                            {filteredShows.map(show => {
                              const showDate = new Date(show.date_local);
                              const myFee = getMyFee(show);
                              const myInstrument = getMyInstrument(show);
                              const totalExpenses = show.expenses_other.reduce((sum, e) => sum + e.cost, 0);
                              const artist = artists.find(a => a.owner_uid === show.uid);

                              return <div key={show.id} className="grid grid-cols-[1fr,120px,120px,120px,80px] gap-4 p-4 border-b hover:bg-gray-50 items-center">
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
                    {artist && <div className="text-sm text-gray-600">{artist.name}</div>}
                    {myInstrument && <div className="text-sm text-gray-500">{myInstrument}</div>}
                  </div>
                                  <div className="text-center font-semibold text-green-600">
                                    R$ {myFee.toFixed(2).replace('.', ',')}
                                  </div>
                                  <div className="text-center font-semibold text-red-600">
                                    R$ {totalExpenses.toFixed(2).replace('.', ',')}
                                  </div>
                                  <div className="text-center">
                                    <span className="px-3 py-1 rounded-full bg-primary text-white font-bold text-sm inline-block">
                                      R$ {(myFee - totalExpenses).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 justify-center">
                                    <Button variant="outline" size="icon" onClick={() => handleShowEdit(show)} className="h-8 w-8 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleShowDelete(show.id)} className="h-8 w-8 border-red-200 bg-red-50 hover:bg-red-100">
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>;
                            })}
                          </div> : <div className="grid gap-4">
                          {filteredShows.map(show => {
                      const showDate = new Date(show.date_local);
                      const myFee = getMyFee(show);
                      const myInstrument = getMyInstrument(show);
                      const totalExpenses = show.expenses_other.reduce((sum, e) => sum + e.cost, 0);
                      const isExpanded = expandedShows.has(show.id);

                      // Encontrar o artista pelo uid do show
                      const artist = artists.find(a => a.owner_uid === show.uid);
                      return <Card key={show.id} className="bg-white border border-gray-200 overflow-hidden">
                                <div className="p-4 md:p-6">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-shrink-0 w-16 text-center bg-[#F5F0FA] rounded-lg p-2 border-2 border-purple-200">
                                      <div className="text-xs text-primary font-bold uppercase">
                                        {format(showDate, 'MMM', {
                                  locale: ptBR
                                })}
                                      </div>
                                      <div className="text-3xl font-bold text-gray-900">
                                        {format(showDate, 'dd')}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">{show.venue_name}</h3>
                                      <p className="text-sm text-gray-600 flex items-center gap-1">
                                        {format(showDate, "EEEE", {
                                  locale: ptBR
                                })} • 
                                        <Clock className="w-3 h-3" />
                                        {show.time_local}
                                      </p>
                                      {artist && <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                          <Mic2 className="w-3 h-3" />
                                          {artist.name}
                                        </p>}
                                      {myInstrument && <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                          <Guitar className="w-3 h-3" />
                                          {myInstrument}
                                        </p>}
                                    </div>
                                    
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button variant="outline" size="icon" onClick={() => handleShowEdit(show)} className="h-8 w-8 md:h-10 md:w-10 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button variant="outline" size="icon" onClick={() => handleShowDelete(show.id)} className="h-8 w-8 md:h-10 md:w-10 border-red-200 bg-red-50 hover:bg-red-100">
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex gap-3 text-sm mb-3">
                                    <div className="flex-1 text-center">
                                      <div className="text-gray-600 text-xs mb-1">Cachê</div>
                                      <div className="text-green-600 font-bold text-sm md:text-base">
                                        R$ {myFee.toFixed(2).replace('.', ',')}
                                      </div>
                                    </div>
                                    <div className="flex-1 text-center">
                                      <div className="text-gray-600 text-xs mb-1">Despesas</div>
                                      <div className="text-red-600 font-bold text-sm md:text-base">
                                        R$ {totalExpenses.toFixed(2).replace('.', ',')}
                                      </div>
                                    </div>
                                    <div className="flex-1 text-center">
                                      <div className="text-gray-600 text-xs mb-1">Líquido</div>
                                      <div className="px-2 py-1 rounded-full bg-primary text-white font-bold text-xs md:text-sm inline-block">
                                        R$ {(myFee - totalExpenses).toFixed(2).replace('.', ',')}
                                      </div>
                                    </div>
                                  </div>

                                  <Collapsible open={isExpanded} onOpenChange={() => toggleShowExpanded(show.id)}>
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" className="w-full bg-[#F5F0FA] hover:bg-[#EAD6F5] text-primary font-semibold">
                                        Detalhes das Despesas
                                        {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-4">
                                      <div className="p-3 md:p-4 bg-[#F5F0FA] rounded-lg">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                          <DollarSign className="w-4 h-4" />
                                          Despesas Pessoais
                                        </div>
                                        {show.expenses_other.length > 0 ? show.expenses_other.map((expense, idx) => <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                              <span className="text-gray-500">{expense.description}</span>
                                              <span className="font-medium">R$ {expense.cost.toFixed(2).replace('.', ',')}</span>
                                            </div>) : <div className="text-sm text-gray-500 text-center py-2">
                                            Nenhuma despesa cadastrada
                                          </div>}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </div>
                              </Card>;
                    })}
                          </div>}
                        
                        {/* Financial summary */}
                        <Card className="p-4 md:p-6 bg-[#F5F0FA] border-0 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Receita Bruta</div>
                                <div className="text-lg md:text-xl font-bold text-gray-900">
                                  R$ {calculateTotals().totalRevenue.toFixed(2).replace('.', ',')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Despesas</div>
                                <div className="text-lg md:text-xl font-bold text-gray-900">
                                  R$ {calculateTotals().totalExpenses.toFixed(2).replace('.', ',')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <ArrowUpRight className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Lucro Líquido</div>
                                <div className="text-lg md:text-xl font-bold text-gray-900">
                                  R$ {calculateTotals().netProfit.toFixed(2).replace('.', ',')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </>}
                </TabsContent>

                {/* ARTISTAS TAB */}
                <TabsContent value="artists" className="mt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Meus Artistas</h2>
                      <p className="text-sm text-gray-600">Gerencie os artistas com quem você trabalha</p>
                    </div>
                    
                    <Dialog open={artistDialogOpen} onOpenChange={setArtistDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetArtistForm} className="w-full md:w-auto text-slate-50">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Artista
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white text-gray-900">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 font-semibold">
                            {editingArtist ? 'Editar Artista' : 'Adicionar Artista'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleArtistSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="artist_name" className="text-gray-900 font-medium">Nome do Artista *</Label>
                            <Input id="artist_name" value={artistFormData.name} onChange={e => setArtistFormData({
                            ...artistFormData,
                            name: e.target.value
                          })} placeholder="Ex: João Silva" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                          </div>
                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setArtistDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                              Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 text-slate-50">
                              {editingArtist ? 'Atualizar' : 'Cadastrar'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {artists.length === 0 ? <Card className="p-8 text-center bg-white border border-gray-200">
                      <Mic2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Nenhum artista cadastrado</p>
                      <p className="text-sm text-gray-400">
                        Adicione os artistas com quem você faz freelas
                      </p>
                    </Card> : <div className="grid gap-4">
                      {artists.map(artist => <Card key={artist.id} className="p-4 bg-white border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Mic2 className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{artist.name}</h3>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleArtistEdit(artist)} className="border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleArtistDelete(artist.id)} className="border-red-200 bg-red-50 hover:bg-red-100">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </Card>)}
                    </div>}
                </TabsContent>

                {/* INSTRUMENTOS TAB */}
                <TabsContent value="instruments" className="mt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Meus Instrumentos</h2>
                      <p className="text-sm text-gray-600">Gerencie os instrumentos que você toca</p>
                    </div>
                    
                    <Dialog open={instrumentDialogOpen} onOpenChange={setInstrumentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetInstrumentForm} className="w-full md:w-auto text-slate-50">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Instrumento
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white text-gray-900">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 font-semibold">
                            {editingInstrument ? 'Editar Instrumento' : 'Adicionar Instrumento'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInstrumentSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="instrument_name" className="text-gray-900 font-medium">Instrumento *</Label>
                            <Select value={instrumentFormData.name} onValueChange={value => setInstrumentFormData({
                            ...instrumentFormData,
                            name: value,
                            customInstrument: value === 'Outro' ? instrumentFormData.customInstrument : ''
                          })}>
                              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                <SelectValue placeholder="Selecione o instrumento" />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-50">
                                <SelectItem value="Bateria" className="text-gray-900">Bateria</SelectItem>
                                <SelectItem value="Violão" className="text-gray-900">Violão</SelectItem>
                                <SelectItem value="Baixo" className="text-gray-900">Baixo</SelectItem>
                                <SelectItem value="Guitarra" className="text-gray-900">Guitarra</SelectItem>
                                <SelectItem value="Saxofone" className="text-gray-900">Saxofone</SelectItem>
                                <SelectItem value="Teclado" className="text-gray-900">Teclado</SelectItem>
                                <SelectItem value="Vocal" className="text-gray-900">Vocal</SelectItem>
                                <SelectItem value="Outro" className="text-gray-900">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {instrumentFormData.name === 'Outro' && <div>
                              <Label htmlFor="custom_instrument" className="text-gray-900 font-medium">Especifique o Instrumento *</Label>
                              <Input id="custom_instrument" value={instrumentFormData.customInstrument} onChange={e => setInstrumentFormData({
                            ...instrumentFormData,
                            customInstrument: e.target.value
                          })} placeholder="Digite o nome do instrumento" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                            </div>}
                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setInstrumentDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                              Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 text-slate-50">
                              {editingInstrument ? 'Atualizar' : 'Cadastrar'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {instruments.length === 0 ? <Card className="p-8 text-center bg-white border border-gray-200">
                      <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Nenhum instrumento cadastrado</p>
                      <p className="text-sm text-gray-400">
                        Adicione os instrumentos que você toca
                      </p>
                    </Card> : <div className="grid gap-4 md:grid-cols-2">
                      {instruments.map(instrument => <Card key={instrument.id} className="p-4 bg-white border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Music2 className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{instrument.name}</h3>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleInstrumentEdit(instrument)} className="border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleInstrumentDelete(instrument.id)} className="border-red-200 bg-red-50 hover:bg-red-100">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </Card>)}
                    </div>}
                </TabsContent>

                {/* LOCAIS E BARES TAB */}
                <TabsContent value="venues" className="mt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Locais e Bares</h2>
                      <p className="text-sm text-gray-600">Gerencie os locais onde você trabalha</p>
                    </div>
                    
                    <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetVenueForm} className="w-full md:w-auto text-slate-50">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Local
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white text-gray-900">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 font-semibold">
                            {editingVenue ? 'Editar Local' : 'Adicionar Local'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleVenueSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="venue_name" className="text-gray-900 font-medium">Nome do Local *</Label>
                            <Input id="venue_name" value={venueFormData.name} onChange={e => setVenueFormData({
                            ...venueFormData,
                            name: e.target.value
                          })} placeholder="Ex: Bar do João, Casa de Shows..." className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                          </div>
                          <div>
                            <Label htmlFor="venue_address" className="text-gray-900 font-medium">Endereço (opcional)</Label>
                            <Input id="venue_address" value={venueFormData.address} onChange={e => setVenueFormData({
                            ...venueFormData,
                            address: e.target.value
                          })} placeholder="Rua, número, bairro, cidade..." className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
                          </div>
                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setVenueDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                              Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 text-slate-50">
                              {editingVenue ? 'Atualizar' : 'Cadastrar'}
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
                        Adicione os locais onde você trabalha
                      </p>
                    </Card> : <div className="grid gap-4 md:grid-cols-2">
                      {venues.map(venue => <Card key={venue.id} className="p-4 bg-white border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-6 h-6 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{venue.name}</h3>
                                {venue.address && <p className="text-sm text-gray-600">{venue.address}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button variant="outline" size="icon" onClick={() => handleVenueEdit(venue)} className="border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleVenueDelete(venue.id)} className="border-red-200 bg-red-50 hover:bg-red-100">
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
      
      <MobileBottomNav role="musician" />
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 text-lg font-semibold">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {itemToDelete?.type === 'show' && (
                <>Deseja excluir o show em <span className="font-semibold text-gray-900">{shows.find(s => s.id === itemToDelete.id)?.venue_name}</span>?</>
              )}
              {itemToDelete?.type === 'artist' && (
                <>Deseja excluir <span className="font-semibold text-gray-900">{artists.find(a => a.id === itemToDelete.id)?.name}</span> dos seus artistas?</>
              )}
              {itemToDelete?.type === 'instrument' && (
                <>Deseja excluir o instrumento <span className="font-semibold text-gray-900">{instruments.find(i => i.id === itemToDelete.id)?.name}</span>?</>
              )}
              {itemToDelete?.type === 'venue' && (
                <>Deseja excluir o local <span className="font-semibold text-gray-900">{venues.find(v => v.id === itemToDelete.id)?.name}</span>?</>
              )}
              <br />
              <span className="text-sm text-gray-500">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white border-0">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </SidebarProvider>;
};
export default MusicianShows;