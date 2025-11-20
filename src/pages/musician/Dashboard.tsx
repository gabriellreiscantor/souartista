import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarIcon, Music, Loader2, Bell, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const MusicianDashboard = () => {
  const { userData, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedWeek, setSelectedWeek] = useState("Semana Atual");

  useEffect(() => {
    if (loading) return;
    
    if (!userRole || userRole !== 'musician') {
      navigate('/app');
    }
  }, [userRole, loading, navigate]);

  const monthlyData = [
    { month: 'jan', receita: 0, despesa: 0 },
    { month: 'fev', receita: 0, despesa: 0 },
    { month: 'mar', receita: 0, despesa: 0 },
    { month: 'abr', receita: 0, despesa: 0 },
    { month: 'mai', receita: 0, despesa: 0 },
    { month: 'jun', receita: 0, despesa: 0 },
    { month: 'jul', receita: 0, despesa: 0 },
    { month: 'ago', receita: 2800, despesa: 800 },
    { month: 'set', receita: 1500, despesa: 500 },
    { month: 'out', receita: 1800, despesa: 600 },
    { month: 'nov', receita: 3200, despesa: 900 },
    { month: 'dez', receita: 0, despesa: 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <MusicianSidebar />
        
        <div className="flex-1 flex flex-col">
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

          <main className="flex-1 p-6 overflow-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">
                Olá, {userData?.name}! 👋
              </h2>
              <p className="text-gray-600">
                Gerencie seus freelas e cachês em um só lugar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Music className="w-6 h-6" />}
                title="Próximos Shows"
                value="0"
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
              />
              <StatCard
                title="Cachê Total"
                value="R$ 0,00"
                valueColor="text-green-600"
              />
              <StatCard
                title="Artistas"
                value="0"
                valueColor="text-blue-600"
              />
              <StatCard
                title="Despesas"
                value="R$ 0,00"
                valueColor="text-red-600"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cachês Mensais</h3>
                    <p className="text-sm text-gray-600">Receitas e despesas por mês</p>
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
                          receita: 'Cachê',
                          despesa: 'Despesa'
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 bg-white border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Próximos Shows</h3>
                <p className="text-sm text-gray-600 mb-4">Seus próximos eventos agendados.</p>
                
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhum show agendado</p>
                </div>
              </Card>
            </div>

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
                  { day: 'QUI', date: '20/11' },
                  { day: 'SEX', date: '21/11' },
                  { day: 'SAB', date: '22/11' },
                ].map((item) => (
                  <div
                    key={item.day}
                    className="p-3 rounded-lg border bg-gray-50 border-gray-200 text-center min-h-[100px]"
                  >
                    <div className="text-xs font-medium mb-1 text-gray-600">
                      {item.day}
                    </div>
                    <div className="text-xs text-gray-500">{item.date}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Clique em um dia com eventos para ver os detalhes.
              </div>

              <div className="grid grid-cols-3 gap-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Cachê (Semanal)</p>
                  <p className="text-2xl font-bold text-green-600">R$ 0,00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Despesas (Semanal)</p>
                  <p className="text-2xl font-bold text-red-600">R$ 0,00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Líquido (Semanal)</p>
                  <p className="text-2xl font-bold text-blue-600">R$ 0,00</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl p-8 border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Organize seus freelas
                </h3>
                <p className="text-gray-600">
                  Adicione seus shows, cadastre os artistas com quem trabalha e 
                  tenha controle total dos seus ganhos.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <Button>Adicionar Show</Button>
                  <Button variant="outline">Cadastrar Artista</Button>
                </div>
              </div>
            </Card>
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

export default MusicianDashboard;
