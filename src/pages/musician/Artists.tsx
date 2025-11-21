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
import { Bell, Plus, Pencil, Trash2, Mic2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Artist {
  id: string;
  name: string;
  owner_uid: string;
}

const MusicianArtists = () => {
  const { user, userData, userRole } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    fetchArtists();
  }, [user]);

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
      toast.error('Erro ao carregar artistas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const artistData = {
        name: formData.name,
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

      setDialogOpen(false);
      resetForm();
      fetchArtists();
    } catch (error: any) {
      toast.error('Erro ao salvar artista');
      console.error(error);
    }
  };

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setFormData({
      name: artist.name,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
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

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingArtist(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <MusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Artistas</h1>
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
                  <h2 className="text-2xl font-bold text-gray-900">Meus Artistas</h2>
                  <p className="text-gray-600">Gerencie os artistas com quem você trabalha</p>
                </div>
                
                <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Artista
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingArtist ? 'Editar Artista' : 'Adicionar Artista'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Artista *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Carregando...</p>
                </div>
              ) : artists.length === 0 ? (
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(artist)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(artist.id)}
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
        
        <MobileBottomNav role="musician" />
      </div>
    </SidebarProvider>
  );
};

export default MusicianArtists;
