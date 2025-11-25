import { useState } from "react";
import { DemoMusicianSidebar } from "@/components/DemoMusicianSidebar";
import { DemoBanner } from "@/components/DemoBanner";
import { Card } from "@/components/ui/card";
import { Music, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { PeriodFilter } from "@/components/PeriodFilter";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { demoMusicianStats, demoMonthlyData, demoUpcomingShows, demoWeekSchedule } from "@/data/demoData";

export default function DemoMusicianDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedYear] = useState(new Date().getFullYear());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const earningsData = demoMonthlyData.months.map((month, index) => ({
    month,
    ganhos: demoMonthlyData.profit[index] * 0.6, // Simula ganhos de músico
    shows: demoMonthlyData.shows[index],
  }));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DemoMusicianSidebar />
      
      <div className="flex-1 flex flex-col">
        <DemoBanner />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Olá, João Silva! Aqui está um resumo da sua agenda.
                </p>
              </div>
              <PeriodFilter
                value={selectedPeriod}
                onChange={setSelectedPeriod}
              />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Music}
                title="Total de Shows"
                value={demoMusicianStats.totalShows.toString()}
                iconBg="bg-blue-500/10"
                iconColor="text-blue-500"
              />
              <StatCard
                icon={DollarSign}
                title="Ganhos Totais"
                value={formatCurrency(demoMusicianStats.totalEarnings)}
                iconBg="bg-green-500/10"
                iconColor="text-green-500"
              />
              <StatCard
                icon={TrendingUp}
                title="Média por Show"
                value={formatCurrency(demoMusicianStats.averagePerShow)}
                iconBg="bg-purple-500/10"
                iconColor="text-purple-500"
              />
              <StatCard
                icon={Calendar}
                title="Próximos Shows"
                value={demoMusicianStats.upcomingShows.toString()}
                iconBg="bg-orange-500/10"
                iconColor="text-orange-500"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Shows */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Próximos Shows
                </h3>
                <div className="space-y-3">
                  {demoUpcomingShows.slice(0, 5).map((show) => (
                    <div
                      key={show.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{show.venue_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(show.date_local).toLocaleDateString('pt-BR')} às {show.time_local}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(show.fee * 0.25)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Monthly Earnings Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Ganhos Mensais
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="ganhos" fill="#8b5cf6" name="Ganhos (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Weekly Schedule */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Agenda Semanal
              </h3>
              <div className="space-y-3">
                {demoWeekSchedule.map((day) => (
                  <div key={day.day} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium text-foreground">{day.day}</span>
                    <span className="text-sm text-muted-foreground">
                      {day.shows} show{day.shows !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
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

function StatCard({ icon: Icon, title, value, iconBg, iconColor, valueColor = "text-foreground" }: StatCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className={`text-2xl font-bold ${valueColor} truncate`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
