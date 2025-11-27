import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Bug, Zap } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';
const MusicianUpdates = () => {
  const {
    userData
  } = useAuth();
  const navigate = useNavigate();
  const updates = [{
    version: '1.2.0',
    date: '15 de Janeiro, 2025',
    type: 'feature',
    items: ['Nova página de Ajustes com controles de visibilidade', 'Seleção de tema claro/escuro', 'Editor de fotos de perfil com zoom e corte']
  }, {
    version: '1.1.0',
    date: '10 de Janeiro, 2025',
    type: 'improvement',
    items: ['Melhorias na performance do dashboard', 'Interface redesenhada para melhor usabilidade', 'Novos gráficos de relatórios financeiros']
  }, {
    version: '1.0.5',
    date: '05 de Janeiro, 2025',
    type: 'bugfix',
    items: ['Correção de erro ao salvar shows', 'Ajuste no cálculo de despesas de locomoção', 'Melhorias na navegação mobile']
  }];
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
        return 'bg-purple-100 text-purple-700';
      case 'improvement':
        return 'bg-blue-100 text-blue-700';
      case 'bugfix':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <MusicianSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/musician/settings')} className="text-stone-950">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-black">Atualizações</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="musician" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
            <div className="max-w-3xl mx-auto text-stone-950">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Atualizações</h2>
                <p className="text-gray-600">Veja as novidades e melhorias da plataforma.</p>
              </div>

              <div className="space-y-6">
                {updates.map((update, index) => <Card key={index} className="p-6 text-slate-50">
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
                        <p className="text-sm mb-4 text-red-50">{update.date}</p>
                        <ul className="space-y-2">
                          {update.items.map((item, itemIndex) => <li key={itemIndex} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-red-50">{item}</span>
                            </li>)}
                        </ul>
                      </div>
                    </div>
                  </Card>)}
              </div>
            </div>
          </main>

          <MobileBottomNav role="musician" />
        </div>
      </div>
    </SidebarProvider>;
};
export default MusicianUpdates;