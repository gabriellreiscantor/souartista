import logo from '@/assets/logo.png';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] flex flex-col items-center justify-center z-50">
      <div className="animate-scale-in">
        <img 
          src={logo} 
          alt="SouArtista Logo" 
          className="w-40 h-40 md:w-48 md:h-48 mb-12 drop-shadow-2xl"
        />
      </div>
      
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-white/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>
      </div>
      
      <p className="text-white text-base font-semibold tracking-wide animate-pulse">
        Carregando seu workspace...
      </p>
    </div>
  );
}
