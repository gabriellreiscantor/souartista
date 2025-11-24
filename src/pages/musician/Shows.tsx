import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import { Bell, Plus, Calendar, Clock, MapPin, DollarSign, Edit, Trash2, X, Music2, Mic2 } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const {
    user,
    userData,
    userRole
  } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  // Shows dialog
  const [showDialogOpen, setShowDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showFormData, setShowFormData] = useState({
    artist_id: '',
    venue_id: '',
    date_local: '',
    time_local: '',
    fee: '',
    instrument_id: ''
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
    name: ''
  });

  // Venues dialog
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    address: ''
  });
  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);
  const fetchAll = async () => {
    await Promise.all([fetchShows(), fetchArtists(), fetchInstruments(), fetchVenues()]);
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
      const {
        data,
        error
      } = await supabase.from('musician_venues').select('*').eq('owner_uid', user.id).order('name', {
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
    if (!user || !userData) return;
    try {
      const selectedArtist = artists.find(a => a.id === showFormData.artist_id);
      const selectedInstrument = instruments.find(i => i.id === showFormData.instrument_id);
      const selectedVenue = venues.find(v => v.id === showFormData.venue_id);
      if (!selectedArtist) {
        toast.error('Selecione um artista');
        return;
      }
      if (!selectedInstrument) {
        toast.error('Selecione um instrumento');
        return;
      }
      if (!selectedVenue) {
        toast.error('Selecione um local');
        return;
      }
      const musicianEntry = {
        musicianId: user.id,
        name: userData.name,
        instrument: selectedInstrument.name,
        cost: parseFloat(showFormData.fee)
      };
      const showData = {
        venue_name: selectedVenue.name,
        date_local: showFormData.date_local,
        time_local: showFormData.time_local,
        fee: parseFloat(showFormData.fee),
        is_private_event: false,
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
    const myEntry = show.expenses_team.find(e => e.musicianId === user?.id);
    const savedInstrument = myEntry?.instrument || '';

    // Find instrument by name
    const matchingInstrument = instruments.find(i => i.name === savedInstrument);

    // Find venue by name
    const matchingVenue = venues.find(v => v.name === show.venue_name);
    setShowFormData({
      artist_id: '',
      venue_id: matchingVenue?.id || '',
      date_local: show.date_local,
      time_local: show.time_local,
      fee: myEntry?.cost.toString() || show.fee.toString(),
      instrument_id: matchingInstrument?.id || ''
    });
    setPersonalExpenses(show.expenses_other || []);
    setShowDialogOpen(true);
  };
  const resetShowForm = () => {
    setShowFormData({
      artist_id: '',
      venue_id: '',
      date_local: '',
      time_local: '',
      fee: '',
      instrument_id: ''
    });
    setPersonalExpenses([]);
    setEditingShow(null);
  };

  // Artist handlers
  const handleArtistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const artistData = {
        name: artistFormData.name,
        owner_uid: user.id
      };
      if (editingArtist) {
        const {
          error
        } = await supabase.from('artists').update(artistData).eq('id', editingArtist.id);
        if (error) throw error;
        toast.success('Artista atualizado com sucesso!');
      } else {
        const {
          error
        } = await supabase.from('artists').insert(artistData);
        if (error) throw error;
        toast.success('Artista cadastrado com sucesso!');
      }
      setArtistDialogOpen(false);
      resetArtistForm();
      fetchArtists();
    } catch (error: any) {
      toast.error('Erro ao salvar artista');
      console.error(error);
    }
  };
  const handleArtistEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setArtistFormData({
      name: artist.name
    });
    setArtistDialogOpen(true);
  };
  const handleArtistDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este artista?')) return;
    try {
      const {
        error
      } = await supabase.from('artists').delete().eq('id', id);
      if (error) throw error;
      toast.success('Artista excluído com sucesso!');
      fetchArtists();
    } catch (error: any) {
      toast.error('Erro ao excluir artista');
      console.error(error);
    }
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
    if (!user) return;
    try {
      const instrumentData = {
        name: instrumentFormData.name,
        owner_uid: user.id
      };
      if (editingInstrument) {
        const {
          error
        } = await supabase.from('musician_instruments').update(instrumentData).eq('id', editingInstrument.id);
        if (error) throw error;
        toast.success('Instrumento atualizado!');
      } else {
        const {
          error
        } = await supabase.from('musician_instruments').insert(instrumentData);
        if (error) throw error;
        toast.success('Instrumento cadastrado!');
      }
      setInstrumentDialogOpen(false);
      resetInstrumentForm();
      fetchInstruments();
    } catch (error: any) {
      toast.error('Erro ao salvar instrumento');
      console.error(error);
    }
  };
  const handleInstrumentEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setInstrumentFormData({
      name: instrument.name
    });
    setInstrumentDialogOpen(true);
  };
  const handleInstrumentDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este instrumento?')) return;
    try {
      const {
        error
      } = await supabase.from('musician_instruments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Instrumento excluído!');
      fetchInstruments();
    } catch (error: any) {
      toast.error('Erro ao excluir instrumento');
      console.error(error);
    }
  };
  const resetInstrumentForm = () => {
    setInstrumentFormData({
      name: ''
    });
    setEditingInstrument(null);
  };

  // Venue handlers
  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const venueData = {
        name: venueFormData.name,
        address: venueFormData.address || null,
        owner_uid: user.id
      };
      if (editingVenue) {
        const {
          error
        } = await supabase.from('musician_venues').update(venueData).eq('id', editingVenue.id);
        if (error) throw error;
        toast.success('Local atualizado!');
      } else {
        const {
          error
        } = await supabase.from('musician_venues').insert(venueData);
        if (error) throw error;
        toast.success('Local cadastrado!');
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
      address: venue.address || ''
    });
    setVenueDialogOpen(true);
  };
  const handleVenueDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;
    try {
      const {
        error
      } = await supabase.from('musician_venues').delete().eq('id', id);
      if (error) throw error;
      toast.success('Local excluído!');
      fetchVenues();
    } catch (error: any) {
      toast.error('Erro ao excluir local');
      console.error(error);
    }
  };
  const resetVenueForm = () => {
    setVenueFormData({
      name: '',
      address: ''
    });
    setEditingVenue(null);
  };
  const addExpense = () => {
    setPersonalExpenses([...personalExpenses, {
      description: '',
      cost: 0
    }]);
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
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-900" />
              </Button>
              <UserMenu userName={userData?.name} userRole={userRole} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
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
                      <p className="text-sm text-gray-600 mt-1">Gerencie seus shows e cachês</p>
                    </div>
                    
                    <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetShowForm} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                          <Plus className="w-5 h-5 mr-2" />
                          Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
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
                      <p className="text-sm text-gray-600">Gerencie seus shows e cachês</p>
                    </div>
                    
                    <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetShowForm} className="bg-primary hover:bg-primary/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 font-semibold">
                            {editingShow ? 'Editar Show' : 'Adicionar Show'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleShowSubmit} className="space-y-6">
                          <div className="space-y-4">
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

                            <div>
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="date_local" className="text-gray-900 font-medium">Data *</Label>
                                <Input id="date_local" type="date" value={showFormData.date_local} onChange={e => setShowFormData({
                                ...showFormData,
                                date_local: e.target.value
                              })} className="bg-white border-gray-300 text-gray-900" required />
                              </div>
                              <div>
                                <Label htmlFor="time_local" className="text-gray-900 font-medium">Horário *</Label>
                                <TimePicker value={showFormData.time_local} onChange={time => setShowFormData({
                                ...showFormData,
                                time_local: time
                              })} />
                              </div>
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

                          <div className="space-y-4">
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
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeExpense(index)}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  <Input placeholder="Descrição (ex: Uber, Cordas)" value={expense.description} onChange={e => updateExpense(index, 'description', e.target.value)} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                                  <CurrencyInput value={expense.cost} onChange={value => updateExpense(index, 'cost', parseFloat(value) || 0)} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                                </div>
                              </Card>)}
                          </div>

                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setShowDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                              Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 text-slate-50">
                              {editingShow ? 'Atualizar Show' : 'Cadastrar Show'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {loading ? <div className="text-center py-12">
                      <p className="text-gray-500">Carregando...</p>
                    </div> : shows.length === 0 ? <Card className="p-8 text-center bg-white border border-gray-200">
                      <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum show encontrado para o filtro selecionado.</p>
                    </Card> : <div className="grid gap-4">
                      {shows.map(show => {
                    const showDate = new Date(show.date_local);
                    const myFee = getMyFee(show);
                    const totalExpenses = show.expenses_other.reduce((sum, e) => sum + e.cost, 0);
                    return <Card key={show.id} className="p-4 md:p-6 bg-white border border-gray-200">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-shrink-0 w-16 text-center bg-[#F5F0FA] rounded-lg p-2 border-2 border-purple-200">
                                <div className="text-xs text-primary font-bold uppercase">{format(showDate, 'MMM', {
                              locale: ptBR
                            })}</div>
                                <div className="text-3xl font-bold text-gray-900">{format(showDate, 'dd')}</div>
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
                              </div>
                              
                              <div className="flex gap-1 flex-shrink-0">
                                <Button variant="outline" size="icon" onClick={() => handleShowEdit(show)} className="h-8 w-8 md:h-10 md:w-10">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleShowDelete(show.id)} className="h-8 w-8 md:h-10 md:w-10">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex gap-3 text-sm">
                              <div className="flex-1 text-center">
                                <div className="text-gray-600 text-xs mb-1">Cachê</div>
                                <div className="text-green-600 font-bold text-sm md:text-base">
                                  R$ {myFee.toFixed(2).replace('.', ',')}
                                </div>
                              </div>
                              {totalExpenses > 0 && <div className="flex-1 text-center">
                                  <div className="text-gray-600 text-xs mb-1">Despesas</div>
                                  <div className="text-red-600 font-bold text-sm md:text-base">
                                    R$ {totalExpenses.toFixed(2).replace('.', ',')}
                                  </div>
                                </div>}
                              <div className="flex-1 text-center">
                                <div className="text-gray-600 text-xs mb-1">Líquido</div>
                                <div className="px-2 py-1 rounded-full bg-primary text-white font-bold text-xs md:text-sm inline-block">
                                  R$ {(myFee - totalExpenses).toFixed(2).replace('.', ',')}
                                </div>
                              </div>
                            </div>
                          </Card>;
                  })}
                    </div>}
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
                            <Button type="submit" className="flex-1">
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
                              <Button variant="outline" size="icon" onClick={() => handleArtistEdit(artist)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleArtistDelete(artist.id)}>
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
                            <Label htmlFor="instrument_name" className="text-gray-900 font-medium">Nome do Instrumento *</Label>
                            <Input id="instrument_name" value={instrumentFormData.name} onChange={e => setInstrumentFormData({
                            ...instrumentFormData,
                            name: e.target.value
                          })} placeholder="Ex: Guitarra, Bateria, Baixo..." className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" required />
                          </div>
                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setInstrumentDialogOpen(false)} className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                              Cancelar
                            </Button>
                            <Button type="submit" className="flex-1">
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
                              <Button variant="outline" size="icon" onClick={() => handleInstrumentEdit(instrument)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleInstrumentDelete(instrument.id)}>
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
                            <Button type="submit" className="flex-1">
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
              </Tabs>
            </div>
          </main>
        </div>
        
        <MobileBottomNav role="musician" />
      </div>
    </SidebarProvider>;
};
export default MusicianShows;