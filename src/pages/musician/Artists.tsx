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
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Pencil, Trash2, Mic2, Music, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <div className="mb-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold text-gray-900">Meus Artistas</h2>
                      {artists.length > 0 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                          {artists.length} {artists.length === 1 ? 'artista' : 'artistas'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600">Gerencie sua rede de parceiros musicais</p>
                  </div>
                  
                  <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Artista
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-primary" />
                          {editingArtist ? 'Editar Artista' : 'Novo Artista'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div>
                          <Label htmlFor="name" className="text-base font-medium">Nome do Artista *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: João Silva"
                            required
                            className="mt-2 h-12 text-base"
                          />
                        </div>
                        <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90">
                          {editingArtist ? 'Atualizar Artista' : 'Cadastrar Artista'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20 animate-pulse">
                  <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Music className="w-8 h-8 text-purple-600 animate-bounce" />
                  </div>
                  <p className="text-gray-500 font-medium">Carregando artistas...</p>
                </div>
              ) : artists.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-purple-50/50 to-white p-12 text-center animate-fade-in">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Mic2 className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Comece sua rede de colaborações
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Adicione os artistas com quem você trabalha para organizar melhor seus freelas e shows
                    </p>
                    <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="bg-primary hover:bg-primary/90">
                          <Plus className="w-5 h-5 mr-2" />
                          Adicionar Primeiro Artista
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-2xl flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-primary" />
                            Novo Artista
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                          <div>
                            <Label htmlFor="name-empty" className="text-base font-medium">Nome do Artista *</Label>
                            <Input
                              id="name-empty"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Ex: João Silva"
                              required
                              className="mt-2 h-12 text-base"
                            />
                          </div>
                          <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90">
                            Cadastrar Artista
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {artists.map((artist, index) => (
                    <Card 
                      key={artist.id} 
                      className={cn(
                        "group relative overflow-hidden border-2 border-gray-200 hover:border-purple-300",
                        "bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Gradient Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Mic2 className="w-7 h-7 text-white" />
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(artist)}
                              className="h-9 w-9 hover:bg-purple-100 hover:text-purple-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(artist.id)}
                              className="h-9 w-9 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                            {artist.name}
                          </h3>
                          <p className="text-sm text-gray-500">Artista parceiro</p>
                        </div>

                        {/* Bottom accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
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
