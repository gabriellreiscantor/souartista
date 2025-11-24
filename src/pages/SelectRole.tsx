import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SelectRole = () => {
  const [selected, setSelected] = useState<'artist' | 'musician' | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!selected) {
      toast({
        title: 'Selecione uma opção',
        description: 'Por favor, escolha seu perfil',
        variant: 'destructive',
      });
      return;
    }

    console.log('[SelectRole] Saving role:', selected);
    setLoading(true);
    
    try {
      const { error } = await setUserRole(selected);
      
      if (error) {
        console.error('[SelectRole] Error saving role:', error);
        toast({
          title: 'Erro ao definir perfil',
          description: error.message || 'Não foi possível salvar seu perfil. Tente novamente.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('[SelectRole] Role saved successfully, redirecting to /app');
      toast({
        title: 'Perfil definido!',
        description: `Você é um ${selected === 'artist' ? 'artista' : 'músico'}`,
      });
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        navigate('/app');
      }, 500);
    } catch (error) {
      console.error('[SelectRole] Unexpected error:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-purple-50 via-white to-purple-50/50">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-heading font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Qual é a sua função?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha o perfil que melhor representa você para personalizar sua experiência
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <RoleCard
            icon={<Users className="w-16 h-16" />}
            title="Artista"
            description="Gerencio uma banda/grupo e preciso organizar equipe, cachês e shows completos"
            selected={selected === 'artist'}
            onClick={() => setSelected('artist')}
          />
          <RoleCard
            icon={<Music className="w-16 h-16" />}
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
            className="px-16 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/30 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Carregando...' : 'Continuar'}
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
        group relative rounded-3xl p-10 cursor-pointer transition-all duration-500
        hover:shadow-2xl hover:-translate-y-1
        ${selected 
          ? 'bg-gradient-to-br from-purple-50 to-white border-3 border-purple-500 shadow-2xl shadow-purple-500/20 scale-[1.02]' 
          : 'bg-white border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl'
        }
      `}
      onClick={onClick}
    >
      {/* Check icon when selected */}
      {selected && (
        <div className="absolute top-6 right-6 animate-scale-in">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
      
      {/* Icon container - ACESO quando selecionado, APAGADO quando não */}
      <div className={`
        w-24 h-24 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500
        ${selected 
          ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-500/40 scale-110' 
          : 'bg-gray-100 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-400'
        }
      `}>
        {icon}
      </div>
      
      <h3 className={`text-3xl font-heading font-bold mb-4 transition-colors duration-300 ${
        selected ? 'text-purple-900' : 'text-gray-900'
      }`}>
        {title}
      </h3>
      <p className={`text-base leading-relaxed transition-colors duration-300 ${
        selected ? 'text-purple-700' : 'text-gray-600'
      }`}>
        {description}
      </p>

      {/* Decorative corner elements */}
      {selected && (
        <>
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-purple-400 rounded-tl-3xl opacity-30" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-purple-400 rounded-br-3xl opacity-30" />
        </>
      )}
    </Card>
  );
};

export default SelectRole;
