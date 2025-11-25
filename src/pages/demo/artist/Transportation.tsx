import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoArtistSidebar } from '@/components/DemoArtistSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationBell } from '@/components/NotificationBell';
import { Car, Truck, Bus, Plane, Fuel } from 'lucide-react';
import { toast } from 'sonner';

type TransportTab = 'uber' | 'km' | 'van' | 'onibus' | 'aviao';

const DemoArtistTransportation = () => {
  const [activeTab, setActiveTab] = useState<TransportTab>('uber');

  const handleSave = () => {
    toast.info('Modo Demo', {
      description: 'Função disponível apenas na versão completa.'
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Locomoção</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide">
            <div className="max-w-7xl mx-auto space-y-6">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Gerenciamento de Locomoção</h2>
                  <p className="text-sm text-gray-600 mb-6">Registre e associe despesas de deslocamento de forma detalhada e organizada.</p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {[
                      { id: 'uber', icon: Car, label: 'Uber' },
                      { id: 'km', icon: Fuel, label: 'Carro/Km Rodado' },
                      { id: 'van', icon: Truck, label: 'Van' },
                      { id: 'onibus', icon: Bus, label: 'Ônibus' },
                      { id: 'aviao', icon: Plane, label: 'Avião' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TransportTab)}
                        className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-all ${
                          activeTab === item.id
                            ? 'bg-purple-600 text-white font-medium shadow-md'
                            : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="text-sm font-medium text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                      Registre suas despesas de locomoção de forma organizada
                    </p>
                    <Button onClick={handleSave} variant="outline" size="lg">
                      Salvar Despesa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <DemoMobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default DemoArtistTransportation;
