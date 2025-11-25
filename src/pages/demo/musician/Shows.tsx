import { DemoMusicianSidebar } from "@/components/DemoMusicianSidebar";
import { DemoBanner } from "@/components/DemoBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="flex min-h-screen w-full bg-background">
      <DemoMusicianSidebar />
      
      <div className="flex-1 flex flex-col">
        <DemoBanner />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Meus Shows</h1>
              <p className="text-muted-foreground mt-1">Acompanhe todos os seus shows</p>
            </div>

            <div className="grid gap-4">
              {demoShows.map((show) => {
                // Simula o pagamento do músico (média dos team expenses)
                const musicianPayment = show.expenses_team.length > 0
                  ? show.expenses_team.reduce((sum, exp) => sum + exp.cost, 0) / show.expenses_team.length
                  : show.fee * 0.25;

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(show.date_local).toLocaleDateString('pt-BR')} às {show.time_local}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{show.venue_name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="text-muted-foreground">Seu pagamento: </span>
                          <span className="font-bold text-green-600 text-lg">
                            {formatCurrency(musicianPayment)}
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="outline"
                        onClick={() => toast.info("Esta é uma demonstração. Para ver detalhes reais, crie sua conta!")}
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
