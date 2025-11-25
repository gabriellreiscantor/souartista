import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoArtistSidebar } from '@/components/DemoArtistSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { DemoLockedModal } from '@/components/DemoLockedModal';
import { Card } from '@/components/ui/card';
import { NotificationBell } from '@/components/NotificationBell';
import { Settings as SettingsIcon } from 'lucide-react';

const DemoArtistSettings = () => {
  const [showModal, setShowModal] = useState(true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Ajustes</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-4xl mx-auto">
              <Card className="p-12 text-center">
                <SettingsIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Configurações</h2>
                <p className="text-gray-600">
                  Personalize sua experiência e gerencie suas preferências
                </p>
              </Card>
            </div>
          </main>
        </div>
        
        <DemoMobileBottomNav role="artist" />
        <DemoLockedModal open={showModal} onOpenChange={setShowModal} />
      </div>
    </SidebarProvider>
  );
};

export default DemoArtistSettings;
