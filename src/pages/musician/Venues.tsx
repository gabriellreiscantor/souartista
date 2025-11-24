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
import { Textarea } from '@/components/ui/textarea';
import { Bell, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Venue {
  id: string;
  name: string;
  address: string | null;
  owner_uid: string;
}

const MusicianVenues = () => {
  const { user, userData, userRole } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  useEffect(() => {
    fetchVenues();
  }, [user]);

  const fetchVenues = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('musician_venues')
        .select('*')
        .eq('owner_uid', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setVenues(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar locais');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const venueData = {
        name: formData.name,
        address: formData.address || null,
        owner_uid: user.id,
      };

      if (editingVenue) {
        const { error } = await supabase
          .from('musician_venues')
          .update(venueData)
          .eq('id', editingVenue.id);

        if (error) throw error;
        toast.success('Local atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('musician_venues')
          .insert(venueData);

        if (error) throw error;
        toast.success('Local cadastrado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchVenues();
    } catch (error: any) {
      toast.error('Erro ao salvar local');
      console.error(error);
    }
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      address: venue.address || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;

    try {
      const { error } = await supabase
        .from('musician_venues')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Local excluído com sucesso!');
      fetchVenues();
    } catch (error: any) {
      toast.error('Erro ao excluir local');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '' });
    setEditingVenue(null);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <MusicianSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-black">Locais e Bares</h1>
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
                <h2 className="text-2xl font-bold text-gray-900">Meus Locais</h2>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Local
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingVenue ? 'Editar Local' : 'Adicionar Local'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Local</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Bar do João, Casa de Shows..."
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Endereço (opcional)</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Rua, número, bairro, cidade..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingVenue ? 'Atualizar' : 'Adicionar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : venues.length === 0 ? (
                <Card className="p-8 text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Nenhum local cadastrado</h3>
                  <p className="text-gray-600 mb-4">
                    Adicione os locais onde você trabalha para facilitar o cadastro de freelas.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {venues.map((venue) => (
                    <Card key={venue.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{venue.name}</h3>
                            {venue.address && (
                              <p className="text-sm text-gray-600">{venue.address}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(venue)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(venue.id)}
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

export default MusicianVenues;
