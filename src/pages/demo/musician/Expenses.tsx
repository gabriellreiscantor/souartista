import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
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

type ExpenseCategory = 'equipamento' | 'acessorio' | 'manutencao' | 'vestuario' | 'marketing' | 'formacao' | 'software' | 'outros';

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

const demoExpenses = [
  { id: '1', category: 'acessorio' as ExpenseCategory, description: 'Palhetas Dunlop (12un)', cost: 35.00, expense_date: '2026-01-12' },
  { id: '2', category: 'equipamento' as ExpenseCategory, description: 'Pedal de distorção Boss', cost: 450.00, expense_date: '2026-01-09' },
  { id: '3', category: 'formacao' as ExpenseCategory, description: 'Curso de teoria musical', cost: 120.00, expense_date: '2026-01-05' },
];

export default function DemoMusicianExpenses() {
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('equipamento');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [showLockedModal, setShowLockedModal] = useState(false);

  const totalMonth = demoExpenses.reduce((sum, exp) => sum + exp.cost, 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const CategoryIcon = categoryConfig[selectedCategory].icon;
  const handleAction = () => setShowLockedModal(true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoMusicianSidebar />
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Despesas Adicionais
              </h1>
            </div>
            <DemoUserMenu />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Card className="bg-white border-gray-200 overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Categoria</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(Object.keys(categoryConfig) as ExpenseCategory[]).map((cat) => {
                      const config = categoryConfig[cat];
                      const Icon = config.icon;
                      const isSelected = selectedCategory === cat;
                      return (
                        <button key={cat} className={`flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-lg border transition-all ${isSelected ? 'bg-purple-600 text-white font-medium shadow-md' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`} onClick={() => setSelectedCategory(cat)}>
                          <Icon className="w-6 h-6" /><span className="text-xs">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200 overflow-hidden">
                <CardContent className="p-4 md:p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><CategoryIcon className="h-5 w-5" />Adicionar {categoryConfig[selectedCategory].label}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-gray-900 font-medium">Descrição</Label><Input placeholder={categoryConfig[selectedCategory].placeholder} value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white border-gray-300 text-gray-900" /></div>
                    <div className="space-y-2"><Label className="text-gray-900 font-medium">Valor (R$)</Label><Input placeholder="0,00" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-white border-gray-300 text-gray-900" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-gray-900 font-medium">Data</Label><Input type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="bg-white border-gray-300 text-gray-900" /></div>
                    <div className="space-y-2"><Label className="text-gray-900 font-medium">Associar ao Show (Opcional)</Label><Select defaultValue="none"><SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-semibold text-gray-900">Total do Mês: <span className="text-purple-600">{formatCurrency(totalMonth)}</span></div>
                    <Button onClick={handleAction} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"><Plus className="h-4 w-4" />Salvar Despesa</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200 overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Calendar className="h-5 w-5" />Histórico</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="bg-white border-gray-300 hover:bg-gray-50"><ChevronLeft className="h-4 w-4 text-gray-900" /></Button>
                      <span className="min-w-[100px] text-center font-medium text-gray-900 text-sm">{format(currentMonth, 'MMM yyyy', { locale: ptBR })}</span>
                      <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="bg-white border-gray-300 hover:bg-gray-50"><ChevronRight className="h-4 w-4 text-gray-900" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {demoExpenses.map((expense) => {
                      const config = categoryConfig[expense.category];
                      const Icon = config.icon;
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-600 text-white"><Icon className="h-4 w-4" /></div>
                            <div><p className="font-medium text-gray-900">{expense.description}</p><p className="text-sm text-gray-600">{format(new Date(expense.expense_date), 'dd/MM/yyyy')} • {config.label}</p></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">{formatCurrency(expense.cost)}</span>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleAction}><Trash2 className="h-4 w-4" /></Button>
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
      </div>
      <DemoLockedModal open={showLockedModal} onOpenChange={setShowLockedModal} />
    </SidebarProvider>
  );
}