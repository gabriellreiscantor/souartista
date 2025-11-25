import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export function DemoBanner() {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 w-full bg-yellow-500/90 backdrop-blur-sm border-b border-yellow-600 shadow-md">
      <div className="container mx-auto px-2 md:px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertCircle className="h-4 w-4 text-yellow-900 flex-shrink-0" />
          <p className="text-[10px] md:text-sm font-medium text-yellow-900 leading-tight">
            <span className="font-bold">Modo Demonstração</span> - Dados não são salvos
          </p>
        </div>
        <Button
          onClick={() => navigate('/register')}
          size="sm"
          className="bg-yellow-900 hover:bg-yellow-800 text-white font-semibold shadow-sm text-[10px] md:text-sm whitespace-nowrap px-2 md:px-4 h-7 md:h-9"
        >
          Criar Conta
        </Button>
      </div>
    </div>
  );
}
