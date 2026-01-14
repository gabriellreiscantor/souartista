import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { Maximize2, Minimize2 } from 'lucide-react';

interface AnimatedDigitProps {
  digit: string;
}

const AnimatedDigit = ({ digit }: AnimatedDigitProps) => {
  const numericDigit = parseInt(digit) || 0;
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden h-20 w-14 md:h-32 md:w-24 shadow-2xl border border-white/20">
      <div 
        className="transition-transform duration-700 ease-out"
        style={{ transform: `translateY(-${numericDigit * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div 
            key={n} 
            className="h-20 md:h-32 flex items-center justify-center text-4xl md:text-7xl font-bold text-white"
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
};

interface AnimatedNumberProps {
  value: number;
}

const AnimatedNumber = ({ value }: AnimatedNumberProps) => {
  // Pad to at least 3 digits, but expand if needed
  const minDigits = Math.max(3, value.toString().length);
  const digits = value.toString().padStart(minDigits, '0').split('');
  
  return (
    <div className="flex gap-2 md:gap-3">
      {digits.map((digit, index) => (
        <AnimatedDigit key={index} digit={digit} />
      ))}
    </div>
  );
};

const getNextMilestoneMessage = (count: number): string => {
  if (count < 50) return `Rumo aos 50! 🚀`;
  if (count < 100) return `Quase 100! 🎉`;
  if (count < 500) return `Rumo aos 500! 🔥`;
  if (count < 1000) return `Mil usuários chegando! 💪`;
  if (count < 5000) return `5K na mira! 🎯`;
  if (count < 10000) return `Rumo aos 10K! 🚀`;
  if (count < 50000) return `50K vindo aí! 💥`;
  if (count < 100000) return `100 MIL! 🤯`;
  if (count < 500000) return `Meio milhão chegando! 🌟`;
  if (count < 1000000) return `UM MILHÃO NA MIRA! 🏆`;
  return `MAIS DE 1 MILHÃO! 👑`;
};

export function UserCounterTab() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [artistsCount, setArtistsCount] = useState(0);
  const [musiciansCount, setMusiciansCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchCounts = async () => {
    try {
      // Total users
      const { count: total, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;
      setTotalUsers(total || 0);

      // Artists count
      const { count: artists, error: artistsError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'artist');

      if (artistsError) throw artistsError;
      setArtistsCount(artists || 0);

      // Musicians count
      const { count: musicians, error: musiciansError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'musician');

      if (musiciansError) throw musiciansError;
      setMusiciansCount(musicians || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Realtime subscription for profiles table
    const channel = supabase
      .channel('user-counter-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('📊 Profile changed, updating counter...');
          fetchCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          console.log('📊 User role changed, updating counter...');
          fetchCounts();
        }
      )
      .subscribe((status) => {
        console.log('📡 User counter realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(278,69%,10%)] via-[hsl(278,69%,12%)] to-[hsl(278,69%,8%)] flex items-center justify-center">
        <div className="animate-pulse text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(278,69%,10%)] via-[hsl(278,69%,12%)] to-[hsl(278,69%,8%)] flex flex-col items-center justify-center p-4 animate-fade-in relative">
      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-3 rounded-xl border border-white/20 transition-all z-10"
        title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
      >
        {isFullscreen ? <Minimize2 className="h-6 w-6 text-white" /> : <Maximize2 className="h-6 w-6 text-white" />}
      </button>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl" />
      </div>

      {/* Logo */}
      <div className="relative mb-8 md:mb-12">
        <img 
          src={logo} 
          alt="Sou Artista" 
          className="h-24 md:h-40 w-auto drop-shadow-2xl animate-scale-in"
        />
        <div className="absolute -inset-4 bg-white/10 rounded-full blur-xl -z-10" />
      </div>

      {/* Title */}
      <h1 className="text-xl md:text-3xl font-bold text-white/90 mb-6 md:mb-10 tracking-wider uppercase text-center">
        Usuários Sou Artista
      </h1>

      {/* Counter */}
      <div className="relative mb-6 md:mb-8">
        <AnimatedNumber value={totalUsers} />
        <div className="absolute -inset-6 bg-white/5 rounded-3xl blur-xl -z-10" />
      </div>

      {/* Milestone message */}
      <p className="text-lg md:text-2xl text-white/80 font-medium mb-8 md:mb-12 animate-fade-in">
        {getNextMilestoneMessage(totalUsers)}
      </p>

      {/* Breakdown */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-12 text-white/70 text-sm md:text-lg">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
          <span className="text-xl md:text-2xl">🎵</span>
          <span className="font-medium">Artistas:</span>
          <span className="font-bold text-white">{artistsCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
          <span className="text-xl md:text-2xl">🎸</span>
          <span className="font-medium">Músicos:</span>
          <span className="font-bold text-white">{musiciansCount}</span>
        </div>
      </div>

      {/* Footer text */}
      <p className="absolute bottom-8 text-white/40 text-sm">
        Atualização em tempo real
      </p>
    </div>
  );
}
