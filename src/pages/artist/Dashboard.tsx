import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Music, DollarSign, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ArtistDashboard = () => {
  const { userData, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!userRole || userRole !== 'artist') {
      navigate('/app');
    }
  }, [userRole, loading, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Music className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold">Sou Artista</h1>
              <p className="text-sm text-muted-foreground">Modo Artista</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-heading font-bold mb-2">
            Olá, {userData?.name}! 👋
          </h2>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de gestão profissional
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Próximos Shows"
            value="0"
            description="Este mês"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            title="Receita Total"
            value="R$ 0"
            description="Este mês"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Equipe"
            value="0"
            description="Músicos cadastrados"
          />
          <StatCard
            icon={<Music className="w-6 h-6" />}
            title="Locais"
            value="0"
            description="Bares salvos"
          />
        </div>

        <Card className="glass-card rounded-2xl p-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl font-heading font-bold">
              Comece a gerenciar seus shows
            </h3>
            <p className="text-muted-foreground">
              Adicione seus primeiros shows, cadastre sua equipe e comece a ter controle 
              total da sua carreira artística.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button>Adicionar Show</Button>
              <Button variant="outline">Cadastrar Equipe</Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

const StatCard = ({ icon, title, value, description }: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  description: string;
}) => {
  return (
    <Card className="glass-card rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-heading font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
};

export default ArtistDashboard;
