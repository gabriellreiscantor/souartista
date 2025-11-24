import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, ArrowLeft, Sparkles, Bug, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ArtistUpdates = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const updates = [
    {
      version: '1.2.0',
      date: '15 de Janeiro, 2025',
      type: 'feature',
      items: [
        'Nova página de Ajustes com controles de visibilidade',
        'Seleção de tema claro/escuro',
        'Editor de fotos de perfil com zoom e corte'
      ]
    },
    {
      version: '1.1.0',
      date: '10 de Janeiro, 2025',
      type: 'improvement',
      items: [
        'Melhorias na performance do dashboard',
        'Interface redesenhada para melhor usabilidade',
        'Novos gráficos de relatórios financeiros'
      ]
    },
    {
      version: '1.0.5',
      date: '05 de Janeiro, 2025',
      type: 'bugfix',
      items: [
        'Correção de erro ao salvar shows',
        'Ajuste no cálculo de despesas de locomoção',
        'Melhorias na navegação mobile'
      ]
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'improvement':
        return <Zap className="w-5 h-5 text-blue-600" />;
      case 'bugfix':
        return <Bug className="w-5 h-5 text-green-600" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-white text-purple-700 border-2 border-purple-600';
      case 'improvement':
        return 'bg-white text-blue-700 border-2 border-blue-600';
      case 'bugfix':
        return 'bg-white text-green-700 border-2 border-green-600';
      default:
        return 'bg-white text-gray-700 border-2 border-gray-600';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'feature':
        return 'Novidades';
      case 'improvement':
        return 'Melhorias';
      case 'bugfix':
        return 'Correções';
      default:
        return 'Atualização';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <ArtistSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/artist/settings')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-black">Atualizações</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-900" />
              </Button>
              <UserMenu userName={userData?.name} userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Atualizações</h2>
                <p className="text-gray-600">Veja as novidades e melhorias da plataforma.</p>
              </div>

              <div className="space-y-6">
                {updates.map((update, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getIcon(update.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            Versão {update.version}
                          </h3>
                          <Badge className={getBadgeColor(update.type)}>
                            {getTypeName(update.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{update.date}</p>
                        <ul className="space-y-2">
                          {update.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ArtistUpdates;
