import { DemoMusicianSidebar } from "@/components/DemoMusicianSidebar";
import { DemoBanner } from "@/components/DemoBanner";
import { DemoMobileBottomNav } from "@/components/DemoMobileBottomNav";
import { DemoUserMenu } from "@/components/DemoUserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { demoShows } from "@/data/demoData";

export default function DemoMusicianShows() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <DemoMusicianSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Meus Shows</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="musician" />
            </div>
          </header>
          
          <main className="flex-1 overflow-auto pb-20 md:pb-6">
            <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
              <div>
                <p className="text-gray-600 mt-1 text-sm md:text-base">Acompanhe todos os seus shows</p>
              </div>

            <div className="grid gap-3 md:gap-4">
              {demoShows.map((show) => {
                // Simula o pagamento do músico (média dos team expenses)
                const musicianPayment = show.expenses_team.length > 0
                  ? show.expenses_team.reduce((sum, exp) => sum + exp.cost, 0) / show.expenses_team.length
                  : show.fee * 0.25;

                return (
                  <Card key={show.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow bg-white border-gray-200">
                    <div className="flex flex-col gap-3 md:gap-4">
                      <div className="flex-1 space-y-2 md:space-y-3">
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-900">{show.venue_name}</h3>
                          {show.is_private_event && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                              Evento Privado
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{new Date(show.date_local).toLocaleDateString('pt-BR')} às {show.time_local}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{show.venue_name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-600">Seu pagamento: </span>
                          <span className="font-bold text-green-600 text-base md:text-lg">
                            {formatCurrency(musicianPayment)}
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="outline"
                        onClick={() => toast.info("Esta é uma demonstração. Para ver detalhes reais, crie sua conta!")}
                        className="w-full sm:w-auto"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
      
      <DemoMobileBottomNav role="musician" />
    </div>
    </SidebarProvider>
  );
}
