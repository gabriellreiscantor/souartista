import { DemoArtistSidebar } from "@/components/DemoArtistSidebar";
import { DemoBanner } from "@/components/DemoBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Calendar, MapPin, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import { demoShows } from "@/data/demoData";

export default function DemoArtistShows() {
  const handleAddShow = () => {
    toast.info("Esta é uma demonstração. Para adicionar shows reais, crie sua conta!");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <DemoArtistSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <DemoBanner />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Shows</h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie todos os seus shows</p>
              </div>
              <Button onClick={handleAddShow} className="gap-2 text-sm md:text-base whitespace-nowrap">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar Show</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>

            <div className="grid gap-3 md:gap-4">
              {demoShows.map((show) => {
                const totalExpenses = 
                  show.expenses_team.reduce((sum, exp) => sum + exp.cost, 0) +
                  show.expenses_other.reduce((sum, exp) => sum + exp.cost, 0);
                const profit = show.fee - totalExpenses;

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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{new Date(show.date_local).toLocaleDateString('pt-BR')} às {show.time_local}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>{show.team_musician_ids.length} músico(s)</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{show.venue_name}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 md:gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Cachê: </span>
                            <span className="font-semibold text-green-600">{formatCurrency(show.fee)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Despesas: </span>
                            <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Lucro: </span>
                            <span className={`font-semibold ${profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                              {formatCurrency(profit)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={() => toast.info("Esta é uma demonstração. Para editar shows reais, crie sua conta!")}
                        className="w-full sm:w-auto border-gray-300 text-gray-900 hover:bg-gray-100"
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
    </div>
  );
}
