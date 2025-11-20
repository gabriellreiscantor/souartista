import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Music, DollarSign, Users, Loader2, Bell, User as UserIcon } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';

const MusicianDashboard = () => {
  const { userData, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!userRole || userRole !== 'musician') {
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

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Calendar className="w-6 h-6" />}
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
                title="Instrumentos"
                value="0"
                valueColor="text-orange-600"
              />
            </div>

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
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${valueColor || "text-gray-900"}`}>{value}</p>
    </Card>
  );
};

export default MusicianDashboard;
