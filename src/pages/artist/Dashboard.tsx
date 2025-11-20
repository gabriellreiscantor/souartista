import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Music, DollarSign, Users, Loader2, Bell, User as UserIcon } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';

const ArtistDashboard = () => {
  const { userData, userRole, loading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-heading font-bold">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <UserIcon className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto bg-white">
            <div className="mb-8">
              <h2 className="text-3xl font-heading font-bold mb-2 text-gray-900">
                Olá, {userData?.name}! 👋
              </h2>
              <p className="text-gray-600">
                Bem-vindo ao seu painel de gestão profissional
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Calendar className="w-6 h-6" />}
                title="Próximos Shows"
                value="0"
                description="Este mês"
              />
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                title="Receita Total"
                value="R$ 0"
                description="Este mês"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Equipe"
                value="0"
                description="Músicos cadastrados"
              />
              <StatCard
                icon={<Music className="w-6 h-6" />}
                title="Locais"
                value="0"
                description="Bares salvos"
              />
            </div>

            <Card className="rounded-2xl p-8 border border-border bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all duration-300">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h3 className="text-2xl font-heading font-bold text-gray-900">
                  Comece a gerenciar seus shows
                </h3>
                <p className="text-gray-600">
                  Adicione seus primeiros shows, cadastre sua equipe e comece a ter controle 
                  total da sua carreira artística.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <Button>Adicionar Show</Button>
                  <Button variant="outline">Cadastrar Equipe</Button>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const StatCard = ({ icon, title, value, description }: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  description: string;
}) => {
  return (
    <Card className="rounded-xl p-6 border border-border bg-gradient-to-br from-white to-primary/5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-heading font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </Card>
  );
};

export default ArtistDashboard;
