import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Music2 } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { instruments } from '@/data/brazilLocations';

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
    customInstrument: '',
    default_fee: '',
  });
  const [isFreelancer, setIsFreelancer] = useState(false);
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [musicianToDelete, setMusicianToDelete] = useState<string | null>(null);

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

    const finalInstrument = formData.instrument === 'Outro...' ? formData.customInstrument : formData.instrument;

    try {
      const musicianData = {
        name: isFreelancer ? 'Freelancer' : formData.name,
        instrument: finalInstrument,
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
    const isFreelancerEdit = musician.name === 'Freelancer';
    setIsFreelancer(isFreelancerEdit);
    
    // Check if instrument is in predefined list
    const isCustomInstrument = !instruments.slice(0, -1).includes(musician.instrument);
    
    setFormData({
      name: musician.name,
      instrument: isCustomInstrument ? 'Outro...' : musician.instrument,
      customInstrument: isCustomInstrument ? musician.instrument : '',
      default_fee: musician.default_fee.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMusicianToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!musicianToDelete) return;

    try {
      const { error } = await supabase
        .from('musicians')
        .delete()
        .eq('id', musicianToDelete);

      if (error) throw error;
      toast.success('Músico excluído com sucesso!');
      fetchMusicians();
    } catch (error: any) {
      toast.error('Erro ao excluir músico');
      console.error(error);
    } finally {
      setDeleteConfirmOpen(false);
      setMusicianToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', instrument: '', customInstrument: '', default_fee: '' });
    setIsFreelancer(false);
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
            
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole={userRole} photoUrl={userData?.photo_url} />
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
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
                  <DialogContent className="bg-white max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMusician ? 'Editar Membro' : 'Adicionar Novo Membro'}
                      </DialogTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Preencha os detalhes do membro da sua equipe.
                      </p>
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant={isFreelancer ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setIsFreelancer(!isFreelancer);
                            if (!isFreelancer) {
                              setFormData({ ...formData, name: 'Freelancer' });
                            } else {
                              setFormData({ ...formData, name: '' });
                            }
                          }}
                        >
                          {isFreelancer ? 'Desmarcar Freelancer' : 'Marcar como Freelancer'}
                        </Button>
                      </div>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Membro</Label>
                        <Input
                          id="name"
                          value={isFreelancer ? 'Freelancer' : formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: João da Silva"
                          required
                          disabled={isFreelancer}
                          className={isFreelancer ? 'bg-gray-100' : ''}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="instrument">Função / Instrumento</Label>
                        <Select 
                          value={formData.instrument} 
                          onValueChange={(value) => setFormData({ ...formData, instrument: value, customInstrument: '' })}
                          required
                        >
                          <SelectTrigger id="instrument">
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                          <SelectContent className="bg-white max-h-[200px]">
                            {instruments.map((instrument) => (
                              <SelectItem key={instrument} value={instrument}>
                                {instrument}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.instrument === 'Outro...' && (
                        <div>
                          <Label htmlFor="customInstrument">Qual função?</Label>
                          <Input
                            id="customInstrument"
                            value={formData.customInstrument}
                            onChange={(e) => setFormData({ ...formData, customInstrument: e.target.value })}
                            placeholder="Digite a função/instrumento"
                            required
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="default_fee">Cachê Padrão</Label>
                        <CurrencyInput
                          id="default_fee"
                          value={formData.default_fee}
                          onChange={(value) => setFormData({ ...formData, default_fee: value })}
                          required
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDialogClose(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                          Salvar
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
                            className="border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(musician.id)}
                            className="border-red-200 bg-red-50 hover:bg-red-100"
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
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 text-lg font-semibold">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Deseja excluir <span className="font-semibold text-gray-900">{musicians.find(m => m.id === musicianToDelete)?.name}</span> da sua equipe?
              <br />
              <span className="text-sm text-gray-500">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white border-0">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default ArtistMusicians;
