import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoMusicianSidebar } from '@/components/DemoMusicianSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { DemoLockedModal } from '@/components/DemoLockedModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NotificationBell } from '@/components/NotificationBell';
import { Mic2, Music, Plus } from 'lucide-react';

const DemoMusicianArtists = () => {
  const [showLockedModal, setShowLockedModal] = useState(false);

  const demoArtists = [
    { id: '1', name: 'Gabriell Reis', shows_count: 1, total_earned: 480 },
    { id: '2', name: 'Gusttavo Lima', shows_count: 1, total_earned: 500 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoMusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Artistas</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="musician" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">Meus Artistas</h2>
                  <span className="text-sm font-semibold text-primary">{demoArtists.length} artistas</span>
                </div>
                <p className="text-sm text-gray-600">Gerencie sua rede de parceiros musicais</p>
              </div>

              <Button 
                onClick={() => setShowLockedModal(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white mb-6 h-12 text-base font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Artista
              </Button>

              <div className="space-y-4">
                {demoArtists.map((artist) => (
                  <Card 
                    key={artist.id} 
                    className="p-4 bg-white border-2 border-primary hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setShowLockedModal(true)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                        <Mic2 className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-primary mb-1">{artist.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">Artista parceiro</p>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-900">
                              <span className="font-bold">{artist.shows_count}</span> show{artist.shows_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(artist.total_earned)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
        
        <DemoMobileBottomNav role="musician" />
      </div>
      
      <DemoLockedModal open={showLockedModal} onOpenChange={setShowLockedModal} />
    </SidebarProvider>
  );
};

export default DemoMusicianArtists;
