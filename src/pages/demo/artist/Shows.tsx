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
    <div className="flex min-h-screen w-full bg-background">
      <DemoArtistSidebar />
      
      <div className="flex-1 flex flex-col">
        <DemoBanner />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Shows</h1>
                <p className="text-muted-foreground mt-1">Gerencie todos os seus shows</p>
              </div>
              <Button onClick={handleAddShow} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Show
              </Button>
            </div>

            <div className="grid gap-4">
              {demoShows.map((show) => {
                const totalExpenses = 
                  show.expenses_team.reduce((sum, exp) => sum + exp.cost, 0) +
                  show.expenses_other.reduce((sum, exp) => sum + exp.cost, 0);
                const profit = show.fee - totalExpenses;

                return (
                  <Card key={show.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{show.venue_name}</h3>
                          {show.is_private_event && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-600 rounded">
                              Evento Privado
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(show.date_local).toLocaleDateString('pt-BR')} às {show.time_local}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{show.team_musician_ids.length} músico(s)</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{show.venue_name}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cachê: </span>
                            <span className="font-semibold text-green-600">{formatCurrency(show.fee)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Despesas: </span>
                            <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Lucro: </span>
                            <span className={`font-semibold ${profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                              {formatCurrency(profit)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={() => toast.info("Esta é uma demonstração. Para editar shows reais, crie sua conta!")}
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
