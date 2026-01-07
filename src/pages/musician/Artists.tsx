import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic2, Music, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Artist {
  id: string;
  name: string;
  owner_uid: string;
  shows_count?: number;
  total_earned?: number;
}

const MusicianArtists = () => {
  const { user, userData, userRole } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, [user]);

  const fetchArtists = async () => {
    if (!user) return;
    
    try {
      // Busca os shows onde o músico participou
      const { data: showsData, error: showsError } = await supabase
        .from('shows')
        .select('uid, expenses_team')
        .contains('team_musician_ids', [user.id]);

      if (showsError) throw showsError;

      // Agrupa shows por artista (uid do dono do show)
      const artistStats: { [key: string]: { shows_count: number; total_earned: number } } = {};
      
      (showsData || []).forEach(show => {
        const artistId = show.uid;
        
        if (!artistStats[artistId]) {
          artistStats[artistId] = { shows_count: 0, total_earned: 0 };
        }
        
        artistStats[artistId].shows_count++;
        
        // Calcula total ganho (usando musicianId e cost corretos)
        if (show.expenses_team && Array.isArray(show.expenses_team)) {
          const expenses = show.expenses_team as Array<{ musicianId?: string; cost?: number }>;
          const myExpense = expenses.find(exp => exp.musicianId === user.id);
          if (myExpense?.cost) {
            artistStats[artistId].total_earned += Number(myExpense.cost);
          }
        }
      });

      // Busca nomes dos artistas na tabela profiles
      const artistIds = Object.keys(artistStats);
      
      if (artistIds.length === 0) {
        setArtists([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', artistIds);

      if (profilesError) throw profilesError;

      // Combina dados
      const artistsWithStats = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        owner_uid: profile.id,
        shows_count: artistStats[profile.id].shows_count,
        total_earned: artistStats[profile.id].total_earned
      }));

      setArtists(artistsWithStats);
    } catch (error: any) {
      toast.error('Erro ao carregar artistas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <MusicianSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Artistas</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole={userRole} photoUrl={userData?.photo_url} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <div className="mb-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold text-gray-900">Meus Artistas</h2>
                      {artists.length > 0 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                          {artists.length} {artists.length === 1 ? 'artista' : 'artistas'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600">Artistas com quem você trabalhou</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20 animate-pulse">
                  <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Music className="w-8 h-8 text-purple-600 animate-bounce" />
                  </div>
                  <p className="text-gray-500 font-medium">Carregando artistas...</p>
                </div>
              ) : artists.length === 0 ? (
                <Card className="overflow-hidden border-0 shadow-lg animate-fade-in">
                  <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 p-8 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Mic2 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">
                      Nenhum artista encontrado
                    </h3>
                    <p className="text-purple-100 mb-6 max-w-md mx-auto">
                      Você ainda não trabalhou com nenhum artista. Cadastre um show para começar!
                    </p>
                    <Button 
                      onClick={() => navigate('/musician/shows')}
                      className="bg-white text-purple-600 hover:bg-purple-50 font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Show
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {artists.map((artist, index) => (
                    <Card 
                      key={artist.id} 
                      className={cn(
                        "group relative overflow-hidden border-2 border-gray-200 hover:border-purple-300",
                        "bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Gradient Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Mic2 className="w-7 h-7 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                            {artist.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3">Artista parceiro</p>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <Music className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                {artist.shows_count || 0}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(artist.shows_count || 0) === 1 ? 'show' : 'shows'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-green-600">
                                {formatCurrency(artist.total_earned || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
        
        <MobileBottomNav role="musician" />
      </div>
    </SidebarProvider>
  );
};

export default MusicianArtists;
