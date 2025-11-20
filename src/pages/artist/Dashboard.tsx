import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarIcon, Music, DollarSign, Users, Loader2, Bell, User as UserIcon, ChevronLeft, ChevronRight, Car } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ArtistDashboard = () => {
  const { userData, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedWeek, setSelectedWeek] = useState("Semana Atual");

  useEffect(() => {
    if (loading) return;
    
    if (!userRole || userRole !== 'artist') {
      navigate('/app');
    }
  }, [userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mock data para os gráficos
  const monthlyData = [
    { month: 'jan', receita: 0, despesa: 0, lucro: 0 },
    { month: 'fev', receita: 0, despesa: 0, lucro: 0 },
    { month: 'mar', receita: 0, despesa: 0, lucro: 0 },
    { month: 'abr', receita: 0, despesa: 0, lucro: 0 },
    { month: 'mai', receita: 0, despesa: 0, lucro: 0 },
    { month: 'jun', receita: 0, despesa: 0, lucro: 0 },
    { month: 'jul', receita: 0, despesa: 0, lucro: 0 },
    { month: 'ago', receita: 3400, despesa: 1600, lucro: 1800 },
    { month: 'set', receita: 1800, despesa: 800, lucro: 1000 },
    { month: 'out', receita: 2300, despesa: 1300, lucro: 1000 },
    { month: 'nov', receita: 5100, despesa: 2600, lucro: 2500 },
    { month: 'dez', receita: 0, despesa: 0, lucro: 0 },
  ];

  const locomotionData = [
    { month: 'set', value: 0 },
    { month: 'out', value: 0 },
    { month: 'nov', value: 0 },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full bg-purple-100">
                <UserIcon className="w-5 h-5 text-purple-600" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {/* Greeting Section */}
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">
                Olá, Artista!
              </h2>
              <p className="text-gray-600 mb-4">
                Aqui está um resumo rápido do seu progresso.
              </p>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal bg-white text-gray-900 border-gray-300",
                      !date && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-600" />
                    {date ? format(date, "MMMM 'de' yyyy", { locale: ptBR }) : "novembro de 2025"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-gray-300" align="center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    variant="light"
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Music className="w-6 h-6" />}
                title="Total de Shows"
                value="4"
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
              />
              <StatCard
                title="Receita Bruta (Total)"
                value="R$ 7.400,00"
                valueColor="text-green-600"
              />
              <StatCard
                title="Custos Totais"
                value="R$ 2.600,00"
                valueColor="text-red-600"
              />
              <StatCard
                title="Lucro Líquido (Total)"
                value="R$ 4.800,00"
                valueColor="text-blue-600"
              />
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              {/* Monthly Cash Flow Chart */}
              <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Fluxo de Caixa Mensal</h3>
                  <p className="text-sm text-gray-600">Receitas, despesas e lucro por mês</p>
                </div>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px] bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 text-gray-900">
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Legend 
                      iconType="square"
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          receita: 'Receita',
                          despesa: 'Despesa',
                          lucro: 'Lucro'
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lucro" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Upcoming Shows */}
              <Card className="p-6 bg-white border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Próximos Shows</h3>
                <p className="text-sm text-gray-600 mb-4">Seus 3 próximos eventos agendados.</p>
                
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex flex-col items-center justify-center bg-purple-500 text-white rounded-lg px-3 py-2 min-w-[60px]">
                      <span className="text-xs font-medium">NOV</span>
                      <span className="text-2xl font-bold">27</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Ressaca Bar</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        05:02h
                      </p>
                      <p className="text-sm font-semibold text-green-600 mt-1">R$ 2.200,00</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Weekly Schedule */}
            <Card className="p-6 bg-white border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Agenda da Semana</h3>
                  <p className="text-sm text-gray-600">De 16/11 a 22/11</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-300">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger className="w-[150px] bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 text-gray-900">
                      <SelectItem value="Semana Atual">Semana Atual</SelectItem>
                      <SelectItem value="Próxima Semana">Próxima Semana</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-300">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {[
                  { day: 'DOM', date: '16/11' },
                  { day: 'SEG', date: '17/11' },
                  { day: 'TER', date: '18/11' },
                  { day: 'QUA', date: '19/11' },
                  { day: 'QUI', date: '20/11', event: 'Casament...', highlight: true },
                  { day: 'SEX', date: '21/11' },
                  { day: 'SAB', date: '22/11' },
                ].map((item) => (
                  <div
                    key={item.day}
                    className={cn(
                      "p-3 rounded-lg border text-center min-h-[100px]",
                      item.highlight 
                        ? "bg-purple-50 border-purple-200" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-medium mb-1",
                      item.highlight ? "text-purple-600" : "text-gray-600"
                    )}>
                      {item.day}
                    </div>
                    <div className="text-xs text-gray-500">{item.date}</div>
                    {item.event && (
                      <div className="mt-2 text-xs font-medium text-purple-600 flex items-center justify-center gap-1">
                        <Music className="w-3 h-3" />
                        {item.event}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Clique em um dia com eventos para ver os detalhes.
              </div>

              <div className="grid grid-cols-3 gap-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Receita Bruta (Semanal)</p>
                  <p className="text-2xl font-bold text-green-600">R$ 1.500,00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Despesas (Semanal)</p>
                  <p className="text-2xl font-bold text-red-600">R$ 330,00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Lucro (Semanal)</p>
                  <p className="text-2xl font-bold text-blue-600">R$ 1.170,00</p>
                </div>
              </div>
            </Card>

            {/* Transportation Expenses */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Despesas com Locomoção</h3>
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="p-6 bg-white border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm text-gray-600">Despesas com Locomoção</h4>
                    <Car className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">R$ 0,00</p>
                </Card>

                <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Locomoção por Mês</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={locomotionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#eab308" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const StatCard = ({ 
  icon, 
  title, 
  value, 
  iconBg,
  iconColor,
  valueColor
}: { 
  icon?: React.ReactNode; 
  title: string; 
  value: string;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
}) => {
  return (
    <Card className="rounded-lg p-4 bg-white border-2 border-purple-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        {icon && (
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg, iconColor)}>
            {icon}
          </div>
        )}
      </div>
      <p className={cn("text-2xl font-bold", valueColor || "text-gray-900")}>{value}</p>
    </Card>
  );
};

export default ArtistDashboard;
