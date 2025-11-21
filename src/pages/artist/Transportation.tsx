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
import { Bell, Plus, Car, Edit, Trash2, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const expenseSchema = z.object({
  type: z.enum(['uber', 'km', 'van', 'onibus', 'aviao']),
  cost: z.number().min(0, 'Custo deve ser maior ou igual a 0'),
  distance_km: z.number().optional(),
  price_per_liter: z.number().optional(),
  vehicle_consumption: z.number().optional(),
});

interface Expense {
  id: string;
  type: 'uber' | 'km' | 'van' | 'onibus' | 'aviao';
  cost: number;
  distance_km?: number;
  created_at: string;
  show_id?: string;
}

const expenseLabels = {
  uber: 'Uber/Táxi',
  km: 'Veículo Próprio (KM)',
  van: 'Van/Kombi',
  onibus: 'Ônibus',
  aviao: 'Avião',
};

const ArtistTransportation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'uber' as const,
    cost: 0,
    distance_km: undefined as number | undefined,
    price_per_liter: undefined as number | undefined,
    vehicle_consumption: undefined as number | undefined,
  });

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('locomotion_expenses')
        .select('*')
        .eq('uid', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'Erro ao carregar despesas',
        description: 'Não foi possível carregar suas despesas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = expenseSchema.parse(formData);

      const { error } = await supabase
        .from('locomotion_expenses')
        .insert([{
          type: validatedData.type,
          cost: validatedData.cost,
          distance_km: validatedData.distance_km,
          price_per_liter: validatedData.price_per_liter,
          vehicle_consumption: validatedData.vehicle_consumption,
          uid: user?.id!,
        }]);

      if (error) throw error;

      toast({
        title: 'Despesa adicionada!',
        description: 'A despesa foi cadastrada com sucesso.',
      });

      setDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Error saving expense:', error);
        toast({
          title: 'Erro ao salvar despesa',
          description: 'Não foi possível salvar a despesa.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

    try {
      const { error } = await supabase
        .from('locomotion_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Despesa excluída',
        description: 'A despesa foi removida com sucesso.',
      });
      
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Erro ao excluir despesa',
        description: 'Não foi possível excluir a despesa.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'uber',
      cost: 0,
      distance_km: undefined,
      price_per_liter: undefined,
      vehicle_consumption: undefined,
    });
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.cost, 0);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Locomoção</h1>
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
                  <h2 className="text-2xl font-bold text-gray-900">Despesas com Locomoção</h2>
                  <p className="text-gray-600">Gerencie seus gastos com transporte</p>
                </div>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Adicionar Despesa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Adicionar Despesa de Locomoção</DialogTitle>
                      <DialogDescription>
                        Registre seus gastos com transporte
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Transporte *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="uber">Uber/Táxi</SelectItem>
                            <SelectItem value="km">Veículo Próprio (KM)</SelectItem>
                            <SelectItem value="van">Van/Kombi</SelectItem>
                            <SelectItem value="onibus">Ônibus</SelectItem>
                            <SelectItem value="aviao">Avião</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cost">Custo Total (R$) *</Label>
                        <Input
                          id="cost"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      {(formData.type as string) === 'km' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="distance_km">Distância (KM)</Label>
                            <Input
                              id="distance_km"
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="0.0"
                              value={formData.distance_km || ''}
                              onChange={(e) => setFormData({ ...formData, distance_km: parseFloat(e.target.value) || undefined })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="price_per_liter">Preço por Litro (R$)</Label>
                            <Input
                              id="price_per_liter"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={formData.price_per_liter || ''}
                              onChange={(e) => setFormData({ ...formData, price_per_liter: parseFloat(e.target.value) || undefined })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vehicle_consumption">Consumo (KM/L)</Label>
                            <Input
                              id="vehicle_consumption"
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="0.0"
                              value={formData.vehicle_consumption || ''}
                              onChange={(e) => setFormData({ ...formData, vehicle_consumption: parseFloat(e.target.value) || undefined })}
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                          Adicionar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Total Gasto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">R$ {totalExpenses.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">{expenses.length} despesa(s) registrada(s)</p>
                </CardContent>
              </Card>

              {loading ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">Carregando despesas...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">Nenhuma despesa cadastrada ainda</p>
                  <p className="text-sm text-gray-400 mt-2">Clique em "Adicionar Despesa" para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <Card key={expense.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Car className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{expenseLabels[expense.type]}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(expense.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {expense.distance_km && (
                              <p className="text-xs text-gray-400">{expense.distance_km} km</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">R$ {expense.cost.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

export default ArtistTransportation;
