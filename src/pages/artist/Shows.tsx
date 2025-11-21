import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, Calendar, Clock, MapPin, DollarSign, Users, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const showSchema = z.object({
  venue_name: z.string().min(1, 'Nome do local é obrigatório').max(200),
  date_local: z.string().min(1, 'Data é obrigatória'),
  time_local: z.string().min(1, 'Horário é obrigatório'),
  fee: z.number().min(0, 'Cachê deve ser maior ou igual a 0'),
  is_private_event: z.boolean(),
});

interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
  is_private_event: boolean;
  team_musician_ids?: string[];
}

const ArtistShows = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [formData, setFormData] = useState({
    venue_name: '',
    date_local: '',
    time_local: '',
    fee: 0,
    is_private_event: false,
  });

  useEffect(() => {
    if (user) {
      fetchShows();
    }
  }, [user]);

  const fetchShows = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('uid', user?.id)
        .order('date_local', { ascending: true });

      if (error) throw error;
      setShows(data || []);
    } catch (error) {
      console.error('Error fetching shows:', error);
      toast({
        title: 'Erro ao carregar shows',
        description: 'Não foi possível carregar seus shows.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = showSchema.parse(formData);

      if (editingShow) {
        // Update
        const { error } = await supabase
          .from('shows')
          .update({
            ...validatedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingShow.id);

        if (error) throw error;

        toast({
          title: 'Show atualizado!',
          description: 'O show foi atualizado com sucesso.',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('shows')
          .insert([{
            venue_name: validatedData.venue_name,
            date_local: validatedData.date_local,
            time_local: validatedData.time_local,
            fee: validatedData.fee,
            is_private_event: validatedData.is_private_event,
            uid: user?.id!,
          }]);

        if (error) throw error;

        toast({
          title: 'Show adicionado!',
          description: 'O show foi cadastrado com sucesso.',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchShows();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Error saving show:', error);
        toast({
          title: 'Erro ao salvar show',
          description: 'Não foi possível salvar o show.',
          variant: 'destructive',
        });
      }
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

      toast({
        title: 'Show excluído',
        description: 'O show foi removido com sucesso.',
      });
      
      fetchShows();
    } catch (error) {
      console.error('Error deleting show:', error);
      toast({
        title: 'Erro ao excluir show',
        description: 'Não foi possível excluir o show.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (show: Show) => {
    setEditingShow(show);
    setFormData({
      venue_name: show.venue_name,
      date_local: show.date_local,
      time_local: show.time_local,
      fee: show.fee,
      is_private_event: show.is_private_event,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      venue_name: '',
      date_local: '',
      time_local: '',
      fee: 0,
      is_private_event: false,
    });
    setEditingShow(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Shows</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Meus Shows</h2>
                  <p className="text-gray-600">Gerencie todos os seus eventos</p>
                </div>
                
                <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Adicionar Show
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{editingShow ? 'Editar Show' : 'Adicionar Novo Show'}</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes do show abaixo
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="venue_name">Local do Evento *</Label>
                        <Input
                          id="venue_name"
                          placeholder="Ex: Casa de Shows XYZ"
                          value={formData.venue_name}
                          onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date_local">Data *</Label>
                          <Input
                            id="date_local"
                            type="date"
                            value={formData.date_local}
                            onChange={(e) => setFormData({ ...formData, date_local: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
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

                      <div className="space-y-2">
                        <Label htmlFor="fee">Cachê (R$) *</Label>
                        <Input
                          id="fee"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.fee}
                          onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="is_private_event">Tipo de Evento</Label>
                        <Select
                          value={formData.is_private_event ? 'private' : 'public'}
                          onValueChange={(value) => setFormData({ ...formData, is_private_event: value === 'private' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Público</SelectItem>
                            <SelectItem value="private">Privado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                          {editingShow ? 'Atualizar' : 'Adicionar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">Carregando shows...</p>
                </div>
              ) : shows.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">Nenhum show cadastrado ainda</p>
                  <p className="text-sm text-gray-400 mt-2">Clique em "Adicionar Show" para começar</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shows.map((show) => (
                    <Card key={show.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-start justify-between">
                          <span className="flex-1">{show.venue_name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(show)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(show.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(show.date_local), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{show.time_local}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>R$ {show.fee.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            show.is_private_event 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {show.is_private_event ? 'Privado' : 'Público'}
                          </span>
                        </div>
                      </CardContent>
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
