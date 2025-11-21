import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, Calendar, Clock, MapPin, DollarSign, Edit, Trash2, X, Music2 } from 'lucide-react';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  
  const [formData, setFormData] = useState({
    artist_id: '',
    venue_name: '',
    date_local: '',
    time_local: '',
    fee: '',
    instrument: '',
  });

  const [personalExpenses, setPersonalExpenses] = useState<AdditionalExpense[]>([]);

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
        .eq('owner_uid', user.id);

      if (error) throw error;
      setArtists(data || []);
    } catch (error: any) {
      console.error('Error fetching artists:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    try {
      const selectedArtist = artists.find(a => a.id === formData.artist_id);
      
      if (!selectedArtist) {
        toast.error('Selecione um artista');
        return;
      }

      const musicianEntry = {
        musicianId: user.id,
        name: userData.name,
        instrument: formData.instrument,
        cost: parseFloat(formData.fee),
      };

      const showData = {
        venue_name: formData.venue_name,
        date_local: formData.date_local,
        time_local: formData.time_local,
        fee: parseFloat(formData.fee),
        is_private_event: false,
        expenses_team: [musicianEntry],
        expenses_other: personalExpenses,
        team_musician_ids: [user.id],
        uid: selectedArtist.owner_uid, // Artist's UID, not musician's
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

      setDialogOpen(false);
      resetForm();
      fetchShows();
    } catch (error: any) {
      console.error('Error saving show:', error);
      toast.error('Erro ao salvar show');
    }
  };

  const handleDelete = async (id: string) => {
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

  const handleEdit = (show: Show) => {
    setEditingShow(show);
    
    // Find my entry in expenses_team
    const myEntry = show.expenses_team.find(e => e.musicianId === user?.id);
    
    setFormData({
      artist_id: '', // We can't easily determine this from the show data
      venue_name: show.venue_name,
      date_local: show.date_local,
      time_local: show.time_local,
      fee: myEntry?.cost.toString() || show.fee.toString(),
      instrument: myEntry?.instrument || '',
    });
    setPersonalExpenses(show.expenses_other || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
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

  const calculateTotalExpenses = () => {
    return personalExpenses.reduce((sum, exp) => sum + (exp.cost || 0), 0);
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Meus Freelas</h2>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Show
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingShow ? 'Editar Show' : 'Adicionar Show'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Informações do Show</h3>
                        
                        <div>
                          <Label htmlFor="artist_id">Artista *</Label>
                          <Select value={formData.artist_id} onValueChange={(value) => setFormData({ ...formData, artist_id: value })} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o artista" />
                            </SelectTrigger>
                            <SelectContent>
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
                            value={formData.venue_name}
                            onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
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
                              value={formData.date_local}
                              onChange={(e) => setFormData({ ...formData, date_local: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="time_local">Horário *</Label>
                            <Input
                              id="time_local"
                              type="time"
                              value={formData.time_local}
                              onChange={(e) => setFormData({ ...formData, time_local: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* My Fee */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Seu Cachê</h3>
                        
                        <div>
                          <Label htmlFor="fee">Seu Cachê Individual (R$) *</Label>
                          <Input
                            id="fee"
                            type="number"
                            step="0.01"
                            value={formData.fee}
                            onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="instrument">Seu Instrumento *</Label>
                          <Input
                            id="instrument"
                            value={formData.instrument}
                            onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                            placeholder="Ex: Guitarra, Bateria, Baixo"
                            required
                          />
                        </div>
                      </div>

                      {/* Personal Expenses */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Despesas Pessoais</h3>
                          <Button type="button" variant="outline" size="sm" onClick={addExpense}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Despesa
                          </Button>
                        </div>

                        {personalExpenses.map((expense, index) => (
                          <Card key={index} className="p-4">
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

                        {personalExpenses.length > 0 && (
                          <div className="text-sm font-medium text-gray-900">
                            Total Despesas: R$ {calculateTotalExpenses().toFixed(2)}
                          </div>
                        )}
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
                <Card className="p-8 text-center border border-gray-200">
                  <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum show agendado</p>
                  <p className="text-sm text-gray-400">
                    Clique em "Adicionar Show" para cadastrar seu primeiro freela
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {shows.map((show) => (
                    <Card key={show.id} className="p-6 border border-gray-200">
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
                          <Button variant="outline" size="icon" onClick={() => handleEdit(show)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(show.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
        
        <MobileBottomNav role="musician" />
      </div>
    </SidebarProvider>
  );
};

export default MusicianShows;
