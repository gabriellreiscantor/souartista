import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Bug, Zap, Loader2 } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const ArtistUpdates = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_updates')
        .select('*')
        .eq('is_published', true)
        .order('release_date', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('Erro ao buscar atualizações:', error);
    } finally {
      setLoading(false);
    }
  };
  const getIcon = (type: string) => {
    switch (type) {
      case 'Novidades':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'Melhorias':
        return <Zap className="w-5 h-5 text-blue-600" />;
      case 'Correções':
        return <Bug className="w-5 h-5 text-green-600" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };
  
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Novidades':
        return 'bg-white text-purple-700 border-2 border-purple-600';
      case 'Melhorias':
        return 'bg-white text-blue-700 border-2 border-blue-600';
      case 'Correções':
        return 'bg-white text-green-700 border-2 border-green-600';
      default:
        return 'bg-white text-gray-700 border-2 border-gray-600';
    }
  };
  return <SidebarProvider>
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
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Atualizações</h2>
                <p className="text-gray-600">Veja as novidades e melhorias da plataforma.</p>
              </div>

              <div className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : updates.length === 0 ? (
                  <Card className="p-6">
                    <p className="text-center text-muted-foreground">
                      Nenhuma atualização disponível no momento.
                    </p>
                  </Card>
                ) : (
                  updates.map((update, index) => (
                    <Card key={index} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getIcon(update.title)}</div>
                        <div className="flex-1 text-slate-50">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-slate-50">
                              Versão {update.version}
                            </h3>
                            <Badge className={getBadgeColor(update.title)}>
                              {update.title}
                            </Badge>
                          </div>
                          <p className="text-sm mb-4 text-slate-50">
                            {new Date(update.release_date).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <div className="text-slate-50 whitespace-pre-line">
                            {update.description}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>
      </div>
    </SidebarProvider>;
};
export default ArtistUpdates;