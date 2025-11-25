import { useState } from "react";
import { DemoArtistSidebar } from "@/components/DemoArtistSidebar";
import { DemoBanner } from "@/components/DemoBanner";
import { Card } from "@/components/ui/card";
import { Music, DollarSign, TrendingUp, Calendar, Truck } from "lucide-react";
import { PeriodFilter } from "@/components/PeriodFilter";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { demoArtistStats, demoMonthlyData, demoUpcomingShows, demoLocomotionData, demoWeekSchedule } from "@/data/demoData";

export default function DemoArtistDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedYear] = useState(new Date().getFullYear());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const chartData = demoMonthlyData.months.map((month, index) => ({
    month,
    receita: demoMonthlyData.revenue[index],
    custos: demoMonthlyData.costs[index],
    lucro: demoMonthlyData.profit[index],
  }));

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <DemoArtistSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <DemoBanner />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Olá, João Silva! Aqui está um resumo da sua carreira.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <PeriodFilter
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  className="w-full md:w-auto"
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <StatCard
                icon={Music}
                title="Total de Shows"
                value={demoArtistStats.totalShows.toString()}
                iconBg="bg-blue-500/10"
                iconColor="text-blue-500"
              />
              <StatCard
                icon={DollarSign}
                title="Receita Total"
                value={formatCurrency(demoArtistStats.totalRevenue)}
                iconBg="bg-green-500/10"
                iconColor="text-green-500"
              />
              <StatCard
                icon={TrendingUp}
                title="Lucro Líquido"
                value={formatCurrency(demoArtistStats.netProfit)}
                iconBg="bg-purple-500/10"
                iconColor="text-purple-500"
                valueColor="text-purple-600"
              />
              <StatCard
                icon={Calendar}
                title="Próximos Shows"
                value={demoArtistStats.upcomingShows.toString()}
                iconBg="bg-orange-500/10"
                iconColor="text-orange-500"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Upcoming Shows */}
              <Card className="p-4 md:p-6 bg-white border-gray-200">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Próximos Shows
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {demoUpcomingShows.map((show) => (
                    <div
                      key={show.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm md:text-base">{show.venue_name}</p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {new Date(show.date_local).toLocaleDateString('pt-BR')} às {show.time_local}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-green-600 text-sm md:text-base whitespace-nowrap">{formatCurrency(show.fee)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Monthly Cash Flow Chart */}
              <Card className="p-4 md:p-6 bg-white border-gray-200">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 text-gray-900">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Fluxo de Caixa Mensal
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" className="text-xs" stroke="#6b7280" />
                    <YAxis className="text-xs" stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: '#111827'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita" />
                    <Line type="monotone" dataKey="custos" stroke="#ef4444" strokeWidth={2} name="Custos" />
                    <Line type="monotone" dataKey="lucro" stroke="#8b5cf6" strokeWidth={2} name="Lucro" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Weekly Schedule & Transportation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 bg-white border-gray-200">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Agenda Semanal
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {demoWeekSchedule.map((day) => (
                    <div key={day.day} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="font-medium text-gray-900 text-sm md:text-base">{day.day}</span>
                      <span className="text-xs md:text-sm text-gray-600">
                        {day.shows} show{day.shows !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 md:p-6 bg-white border-gray-200">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 text-gray-900">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Gastos com Locomoção
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {demoLocomotionData.slice(0, 5).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 capitalize text-sm md:text-base">{expense.type}</p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {new Date(expense.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p className="font-semibold text-red-600 text-sm md:text-base whitespace-nowrap ml-2">{formatCurrency(expense.cost)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

function StatCard({ icon: Icon, title, value, iconBg, iconColor, valueColor = "text-gray-900" }: StatCardProps) {
  return (
    <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow bg-white border-gray-200">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm text-gray-600 truncate">{title}</p>
          <p className={`text-lg md:text-2xl font-bold ${valueColor} truncate`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
