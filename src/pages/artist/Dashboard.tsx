import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useArtistStats } from '@/hooks/useArtistStats';
import { useMonthlyData } from '@/hooks/useMonthlyData';
import { useUpcomingShows } from '@/hooks/useUpcomingShows';
import { useLocomotionData } from '@/hooks/useLocomotionData';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Loader2, Bell, Car, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UserMenu } from '@/components/UserMenu';
import { PeriodFilter } from '@/components/PeriodFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ArtistDashboard = () => {
  const { userData, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState("2025");

  const stats = useArtistStats(selectedPeriod);
  const { data: monthlyData } = useMonthlyData(selectedYear, userRole);
  const { shows: upcomingShows } = useUpcomingShows(userRole, 5);
  const { data: locomotionData, totalCost: locomotionTotal } = useLocomotionData(selectedYear);

  useEffect(() => {
    if (loading) return;
    
    if (!userRole || userRole !== 'artist') {
      navigate('/app');
    }
  }, [userRole, loading, navigate]);

  if (loading || stats.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
                <Bell className="w-5 h-5 text-gray-900" />
              </Button>
              <UserMenu userName={userData?.name} userRole={userRole} />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="p-4 md:p-6">
              {/* Greeting Section */}
              <div className="mb-6 md:mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
                  Olá, meu artista {userData?.name}! 👋
                </h2>
                <p className="text-sm md:text-base text-gray-600 mb-4">
                  Aqui está um resumo rápido do seu progresso.
                </p>
              
                <PeriodFilter 
                  value={selectedPeriod} 
                  onChange={setSelectedPeriod}
                  className="mx-auto"
                />
              </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <StatCard
                icon={<Music className="w-6 h-6" />}
                title="Total de Shows"
                value={stats.totalShows.toString()}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
              />
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                title="Receita Bruta (Total)"
                value={formatCurrency(stats.grossRevenue)}
                iconBg="bg-green-100"
                iconColor="text-green-600"
                valueColor="text-green-600"
              />
              <StatCard
                icon={<TrendingDown className="w-6 h-6" />}
                title="Custos Totais"
                value={formatCurrency(stats.totalCosts)}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                valueColor="text-red-600"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Lucro Líquido (Total)"
                value={formatCurrency(stats.netProfit)}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                valueColor="text-blue-600"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
              {/* Upcoming Shows */}
              <Card className="p-4 md:p-6 bg-white border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Próximos Shows</h3>
                <p className="text-sm text-gray-600 mb-4">Seus próximos eventos agendados.</p>
                
                {upcomingShows.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum show agendado</p>
                    <p className="text-xs mt-2">Adicione seus shows para começar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingShows.map((show) => (
                      <div key={show.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-900">{show.venue_name}</p>
                        <p className="text-sm text-gray-600">
                          {format(parseISO(show.date_local), "dd/MM/yyyy", { locale: ptBR })}
                          {show.time_local && ` - ${show.time_local}`}
                        </p>
                        <p className="text-sm font-medium text-green-600 mt-1">
                          {formatCurrency(show.fee)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Monthly Cash Flow Chart */}
              <Card className="lg:col-span-2 p-4 md:p-6 bg-white border border-gray-200">
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
                {monthlyData.every(m => m.receita === 0 && m.despesa === 0) ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhum dado financeiro para {selectedYear}</p>
                      <p className="text-xs mt-1">Adicione shows para visualizar o gráfico</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Legend 
                        iconType="circle"
                        formatter={(value) => {
                          const labels: Record<string, string> = {
                            receita: 'Receita',
                            despesa: 'Despesa',
                            lucro: 'Lucro'
                          };
                          return labels[value] || value;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="receita" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#22c55e', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="despesa" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#ef4444', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lucro" 
                        stroke="#a855f7" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#a855f7', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* Weekly Schedule */}
            <div className="mb-4 md:mb-6">
              <WeeklySchedule userRole="artist" />
            </div>

            {/* Transportation Expenses */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Despesas com Locomoção</h3>
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="p-6 bg-white border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm text-gray-600">Despesas com Locomoção</h4>
                    <Car className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(locomotionTotal)}</p>
                </Card>

                <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Locomoção por Mês</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={locomotionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#eab308" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 7, fill: '#eab308', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
            </div>
          </main>
        </div>
        
        <MobileBottomNav role="artist" />
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
