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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import { Bell, Plus, Calendar, Clock, MapPin, DollarSign, Edit, Trash2, X, Music2, Mic2 } from 'lucide-react';
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
  const { user, userData, userRole } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Shows dialog
  const [showDialogOpen, setShowDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showFormData, setShowFormData] = useState({
    artist_id: '',
    venue_name: '',
    date_local: '',
    time_local: '',
    fee: '',
    instrument: '',
  });
  const [personalExpenses, setPersonalExpenses] = useState<AdditionalExpense[]>([]);

  // Artists dialog
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [artistFormData, setArtistFormData] = useState({
    name: '',
  });

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([fetchShows(), fetchArtists()]);
  };

  const fetchShows = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .contains('team_musician_ids', [user.id])
        .order('date_local', { ascending: true });

      if (error) throw error;
      
      const typedShows = (data || []).map(show => ({
        ...show,
        expenses_team: (show.expenses_team as any) || [],
        expenses_other: (show.expenses_other as any) || [],
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
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('owner_uid', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setArtists(data || []);
    } catch (error: any) {
      console.error('Error fetching artists:', error);
    }
  };

  // Show handlers
  const handleShowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    try {
      const selectedArtist = artists.find(a => a.id === showFormData.artist_id);
      
      if (!selectedArtist) {
        toast.error('Selecione um artista');
        return;
      }

      const musicianEntry = {
        musicianId: user.id,
        name: userData.name,
        instrument: showFormData.instrument,
        cost: parseFloat(showFormData.fee),
      };

      const showData = {
        venue_name: showFormData.venue_name,
        date_local: showFormData.date_local,
        time_local: showFormData.time_local,
        fee: parseFloat(showFormData.fee),
        is_private_event: false,
        expenses_team: [musicianEntry],
        expenses_other: personalExpenses,
        team_musician_ids: [user.id],
        uid: selectedArtist.owner_uid,
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
    
    const myEntry = show.expenses_team.find(e => e.musicianId === user?.id);
    
    setShowFormData({
      artist_id: '',
      venue_name: show.venue_name,
      date_local: show.date_local,
      time_local: show.time_local,
      fee: myEntry?.cost.toString() || show.fee.toString(),
      instrument: myEntry?.instrument || '',
    });
    setPersonalExpenses(show.expenses_other || []);
    setShowDialogOpen(true);
  };

  const resetShowForm = () => {
    setShowFormData({
      artist_id: '',
      venue_name: '',
      date_local: '',
      time_local: '',
      fee: '',
      instrument: '',
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
        owner_uid: user.id,
      };

      if (editingArtist) {
        const { error } = await supabase
          .from('artists')
          .update(artistData)
          .eq('id', editingArtist.id);

        if (error) throw error;
        toast.success('Artista atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('artists')
          .insert(artistData);

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
      name: artist.name,
    });
    setArtistDialogOpen(true);
  };

  const handleArtistDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este artista?')) return;

    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Artista excluído com sucesso!');
      fetchArtists();
    } catch (error: any) {
      toast.error('Erro ao excluir artista');
      console.error(error);
    }
  };

  const resetArtistForm = () => {
    setArtistFormData({ name: '' });
    setEditingArtist(null);
  };

  const addExpense = () => {
    setPersonalExpenses([...personalExpenses, { description: '', cost: 0 }]);
  };

  const removeExpense = (index: number) => {
    setPersonalExpenses(personalExpenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: keyof AdditionalExpense, value: any) => {
    const updated = [...personalExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setPersonalExpenses(updated);
  };

  const getMyFee = (show: Show) => {
    const myEntry = show.expenses_team.find(e => e.musicianId === user?.id);
    return myEntry?.cost || show.fee;
  };

  return (
    <SidebarProvider>
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
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>
              <UserMenu userName={userData?.name} userRole={userRole} />
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-4xl mx-auto">
              <Tabs defaultValue="shows" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white">
                  <TabsTrigger value="shows" className="flex items-center gap-2">
                    <Music2 className="w-4 h-4" />
                    Meus Freelas
                  </TabsTrigger>
                  <TabsTrigger value="artists" className="flex items-center gap-2">
                    <Mic2 className="w-4 h-4" />
                    Artistas
                  </TabsTrigger>
                </TabsList>

                {/* SHOWS TAB */}
                <TabsContent value="shows" className="mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Meus Freelas</h2>
                    
                    <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetShowForm}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                        <DialogHeader>
                          <DialogTitle>
                            {editingShow ? 'Editar Show' : 'Adicionar Show'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleShowSubmit} className="space-y-6">
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Informações do Show</h3>
                            
                            <div>
                              <Label htmlFor="artist_id">Artista *</Label>
                              <Select value={showFormData.artist_id} onValueChange={(value) => setShowFormData({ ...showFormData, artist_id: value })} required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o artista" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {artists.map((artist) => (
                                    <SelectItem key={artist.id} value={artist.id}>
                                      {artist.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="venue_name">Local do Show *</Label>
                              <Input
                                id="venue_name"
                                value={showFormData.venue_name}
                                onChange={(e) => setShowFormData({ ...showFormData, venue_name: e.target.value })}
                                placeholder="Ex: Bar do João"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="date_local">Data *</Label>
                                <Input
                                  id="date_local"
                                  type="date"
                                  value={showFormData.date_local}
                                  onChange={(e) => setShowFormData({ ...showFormData, date_local: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="time_local">Horário *</Label>
                                <TimePicker
                                  value={showFormData.time_local}
                                  onChange={(time) => setShowFormData({ ...showFormData, time_local: time })}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Seu Cachê</h3>
                            
                            <div>
                              <Label htmlFor="fee">Seu Cachê Individual (R$) *</Label>
                              <Input
                                id="fee"
                                type="number"
                                step="0.01"
                                value={showFormData.fee}
                                onChange={(e) => setShowFormData({ ...showFormData, fee: e.target.value })}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="instrument">Seu Instrumento *</Label>
                              <Input
                                id="instrument"
                                value={showFormData.instrument}
                                onChange={(e) => setShowFormData({ ...showFormData, instrument: e.target.value })}
                                placeholder="Ex: Guitarra, Bateria, Baixo"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">Despesas Pessoais</h3>
                              <Button type="button" variant="outline" size="sm" onClick={addExpense}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Despesa
                              </Button>
                            </div>

                            {personalExpenses.map((expense, index) => (
                              <Card key={index} className="p-4 bg-white border border-gray-200">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label>Despesa {index + 1}</Label>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeExpense(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  <Input
                                    placeholder="Descrição (ex: Uber, Cordas)"
                                    value={expense.description}
                                    onChange={(e) => updateExpense(index, 'description', e.target.value)}
                                    required
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Valor (R$)"
                                    value={expense.cost}
                                    onChange={(e) => updateExpense(index, 'cost', parseFloat(e.target.value) || 0)}
                                    required
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>

                          <Button type="submit" className="w-full">
                            {editingShow ? 'Atualizar Show' : 'Cadastrar Show'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
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
                        Clique em "Adicionar" para cadastrar seu primeiro freela
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {shows.map((show) => (
                        <Card key={show.id} className="p-6 bg-white border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-semibold text-gray-900">{show.venue_name}</h3>
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(show.date_local), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {show.time_local}
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  <span className="font-semibold text-green-600">
                                    R$ {getMyFee(show).toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {show.expenses_other.length > 0 && (
                                <div className="text-sm">
                                  <span className="text-gray-600">Despesas:</span>{' '}
                                  <span className="text-red-600">
                                    R$ {show.expenses_other.reduce((sum, e) => sum + e.cost, 0).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleShowEdit(show)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleShowDelete(show.id)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ARTISTAS TAB */}
                <TabsContent value="artists" className="mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Meus Artistas</h2>
                      <p className="text-gray-600">Gerencie os artistas com quem você trabalha</p>
                    </div>
                    
                    <Dialog open={artistDialogOpen} onOpenChange={setArtistDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetArtistForm}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Artista
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>
                            {editingArtist ? 'Editar Artista' : 'Adicionar Artista'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleArtistSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="artist_name">Nome do Artista *</Label>
                            <Input
                              id="artist_name"
                              value={artistFormData.name}
                              onChange={(e) => setArtistFormData({ ...artistFormData, name: e.target.value })}
                              placeholder="Ex: João Silva"
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            {editingArtist ? 'Atualizar' : 'Cadastrar'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {artists.length === 0 ? (
                    <Card className="p-8 text-center bg-white border border-gray-200">
                      <Mic2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Nenhum artista cadastrado</p>
                      <p className="text-sm text-gray-400">
                        Adicione os artistas com quem você faz freelas
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {artists.map((artist) => (
                        <Card key={artist.id} className="p-4 bg-white border border-gray-200">
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
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
        
        <MobileBottomNav role="musician" />
      </div>
    </SidebarProvider>
  );
};

export default MusicianShows;
