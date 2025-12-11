import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Users, DollarSign, BarChart3, Car } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';
const MusicianTutorial = () => {
  const {
    userData
  } = useAuth();
  const navigate = useNavigate();
  const tutorials = [{
    icon: Calendar,
    title: 'Ver Shows',
    description: 'Veja os shows em que você foi convidado',
    steps: ['Acesse a página "Shows" no menu lateral', 'Visualize todos os shows onde você está escalado', 'Veja detalhes como data, horário, local e seu cachê', 'Acompanhe o status de cada apresentação', 'Filtre por período para melhor organização']
  }, {
    icon: Users,
    title: 'Gerenciar Artistas',
    description: 'Veja os artistas com quem você trabalha',
    steps: ['Vá para a seção "Artistas"', 'Visualize todos os artistas que te convidaram', 'Veja o histórico de trabalhos com cada artista', 'Acompanhe seus contatos profissionais', 'Mantenha sua rede organizada']
  }, {
    icon: Car,
    title: 'Controle de Locomoção',
    description: 'Registre despesas com transporte',
    steps: ['Na página "Locomoção", clique em "Nova Despesa"', 'Escolha o tipo: Uber, Km, Van, Ônibus ou Avião', 'Para Km: informe distância, consumo e preço do combustível', 'Associe a despesa a um show específico', 'Acompanhe o total gasto em transporte']
  }, {
    icon: BarChart3,
    title: 'Relatórios Financeiros',
    description: 'Acompanhe receitas e despesas',
    steps: ['Acesse a página "Relatórios"', 'Visualize gráficos de receita e despesas', 'Filtre por período para análises específicas', 'Use os dados para tomar decisões financeiras', 'Configure visibilidade em "Ajustes"']
  }, {
    icon: DollarSign,
    title: 'Dashboard',
    description: 'Visão geral da sua carreira',
    steps: ['O Dashboard mostra métricas principais', 'Veja total de shows e receitas', 'Acompanhe shows próximos no calendário', 'Analise gráficos de performance mensal', 'Use filtros para diferentes períodos']
  }];
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <MusicianSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/musician/settings')} className="bg-primary rounded-full p-1.5">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <h1 className="text-xl font-semibold text-black">Tutorial</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="musician" photoUrl={userData?.photo_url} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tutorial</h2>
                <p className="text-gray-600">Aprenda a usar todos os recursos da plataforma.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {tutorials.map((tutorial, index) => <Card key={index} className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <tutorial.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1 text-gray-900">
                          {tutorial.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {tutorial.description}
                        </p>
                      </div>
                    </div>
                    <ol className="space-y-2 ml-4">
                      {tutorial.steps.map((step, stepIndex) => <li key={stepIndex} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            {stepIndex + 1}
                          </span>
                          <span className="text-sm pt-0.5 text-gray-700">{step}</span>
                        </li>)}
                    </ol>
                  </Card>)}
              </div>
            </div>
          </main>

          <MobileBottomNav role="musician" />
        </div>
      </div>
    </SidebarProvider>;
};
export default MusicianTutorial;