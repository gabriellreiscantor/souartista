import logo from '@/assets/logo.png';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50">
      <div className="animate-fade-in">
        <img 
          src={logo} 
          alt="SouArtista Logo" 
          className="w-32 h-32 md:w-40 md:h-40 mb-8 animate-scale-in"
        />
      </div>
      
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <p className="mt-6 text-white text-sm font-medium animate-pulse">
        Carregando...
      </p>
    </div>
  );
}
