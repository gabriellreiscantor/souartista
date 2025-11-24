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
import { Bell, Plus, Pencil, Trash2, Music2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Instrument {
  id: string;
  name: string;
  owner_uid: string;
}

const MusicianInstruments = () => {
  const { user, userData, userRole } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    fetchInstruments();
  }, [user]);

  const fetchInstruments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('musician_instruments')
        .select('*')
        .eq('owner_uid', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setInstruments(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar instrumentos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const instrumentData = {
        name: formData.name,
        owner_uid: user.id,
      };

      if (editingInstrument) {
        const { error } = await supabase
          .from('musician_instruments')
          .update(instrumentData)
          .eq('id', editingInstrument.id);

        if (error) throw error;
        toast.success('Instrumento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('musician_instruments')
          .insert(instrumentData);

        if (error) throw error;
        toast.success('Instrumento cadastrado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchInstruments();
    } catch (error: any) {
      toast.error('Erro ao salvar instrumento');
      console.error(error);
    }
  };

  const handleEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setFormData({
      name: instrument.name,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este instrumento?')) return;

    try {
      const { error } = await supabase
        .from('musician_instruments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Instrumento excluído com sucesso!');
      fetchInstruments();
    } catch (error: any) {
      toast.error('Erro ao excluir instrumento');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingInstrument(null);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <MusicianSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-black">Instrumentos</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-900" />
              </Button>
              <UserMenu userName={userData?.name} userRole="musician" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Meus Instrumentos</h2>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Instrumento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingInstrument ? 'Editar Instrumento' : 'Adicionar Instrumento'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Instrumento</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Guitarra, Bateria, Baixo..."
                          required
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingInstrument ? 'Atualizar' : 'Adicionar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : instruments.length === 0 ? (
                <Card className="p-8 text-center">
                  <Music2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Nenhum instrumento cadastrado</h3>
                  <p className="text-gray-600 mb-4">
                    Adicione os instrumentos que você toca para facilitar o cadastro de freelas.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {instruments.map((instrument) => (
                    <Card key={instrument.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Music2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{instrument.name}</h3>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(instrument)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(instrument.id)}
                          >
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

          <MobileBottomNav role="musician" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MusicianInstruments;
