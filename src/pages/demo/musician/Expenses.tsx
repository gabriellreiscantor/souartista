import { useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DemoMusicianSidebar } from '@/components/DemoMusicianSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { DemoLockedModal } from '@/components/DemoLockedModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Guitar, Music, Wrench, Shirt, Megaphone, GraduationCap, 
  Monitor, Package, Trash2, ChevronLeft, ChevronRight, Calendar,
  Receipt, Plus
} from 'lucide-react';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';

type ExpenseCategory = 'equipamento' | 'acessorio' | 'manutencao' | 'vestuario' | 'marketing' | 'formacao' | 'software' | 'outros';

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

const demoExpenses = [
  { id: '1', category: 'acessorio' as ExpenseCategory, description: 'Palhetas Dunlop (12un)', cost: 35.00, expense_date: '2026-01-12' },
  { id: '2', category: 'equipamento' as ExpenseCategory, description: 'Pedal de distorção Boss', cost: 450.00, expense_date: '2026-01-09' },
  { id: '3', category: 'formacao' as ExpenseCategory, description: 'Curso de teoria musical', cost: 120.00, expense_date: '2026-01-05' },
  { id: '4', category: 'acessorio' as ExpenseCategory, description: 'Cabo P10 3m', cost: 25.00, expense_date: '2026-01-02' },
];

export default function DemoMusicianExpenses() {
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('equipamento');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [showLockedModal, setShowLockedModal] = useState(false);

  const totalMonth = demoExpenses.reduce((sum, exp) => sum + exp.cost, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const CategoryIcon = categoryConfig[selectedCategory].icon;

  const handleAction = () => {
    setShowLockedModal(true);
  };

  return (
    <SafeAreaWrapper>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <DemoMusicianSidebar />
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
            <DemoBanner />
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6" />
                Despesas Adicionais
              </h1>
              <DemoUserMenu />
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
                      <Input id="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Associar ao Show (Opcional)</Label>
                      <Select defaultValue="none">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um show" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          <SelectItem value="1">Bar do João - 15/01/2026</SelectItem>
                          <SelectItem value="2">Restaurante Sabor - 20/01/2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-semibold">
                      Total do Mês: {formatCurrency(totalMonth)}
                    </div>
                    <Button onClick={handleAction} className="gap-2">
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
                  <div className="space-y-2">
                    {demoExpenses.map((expense) => {
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
                              onClick={handleAction}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          {isMobile && <DemoMobileBottomNav role="musician" />}
        </div>
        <DemoLockedModal open={showLockedModal} onOpenChange={setShowLockedModal} />
      </SidebarProvider>
    </SafeAreaWrapper>
  );
}
