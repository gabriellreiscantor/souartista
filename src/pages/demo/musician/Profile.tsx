import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoMusicianSidebar } from '@/components/DemoMusicianSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { DemoLockedModal } from '@/components/DemoLockedModal';
import { Card } from '@/components/ui/card';
import { NotificationBell } from '@/components/NotificationBell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const DemoMusicianProfile = () => {
  const [showModal, setShowModal] = useState(true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoMusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Perfil</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="musician" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-4xl mx-auto">
              <Card className="p-8">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarFallback className="text-4xl font-bold bg-purple-100 text-purple-600">
                      D
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold mb-2">Usuário Demo</h2>
                  <p className="text-gray-600">demo@example.com</p>
                </div>
              </Card>
            </div>
          </main>
        </div>
        
        <DemoMobileBottomNav role="musician" />
        <DemoLockedModal open={showModal} onOpenChange={setShowModal} />
      </div>
    </SidebarProvider>
  );
};

export default DemoMusicianProfile;
