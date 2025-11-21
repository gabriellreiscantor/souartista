import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bell, Plus, Calendar, Clock, MapPin, DollarSign, Edit, Trash2, X, Music2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Musician {
  id: string;
  name: string;
  instrument: string;
  default_fee: number;
}

interface Venue {
  id: string;
  name: string;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  
  const [formData, setFormData] = useState({
    venue_id: '',
    custom_venue: '',
    date_local: '',
    time_local: '',
    fee: '',
    is_private_event: false,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);

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
        .eq('owner_uid', user.id);

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
        .eq('owner_uid', user.id);

      if (error) throw error;
      setVenues(data || []);
    } catch (error: any) {
      console.error('Error fetching venues:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const venueName = formData.is_private_event 
        ? formData.custom_venue 
        : venues.find(v => v.id === formData.venue_id)?.name || formData.custom_venue;

      if (!venueName) {
        toast.error('Selecione ou digite o nome do local');
        return;
      }

      const teamMusicianIds = teamMembers
        .filter(m => m.musicianId)
        .map(m => m.musicianId!);

      const showData = {
        venue_name: venueName,
        date_local: formData.date_local,
        time_local: formData.time_local,
        fee: parseFloat(formData.fee),
        is_private_event: formData.is_private_event,
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
    setFormData({
      venue_id: '',
      custom_venue: show.venue_name,
      date_local: show.date_local,
      time_local: show.time_local,
      fee: show.fee.toString(),
      is_private_event: show.is_private_event,
    });
    setTeamMembers(show.expenses_team || []);
    setAdditionalExpenses(show.expenses_other || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
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

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', instrument: '', cost: 0 }]);
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

  const calculateTotalTeamCost = () => {
    return teamMembers.reduce((sum, member) => sum + (member.cost || 0), 0);
  };

  const calculateTotalExpenses = () => {
    return additionalExpenses.reduce((sum, exp) => sum + (exp.cost || 0), 0);
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Agenda de Shows</h2>
                
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
                        <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
                        
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={formData.is_private_event}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, is_private_event: checked })
                            }
                          />
                          <Label>Evento Particular</Label>
                        </div>

                        {formData.is_private_event ? (
                          <div>
                            <Label htmlFor="custom_venue">Nome do Evento *</Label>
                            <Input
                              id="custom_venue"
                              value={formData.custom_venue}
                              onChange={(e) => setFormData({ ...formData, custom_venue: e.target.value })}
                              placeholder="Ex: Casamento Ana e Pedro"
                              required
                            />
                          </div>
                        ) : (
                          <div>
                            <Label htmlFor="venue_id">Local *</Label>
                            <Select value={formData.venue_id} onValueChange={(value) => setFormData({ ...formData, venue_id: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um local" />
                              </SelectTrigger>
                              <SelectContent>
                                {venues.map((venue) => (
                                  <SelectItem key={venue.id} value={venue.id}>
                                    {venue.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">Outro local...</SelectItem>
                              </SelectContent>
                            </Select>
                            {formData.venue_id === 'custom' && (
                              <Input
                                className="mt-2"
                                value={formData.custom_venue}
                                onChange={(e) => setFormData({ ...formData, custom_venue: e.target.value })}
                                placeholder="Digite o nome do local"
                                required
                              />
                            )}
                          </div>
                        )}

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

                        <div>
                          <Label htmlFor="fee">Cachê Total do Show (R$) *</Label>
                          <Input
                            id="fee"
                            type="number"
                            step="0.01"
                            value={formData.fee}
                            onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      {/* Team Members */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Equipe/Músicos</h3>
                          <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Músico
                          </Button>
                        </div>

                        {teamMembers.map((member, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Músico {index + 1}</Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTeamMember(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <Select
                                value={member.musicianId || 'freelancer'}
                                onValueChange={(value) => updateTeamMember(index, 'musicianId', value === 'freelancer' ? undefined : value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um músico" />
                                </SelectTrigger>
                                <SelectContent>
                                  {musicians.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      {m.name} - {m.instrument}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="freelancer">Freelancer</SelectItem>
                                </SelectContent>
                              </Select>

                              {!member.musicianId && (
                                <>
                                  <Input
                                    placeholder="Nome"
                                    value={member.name}
                                    onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                    required
                                  />
                                  <Input
                                    placeholder="Instrumento"
                                    value={member.instrument}
                                    onChange={(e) => updateTeamMember(index, 'instrument', e.target.value)}
                                    required
                                  />
                                </>
                              )}

                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Cachê (R$)"
                                value={member.cost}
                                onChange={(e) => updateTeamMember(index, 'cost', parseFloat(e.target.value) || 0)}
                                required
                              />
                            </div>
                          </Card>
                        ))}

                        {teamMembers.length > 0 && (
                          <div className="text-sm font-medium text-gray-900">
                            Total Equipe: R$ {calculateTotalTeamCost().toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Additional Expenses */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Despesas Adicionais</h3>
                          <Button type="button" variant="outline" size="sm" onClick={addExpense}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Despesa
                          </Button>
                        </div>

                        {additionalExpenses.map((expense, index) => (
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
                                placeholder="Descrição (ex: Aluguel de equipamento)"
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

                        {additionalExpenses.length > 0 && (
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
                    Clique em "Adicionar Show" para cadastrar seu primeiro evento
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
                            {show.is_private_event && (
                              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                                Evento Particular
                              </span>
                            )}
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
                                R$ {show.fee.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {show.expenses_team.length > 0 && (
                            <div className="text-sm">
                              <span className="text-gray-600">Equipe:</span>{' '}
                              <span className="text-gray-900">
                                {show.expenses_team.length} músico(s)
                              </span>
                            </div>
                          )}

                          {show.expenses_other.length > 0 && (
                            <div className="text-sm">
                              <span className="text-gray-600">Despesas adicionais:</span>{' '}
                              <span className="text-gray-900">
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
        
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistShows;
