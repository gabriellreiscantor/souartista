import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
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

interface Musician {
  id: string;
  name: string;
  instrument: string;
  default_fee: number;
  owner_uid: string;
}

const ArtistMusicians = () => {
  const { user, userData, userRole } = useAuth();
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    instrument: '',
    default_fee: '',
  });

  useEffect(() => {
    fetchMusicians();
  }, [user]);

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
      toast.error('Erro ao carregar músicos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const musicianData = {
        name: formData.name,
        instrument: formData.instrument,
        default_fee: parseFloat(formData.default_fee),
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

      setDialogOpen(false);
      resetForm();
      fetchMusicians();
    } catch (error: any) {
      toast.error('Erro ao salvar músico');
      console.error(error);
    }
  };

  const handleEdit = (musician: Musician) => {
    setEditingMusician(musician);
    setFormData({
      name: musician.name,
      instrument: musician.instrument,
      default_fee: musician.default_fee.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
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

  const resetForm = () => {
    setFormData({ name: '', instrument: '', default_fee: '' });
    setEditingMusician(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Músicos e Equipe</h1>
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
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Minha Equipe</h2>
                  <p className="text-gray-600">Gerencie seus músicos e cachês padrão</p>
                </div>
                
                <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Músico
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMusician ? 'Editar Músico' : 'Adicionar Músico'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="instrument">Instrumento *</Label>
                        <Input
                          id="instrument"
                          value={formData.instrument}
                          onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="default_fee">Cachê Padrão (R$) *</Label>
                        <Input
                          id="default_fee"
                          type="number"
                          step="0.01"
                          value={formData.default_fee}
                          onChange={(e) => setFormData({ ...formData, default_fee: e.target.value })}
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

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Carregando...</p>
                </div>
              ) : musicians.length === 0 ? (
                <Card className="p-8 text-center bg-white border border-gray-200">
                  <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(musician)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(musician.id)}
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
        </div>
        
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistMusicians;
