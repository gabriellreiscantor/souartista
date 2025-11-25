import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoMusicianSidebar } from '@/components/DemoMusicianSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { Card } from '@/components/ui/card';
import { NotificationBell } from '@/components/NotificationBell';
import { Mic2, Music } from 'lucide-react';

const DemoMusicianArtists = () => {
  const demoArtists = [
    { id: '1', name: 'João Silva', shows_count: 12, total_earned: 5760 },
    { id: '2', name: 'Maria Santos', shows_count: 8, total_earned: 3840 },
    { id: '3', name: 'Pedro Costa', shows_count: 6, total_earned: 2880 },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoMusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Artistas</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="musician" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Meus Artistas</h2>
                <p className="text-gray-600">Gerencie sua rede de parceiros musicais</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoArtists.map((artist) => (
                  <Card 
                    key={artist.id} 
                    className="group relative overflow-hidden border-2 border-gray-200 hover:border-purple-300 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Mic2 className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                          {artist.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">Artista parceiro</p>
                        
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-semibold text-gray-900">
                              {artist.shows_count}
                            </span>
                            <span className="text-xs text-gray-500">
                              {artist.shows_count === 1 ? 'show' : 'shows'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-600">
                              R$ {artist.total_earned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
        
        <DemoMobileBottomNav role="musician" />
      </div>
    </SidebarProvider>
  );
};

export default DemoMusicianArtists;
