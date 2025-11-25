import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export function DemoBanner() {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 w-full bg-yellow-500/90 backdrop-blur-sm border-b border-yellow-600 shadow-md">
      <div className="container mx-auto px-4 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4 flex-wrap">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-900 flex-shrink-0" />
          <p className="text-xs md:text-sm font-medium text-yellow-900 truncate">
            <span className="font-bold">Modo Demonstração</span> - Explore o sistema livremente. Seus dados não serão salvos.
          </p>
        </div>
        <Button
          onClick={() => navigate('/register')}
          size="sm"
          className="bg-yellow-900 hover:bg-yellow-800 text-white font-semibold shadow-sm text-xs md:text-sm whitespace-nowrap"
        >
          Criar Conta
        </Button>
      </div>
    </div>
  );
}
