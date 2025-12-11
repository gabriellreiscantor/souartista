import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Users, DollarSign, BarChart3, Car, MapPin } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';
const ArtistTutorial = () => {
  const {
    userData
  } = useAuth();
  const navigate = useNavigate();
  const tutorials = [{
    icon: Calendar,
    title: 'Gerenciar Shows',
    description: 'Aprenda a criar, editar e organizar seus shows',
    steps: ['Acesse a página "Shows" no menu lateral', 'Clique em "Novo Show" para adicionar um evento', 'Preencha os dados: data, horário, local e cachê', 'Adicione músicos da sua equipe ao show', 'Gerencie despesas e pagamentos']
  }, {
    icon: Users,
    title: 'Gerenciar Músicos',
    description: 'Cadastre e organize sua equipe de músicos',
    steps: ['Vá para a seção "Músicos"', 'Clique em "Adicionar Músico"', 'Informe nome, instrumento e cachê padrão', 'O músico estará disponível para adicionar em shows', 'Edite ou remova músicos conforme necessário']
  }, {
    icon: MapPin,
    title: 'Gerenciar Locais',
    description: 'Cadastre os locais onde você se apresenta',
    steps: ['Acesse "Locais" no menu', 'Adicione novos locais com nome e endereço', 'Use esses locais ao criar shows', 'Mantenha seu histórico de apresentações organizado']
  }, {
    icon: Car,
    title: 'Controle de Locomoção',
    description: 'Registre despesas com transporte',
    steps: ['Na página "Locomoção", clique em "Nova Despesa"', 'Escolha o tipo: Uber, Km, Van, Ônibus ou Avião', 'Para Km: informe distância, consumo e preço do combustível', 'Associe a despesa a um show específico', 'Acompanhe o total gasto em transporte']
  }, {
    icon: BarChart3,
    title: 'Relatórios Financeiros',
    description: 'Acompanhe receitas, despesas e lucros',
    steps: ['Acesse a página "Relatórios"', 'Visualize gráficos de receita, despesas e lucro', 'Filtre por período para análises específicas', 'Use os dados para tomar decisões financeiras', 'Configure visibilidade em "Ajustes"']
  }, {
    icon: DollarSign,
    title: 'Dashboard',
    description: 'Visão geral da sua carreira',
    steps: ['O Dashboard mostra métricas principais', 'Veja total de shows, receitas e despesas', 'Acompanhe shows próximos no calendário', 'Analise gráficos de performance mensal', 'Use filtros para diferentes períodos']
  }];
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <ArtistSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/artist/settings')} className="bg-primary rounded-full p-1.5">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <h1 className="text-xl font-semibold text-black">Tutorial</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="artist" photoUrl={userData?.photo_url} />
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
                {tutorials.map((tutorial, index) => <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-2 border-purple-100">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                        <tutorial.icon className="w-6 h-6 text-white" />
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
                    <div className="space-y-3">
                      {tutorial.steps.map((step, stepIndex) => <div key={stepIndex} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                            {stepIndex + 1}
                          </span>
                          <span className="text-sm text-gray-900 pt-0.5 leading-relaxed">{step}</span>
                        </div>)}
                    </div>
                  </Card>)}
              </div>
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>
      </div>
    </SidebarProvider>;
};
export default ArtistTutorial;