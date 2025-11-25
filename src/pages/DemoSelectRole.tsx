import { useNavigate } from "react-router-dom";
import { Music, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function DemoSelectRole() {
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'artist' | 'musician') => {
    if (role === 'artist') {
      navigate('/demo/artist/dashboard');
    } else {
      navigate('/demo/musician/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[300px] bg-[#A66CFF] opacity-20 blur-[80px] rounded-full" />
            </div>
            <img src={logo} alt="Sou Artista" className="h-32 w-auto relative z-10" />
          </div>
        </div>

        {/* Demo badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
            <span className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold">
              🎭 Modo Demonstração
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Escolha o que deseja explorar
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Experimente o dashboard e funcionalidades sem precisar criar uma conta
          </p>
        </div>

        {/* Role selection cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Artist Card */}
          <button
            onClick={() => handleRoleSelect('artist')}
            className="group relative p-8 rounded-2xl bg-card border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Mic className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Artista</h3>
                <p className="text-muted-foreground">
                  Gerencie shows, músicos, receitas e despesas
                </p>
              </div>
              <Button 
                className="mt-4 w-full group-hover:bg-primary group-hover:text-primary-foreground"
                variant="outline"
              >
                Ver Dashboard
              </Button>
            </div>
          </button>

          {/* Musician Card */}
          <button
            onClick={() => handleRoleSelect('musician')}
            className="group relative p-8 rounded-2xl bg-card border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Music className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Músico</h3>
                <p className="text-muted-foreground">
                  Acompanhe seus shows, ganhos e agenda
                </p>
              </div>
              <Button 
                className="mt-4 w-full group-hover:bg-primary group-hover:text-primary-foreground"
                variant="outline"
              >
                Ver Dashboard
              </Button>
            </div>
          </button>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Voltar para página inicial
          </Button>
        </div>
      </div>
    </div>
  );
}
