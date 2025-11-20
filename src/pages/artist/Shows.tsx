import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { Button } from '@/components/ui/button';
import { Bell, User as UserIcon, Plus } from 'lucide-react';

const ArtistShows = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Shows</h1>
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
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Meus Shows</h2>
                  <p className="text-gray-600">Gerencie todos os seus eventos</p>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Show
                </Button>
              </div>

              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">Nenhum show cadastrado ainda</p>
                <p className="text-sm text-gray-400 mt-2">Clique em "Adicionar Show" para começar</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ArtistShows;
