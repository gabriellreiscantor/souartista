import logo from '@/assets/logo.png';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1E082B] to-[#2A0C3A] flex flex-col items-center justify-center z-50">
      {/* Logo com glow effect */}
      <div className="relative mb-12">
        <div className="absolute inset-0 blur-3xl opacity-20 bg-[#A66CFF] scale-110"></div>
        <img 
          src={logo} 
          alt="SouArtista Logo" 
          className="relative w-[200px] md:w-[230px] h-auto"
        />
      </div>
      
      {/* Spinner premium */}
      <div className="relative w-12 h-12 mb-8">
        <div className="absolute inset-0 border-[3px] border-[#A66CFF]/20 rounded-full"></div>
        <div className="absolute inset-0 border-[3px] border-[#A66CFF] border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
      </div>
      
      {/* Texto de carregamento */}
      <p className="text-white/80 text-sm font-light tracking-wide animate-pulse">
        Carregando...
      </p>
    </div>
  );
}
