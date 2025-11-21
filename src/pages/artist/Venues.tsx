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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { brazilStates, citiesByState } from '@/data/brazilLocations';

interface Venue {
  id: string;
  name: string;
  address: string | null;
  owner_uid: string;
}

interface VenueFormData {
  name: string;
  state: string;
  city: string;
  customCity: string;
}

const ArtistVenues = () => {
  const { user, userData, userRole } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    state: '',
    city: '',
    customCity: '',
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    fetchVenues();
  }, [user]);

  const fetchVenues = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('venues')
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

    const finalCity = formData.city === 'Outro (digitar)' ? formData.customCity : formData.city;
    const stateLabel = brazilStates.find(s => s.value === formData.state)?.value || '';
    const address = finalCity && stateLabel ? `${finalCity}, ${stateLabel}` : null;

    try {
      const venueData = {
        name: formData.name,
        address: address,
        owner_uid: user.id,
      };

      if (editingVenue) {
        const { error } = await supabase
          .from('venues')
          .update(venueData)
          .eq('id', editingVenue.id);

        if (error) throw error;
        toast.success('Local atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('venues')
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
    
    // Parse address to extract city and state
    let city = '';
    let state = '';
    let customCity = '';
    
    if (venue.address) {
      const parts = venue.address.split(', ');
      if (parts.length === 2) {
        city = parts[0];
        state = parts[1];
        
        // Check if city is in the state's list
        const stateData = brazilStates.find(s => s.value === state);
        if (stateData) {
          const cities = citiesByState[state] || [];
          if (!cities.includes(city)) {
            customCity = city;
            city = 'Outro (digitar)';
          }
        }
      }
    }
    
    setFormData({
      name: venue.name,
      state: state,
      city: city,
      customCity: customCity,
    });
    
    if (state) {
      setAvailableCities(citiesByState[state] || []);
    }
    
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;

    try {
      const { error } = await supabase
        .from('venues')
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
    setFormData({ name: '', state: '', city: '', customCity: '' });
    setAvailableCities([]);
    setEditingVenue(null);
  };

  const handleStateChange = (value: string) => {
    setFormData({ ...formData, state: value, city: '', customCity: '' });
    setAvailableCities(citiesByState[value] || []);
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
              <h1 className="text-xl font-semibold text-gray-900">Locais e Bares</h1>
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
                  <h2 className="text-2xl font-bold text-gray-900">Meus Locais</h2>
                  <p className="text-gray-600">Gerencie os locais onde você realiza shows</p>
                </div>
                
                <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Local
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white text-gray-900 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 text-xl font-semibold">
                        {editingVenue ? 'Editar Local/Bar' : 'Adicionar Novo Local/Bar'}
                      </DialogTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Cadastre um local fixo para selecioná-lo facilmente ao agendar shows.
                      </p>
                      <p className="text-xs text-gray-500 italic mt-1">
                        (Caso for um particular, adicione pela aba "Agenda de Shows".)
                      </p>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-900 font-medium">Nome do Local/Bar</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Bar do Zé"
                          required
                          className="mt-1.5 bg-[#2d1b4e] border-[#2d1b4e] text-white placeholder:text-white/60"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="state" className="text-gray-900 font-medium">Estado</Label>
                          <Select value={formData.state} onValueChange={handleStateChange} required>
                            <SelectTrigger id="state" className="mt-1.5 bg-[#2d1b4e] border-[#2d1b4e] text-white">
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent className="bg-white max-h-[200px]">
                              {brazilStates.map((state) => (
                                <SelectItem key={state.value} value={state.value} className="text-gray-900">
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="city" className="text-gray-900 font-medium">Cidade</Label>
                          <Select 
                            value={formData.city} 
                            onValueChange={(value) => setFormData({ ...formData, city: value, customCity: '' })}
                            disabled={!formData.state}
                            required
                          >
                            <SelectTrigger id="city" className="mt-1.5 bg-[#2d1b4e] border-[#2d1b4e] text-white">
                              <SelectValue placeholder="Escolha um estado" />
                            </SelectTrigger>
                            <SelectContent className="bg-white max-h-[200px]">
                              {availableCities.map((city) => (
                                <SelectItem key={city} value={city} className="text-gray-900">
                                  {city}
                                </SelectItem>
                              ))}
                              <SelectItem value="Outro (digitar)" className="text-gray-900">Outro (digitar)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {formData.city === 'Outro (digitar)' && (
                        <div>
                          <Label htmlFor="customCity" className="text-gray-900 font-medium">Qual cidade?</Label>
                          <Input
                            id="customCity"
                            value={formData.customCity}
                            onChange={(e) => setFormData({ ...formData, customCity: e.target.value })}
                            placeholder="Digite o nome da cidade"
                            required
                            className="mt-1.5 bg-[#2d1b4e] border-[#2d1b4e] text-white placeholder:text-white/60"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDialogClose(false)}
                          className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-primary text-white hover:bg-primary/90">
                          Salvar Local
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Carregando...</p>
                </div>
              ) : venues.length === 0 ? (
                <Card className="p-8 text-center bg-white border border-gray-200">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum local cadastrado</p>
                  <p className="text-sm text-gray-400">
                    Adicione os locais onde você costuma fazer shows
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {venues.map((venue) => (
                    <Card key={venue.id} className="p-4 bg-white border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                            {venue.address && (
                              <p className="text-sm text-gray-600">{venue.address}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(venue)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
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
        </div>
        
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistVenues;
