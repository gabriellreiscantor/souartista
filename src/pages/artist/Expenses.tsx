import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Guitar, Music, Wrench, Shirt, Megaphone, GraduationCap, 
  Monitor, Package, Trash2, ChevronLeft, ChevronRight, Calendar,
  Receipt, Plus
} from 'lucide-react';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';

type ExpenseCategory = 'equipamento' | 'acessorio' | 'manutencao' | 'vestuario' | 'marketing' | 'formacao' | 'software' | 'outros';

interface AdditionalExpense {
  id: string;
  uid: string;
  category: ExpenseCategory;
  description: string;
  cost: number;
  expense_date: string;
  show_id: string | null;
  created_at: string;
}

const categoryConfig: Record<ExpenseCategory, { label: string; icon: React.ElementType; color: string }> = {
  equipamento: { label: 'Equipamento', icon: Guitar, color: 'bg-blue-500' },
  acessorio: { label: 'Acessório', icon: Music, color: 'bg-purple-500' },
  manutencao: { label: 'Manutenção', icon: Wrench, color: 'bg-orange-500' },
  vestuario: { label: 'Vestuário', icon: Shirt, color: 'bg-pink-500' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'bg-green-500' },
  formacao: { label: 'Formação', icon: GraduationCap, color: 'bg-yellow-500' },
  software: { label: 'Software', icon: Monitor, color: 'bg-cyan-500' },
  outros: { label: 'Outros', icon: Package, color: 'bg-gray-500' },
};

export default function ArtistExpenses() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('equipamento');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  // Fetch expenses for current month
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['additional-expenses', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('additional_expenses')
        .select('*')
        .eq('uid', user.id)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data as AdditionalExpense[];
    },
    enabled: !!user,
  });

  // Fetch shows for optional association
  const { data: shows = [] } = useQuery({
    queryKey: ['shows-for-expenses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('shows')
        .select('id, venue_name, date_local')
        .eq('uid', user.id)
        .gte('date_local', format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
        .order('date_local', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      const costValue = parseFloat(cost.replace(',', '.'));
      if (isNaN(costValue) || costValue <= 0) throw new Error('Valor inválido');
      if (!description.trim()) throw new Error('Descrição obrigatória');

      const { error } = await supabase
        .from('additional_expenses')
        .insert({
          uid: user.id,
          category: selectedCategory,
          description: description.trim(),
          cost: costValue,
          expense_date: expenseDate,
          show_id: selectedShowId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['artist-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      toast.success('Despesa adicionada!');
      setDescription('');
      setCost('');
      setSelectedShowId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('additional_expenses')
        .delete()
        .eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['artist-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      toast.success('Despesa removida!');
    },
    onError: () => {
      toast.error('Erro ao remover despesa');
    },
  });

  const totalMonth = expenses.reduce((sum, exp) => sum + Number(exp.cost), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const CategoryIcon = categoryConfig[selectedCategory].icon;

  return (
    <SafeAreaWrapper>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <ArtistSidebar />
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6" />
                Despesas Adicionais
              </h1>
              <UserMenu />
            </div>

            <div className="grid gap-6 max-w-4xl">
              {/* Category Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {(Object.keys(categoryConfig) as ExpenseCategory[]).map((cat) => {
                      const config = categoryConfig[cat];
                      const Icon = config.icon;
                      const isSelected = selectedCategory === cat;
                      return (
                        <Button
                          key={cat}
                          variant={isSelected ? "default" : "outline"}
                          className={`flex flex-col items-center gap-1 h-auto py-3 ${isSelected ? config.color : ''}`}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs">{config.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Add Expense Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5" />
                    Adicionar {categoryConfig[selectedCategory].label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        placeholder="Ex: Jogo de cordas Elixir"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">Valor (R$)</Label>
                      <Input
                        id="cost"
                        placeholder="0,00"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Associar ao Show (Opcional)</Label>
                      <Select value={selectedShowId || 'none'} onValueChange={(v) => setSelectedShowId(v === 'none' ? null : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um show" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {shows.map((show) => (
                            <SelectItem key={show.id} value={show.id}>
                              {show.venue_name} - {format(new Date(show.date_local), 'dd/MM/yyyy')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-semibold">
                      Total do Mês: {formatCurrency(totalMonth)}
                    </div>
                    <Button 
                      onClick={() => addExpenseMutation.mutate()}
                      disabled={addExpenseMutation.isPending}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Salvar Despesa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* History */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Histórico
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[120px] text-center font-medium">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                      </span>
                      <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                  ) : expenses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma despesa neste mês
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {expenses.map((expense) => {
                        const config = categoryConfig[expense.category];
                        const Icon = config.icon;
                        return (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${config.color} text-white`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{expense.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(expense.expense_date), 'dd/MM/yyyy')} • {config.label}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">{formatCurrency(expense.cost)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteExpenseMutation.mutate(expense.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
          {isMobile && <MobileBottomNav role="artist" />}
        </div>
      </SidebarProvider>
    </SafeAreaWrapper>
  );
}
