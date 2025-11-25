import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export function DemoBanner() {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 w-full bg-yellow-500/90 backdrop-blur-sm border-b border-yellow-600 shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-yellow-900 flex-shrink-0" />
          <p className="text-sm md:text-base font-medium text-yellow-900">
            <span className="font-bold">Modo Demonstração</span> - Explore o sistema livremente. Seus dados não serão salvos.
          </p>
        </div>
        <Button
          onClick={() => navigate('/register')}
          size="sm"
          className="bg-yellow-900 hover:bg-yellow-800 text-white font-semibold shadow-sm"
        >
          Criar Conta Real
        </Button>
      </div>
    </div>
  );
}
