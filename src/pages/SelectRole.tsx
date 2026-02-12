import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const SelectRole = () => {
  const [selected, setSelected] = useState<'artist' | 'musician' | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUserRole } = useAuth();
  const navigate = useNavigate();
  

  const handleContinue = async () => {
    if (!selected) {
      toast.error('Por favor, escolha seu perfil');
      return;
    }

    console.log('[SelectRole] Saving role:', selected);
    setLoading(true);
    
    try {
      const { error } = await setUserRole(selected);
      
      if (error) {
        console.error('[SelectRole] Error saving role:', error);
        toast.error(error.message || 'Não foi possível salvar seu perfil. Tente novamente.');
        setLoading(false);
        return;
      }

      console.log('[SelectRole] Role saved successfully, redirecting to /app');
      toast.success(`Perfil definido! Você é um ${selected === 'artist' ? 'artista' : 'músico'}`);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        navigate('/app');
      }, 500);
    } catch (error) {
      console.error('[SelectRole] Unexpected error:', error);
      toast.error('Algo deu errado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold mb-4">
            Qual é a sua função?
          </h1>
          <p className="text-xl text-muted-foreground">
            Escolha o perfil que melhor representa você
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <RoleCard
            icon={<Users className="w-12 h-12" />}
            title="Artista"
            description="Gerencio uma banda/grupo e preciso organizar equipe, cachês e shows completos"
            selected={selected === 'artist'}
            onClick={() => setSelected('artist')}
          />
          <RoleCard
            icon={<Music className="w-12 h-12" />}
            title="Músico"
            description="Faço freelas para diferentes artistas e quero controlar meus cachês e agenda"
            selected={selected === 'musician'}
            onClick={() => setSelected('musician')}
          />
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selected || loading}
            className="px-12"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

const RoleCard = ({ 
  icon, 
  title, 
  description, 
  selected, 
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <Card
      className={`
        relative rounded-2xl p-8 cursor-pointer transition-all duration-300
        active:scale-95 backdrop-blur-xl
        ${selected 
          ? 'bg-card border-2 border-primary shadow-lg shadow-primary/30' 
          : 'bg-card/30 border border-border/30 hover:bg-card/40'
        }
      `}
      onClick={onClick}
    >
      {/* Check icon when selected */}
      {selected && (
        <div className="absolute top-4 right-4 animate-scale-in">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
      )}
      
      {/* Icon - ACESO quando selecionado (roxo vibrante), APAGADO quando não (cinza) */}
      <div className={`
        w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all duration-300
        ${selected 
          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground scale-110 shadow-lg shadow-primary/40' 
          : 'bg-muted/50 text-muted-foreground/40'
        }
      `}>
        {icon}
      </div>
      <h3 className="text-2xl font-heading font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
};

export default SelectRole;
