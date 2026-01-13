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

const categoryConfig: Record<ExpenseCategory, { label: string; icon: React.ElementType; color: string; bgLight: string }> = {
  equipamento: { label: 'Equipamento', icon: Guitar, color: 'bg-blue-500', bgLight: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  acessorio: { label: 'Acessório', icon: Music, color: 'bg-purple-500', bgLight: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  manutencao: { label: 'Manutenção', icon: Wrench, color: 'bg-orange-500', bgLight: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  vestuario: { label: 'Vestuário', icon: Shirt, color: 'bg-pink-500', bgLight: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'bg-green-500', bgLight: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  formacao: { label: 'Formação', icon: GraduationCap, color: 'bg-yellow-500', bgLight: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' },
  software: { label: 'Software', icon: Monitor, color: 'bg-cyan-500', bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
  outros: { label: 'Outros', icon: Package, color: 'bg-gray-500', bgLight: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
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
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3"><CardTitle className="text-lg text-gray-900">Categoria</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {(Object.keys(categoryConfig) as ExpenseCategory[]).map((cat) => {
                      const config = categoryConfig[cat];
                      const Icon = config.icon;
                      const isSelected = selectedCategory === cat;
                      return (
                        <button key={cat} className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border transition-all ${isSelected ? `${config.color} text-white font-medium shadow-md` : config.bgLight}`} onClick={() => setSelectedCategory(cat)}>
                          <Icon className="h-5 w-5" /><span className="text-xs">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3"><CardTitle className="text-lg text-gray-900 flex items-center gap-2"><CategoryIcon className="h-5 w-5" />Adicionar {categoryConfig[selectedCategory].label}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-gray-900 font-medium">Descrição</Label><Input placeholder="Ex: Jogo de cordas" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white border-gray-300 text-gray-900" /></div>
                    <div className="space-y-2"><Label className="text-gray-900 font-medium">Valor (R$)</Label><Input placeholder="0,00" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-white border-gray-300 text-gray-900" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-gray-900 font-medium">Data</Label><Input type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="bg-white border-gray-300 text-gray-900" /></div>
                    <div className="space-y-2"><Label className="text-gray-900 font-medium">Associar ao Show (Opcional)</Label><Select defaultValue="none"><SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-semibold text-gray-900">Total do Mês: <span className="text-purple-600">{formatCurrency(totalMonth)}</span></div>
                    <Button onClick={handleAction} className="gap-2 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4" />Salvar Despesa</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2"><Calendar className="h-5 w-5" />Histórico</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="bg-white border-gray-300 hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></Button>
                      <span className="min-w-[120px] text-center font-medium text-gray-900">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                      <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="bg-white border-gray-300 hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {demoExpenses.map((expense) => {
                      const config = categoryConfig[expense.category];
                      const Icon = config.icon;
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${config.color} text-white`}><Icon className="h-4 w-4" /></div>
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