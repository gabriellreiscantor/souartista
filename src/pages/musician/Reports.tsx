import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { Button } from '@/components/ui/button';
import { Bell, User as UserIcon } from 'lucide-react';

const MusicianReports = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <MusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
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
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Relatórios Financeiros</h2>
              
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Relatórios em desenvolvimento</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MusicianReports;
