import { useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { UserMenu } from '@/components/UserMenu';
import { NotificationBell } from '@/components/NotificationBell';
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

const categoryConfig: Record<ExpenseCategory, { label: string; icon: React.ElementType; placeholder: string }> = {
  equipamento: { label: 'Equipamento', icon: Guitar, placeholder: 'Violão Takamine' },
  acessorio: { label: 'Acessório', icon: Music, placeholder: 'Jogo de cordas Elixir' },
  manutencao: { label: 'Manutenção', icon: Wrench, placeholder: 'Luthier' },
  vestuario: { label: 'Vestuário', icon: Shirt, placeholder: 'Camisa jeans' },
  marketing: { label: 'Marketing', icon: Megaphone, placeholder: 'Tráfego pago para clipe' },
  formacao: { label: 'Formação', icon: GraduationCap, placeholder: 'Curso de canto' },
  software: { label: 'Software', icon: Monitor, placeholder: 'Reaper' },
  outros: { label: 'Outros', icon: Package, placeholder: 'Descrição da despesa' },
};

export default function MusicianExpenses() {
  const { user, userData } = useAuth();
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

  // Fetch shows where musician participated
  const { data: shows = [] } = useQuery({
    queryKey: ['musician-shows-for-expenses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('shows')
        .select('id, venue_name, date_local')
        .contains('team_musician_ids', [user.id])
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
      queryClient.invalidateQueries({ queryKey: ['musician-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['musician-stats'] });
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
        <div className="min-h-screen flex w-full bg-[#fafafa]">
          <MusicianSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Despesas Adicionais
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                <NotificationBell />
                <UserMenu userName={userData?.name} userRole="musician" photoUrl={userData?.photo_url} />
              </div>
            </header>

            <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Category Selection */}
                <Card className="bg-white border-gray-200 overflow-hidden">
                  <CardContent className="p-4 md:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Categoria</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(Object.keys(categoryConfig) as ExpenseCategory[]).map((cat) => {
                        const config = categoryConfig[cat];
                        const Icon = config.icon;
                        const isSelected = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            className={`flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-lg border transition-all ${
                              isSelected 
                                ? 'bg-purple-600 text-white font-medium shadow-md' 
                                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            }`}
                            onClick={() => setSelectedCategory(cat)}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs">{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Add Expense Form */}
                <Card className="bg-white border-gray-200 overflow-hidden">
                  <CardContent className="p-4 md:p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CategoryIcon className="h-5 w-5" />
                      Adicionar {categoryConfig[selectedCategory].label}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-900 font-medium">Descrição</Label>
                        <Input
                          id="description"
                          placeholder={categoryConfig[selectedCategory].placeholder}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cost" className="text-gray-900 font-medium">Valor (R$)</Label>
                        <Input
                          id="cost"
                          placeholder="0,00"
                          value={cost}
                          onChange={(e) => setCost(e.target.value)}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-gray-900 font-medium">Data</Label>
                        <Input
                          id="date"
                          type="date"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Associar ao Show (Opcional)</Label>
                        <Select value={selectedShowId || 'none'} onValueChange={(v) => setSelectedShowId(v === 'none' ? null : v)}>
                          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
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
                      <div className="text-lg font-semibold text-gray-900">
                        Total do Mês: <span className="text-purple-600">{formatCurrency(totalMonth)}</span>
                      </div>
                      <Button 
                        onClick={() => addExpenseMutation.mutate()}
                        disabled={addExpenseMutation.isPending}
                        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Salvar Despesa
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* History */}
                <Card className="bg-white border-gray-200 overflow-hidden">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Histórico
                      </h2>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                          className="bg-white border-gray-300 hover:bg-gray-50"
                        >
                          <ChevronLeft className="h-4 w-4 text-gray-900" />
                        </Button>
                        <span className="min-w-[100px] text-center font-medium text-gray-900 text-sm">
                          {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
                        </span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                          className="bg-white border-gray-300 hover:bg-gray-50"
                        >
                          <ChevronRight className="h-4 w-4 text-gray-900" />
                        </Button>
                      </div>
                    </div>
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-600">Carregando...</div>
                    ) : expenses.length === 0 ? (
                      <div className="text-center py-8 text-gray-600">
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
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-600 text-white">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{expense.description}</p>
                                  <p className="text-sm text-gray-600">
                                    {format(new Date(expense.expense_date), 'dd/MM/yyyy')} • {config.label}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-900">{formatCurrency(expense.cost)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
            {isMobile && <MobileBottomNav role="musician" />}
          </div>
        </div>
      </SidebarProvider>
    </SafeAreaWrapper>
  );
}
