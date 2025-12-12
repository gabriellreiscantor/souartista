import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { Calendar, DollarSign, Users, TrendingUp, Music } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useNativePlatform } from '@/hooks/useNativePlatform';

// Premium floating particles background - only rendered on web
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
};


// Icon component that adapts size based on platform
const SlideIcon = ({ icon: Icon, isIOSNative }: { icon: React.ComponentType<{ className?: string }>, isIOSNative: boolean }) => (
  <Icon className={isIOSNative ? 'w-14 h-14' : 'w-16 h-16'} />
);

interface SlideData {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const slidesData: SlideData[] = [
  {
    icon: DollarSign,
    title: "Suas finanças musicais, organizadas.",
    description: "Veja cachês, despesas e lucro de cada show em um só lugar."
  },
  {
    icon: Calendar,
    title: "Agenda sempre em dia.",
    description: "Controle datas, horários e locais sem depender de planilhas."
  },
  {
    icon: Users,
    title: "Pague sua equipe sem dor de cabeça.",
    description: "Cadastre músicos fixos, valores e custos de cada evento."
  },
  {
    icon: TrendingUp,
    title: "Saiba quanto você realmente está ganhando.",
    description: "Relatórios mensais, fluxo de caixa e análise de lucro."
  },
  {
    icon: Music,
    title: "Também para quem é só músico.",
    description: "Controle seus próprios cachês, sem ser dono de banda."
  }
];

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { isNative, platform } = useNativePlatform();
  const isIOSNative = isNative && platform === 'ios';

  // Update current slide when carousel changes
  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleComplete = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const isLastSlide = current === slidesData.length - 1;

  const handleNext = () => {
    if (api) {
      api.scrollNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ backgroundColor: '#1E082B' }}>
      {/* iOS Safe Area - Status Bar Background */}
      {isIOSNative && (
        <div 
          className="absolute top-0 left-0 right-0 z-30"
          style={{ 
            height: 'env(safe-area-inset-top, 0px)',
            backgroundColor: '#1E082B'
          }}
        />
      )}
      
      {/* Premium background effects - lighter on iOS */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle vertical gradient for texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E082B] via-[#23092E] to-[#1E082B] opacity-60" />
        
        {/* Center glow effect - only on web */}
        {!isIOSNative && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[120px]" />
        )}
        
        {/* Vignette effect - removed on iOS */}
        {!isIOSNative && (
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.4)]" />
        )}
        
        {/* Floating particles - only on web */}
        {!isIOSNative && <FloatingParticles />}
      </div>

      {/* Logo - with safe area padding, reduced effects on iOS */}
      <div 
        className="relative flex justify-center pb-6 z-10"
        style={{ paddingTop: isIOSNative ? 'calc(env(safe-area-inset-top, 0px) + 32px)' : '32px' }}
      >
        <img 
          src={logo} 
          alt="SouArtista" 
          className={`h-32 w-auto ${
            isIOSNative 
              ? 'ios-lite-glow' 
              : 'animate-fade-in drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]'
          }`} 
        />
      </div>

      {/* Skip button - with safe area padding */}
      <button
        onClick={handleSkip}
        className={`absolute right-6 text-muted-foreground text-sm hover:text-foreground z-20 ${
          isIOSNative ? '' : 'transition-all duration-300 hover:scale-105'
        }`}
        style={{ top: isIOSNative ? 'calc(env(safe-area-inset-top, 0px) + 32px)' : '32px' }}
      >
        Pular
      </button>

      {/* Carousel - optimized for touch, extra optimizations on iOS */}
      <div 
        className={`relative flex-1 flex items-center z-10 ${isIOSNative ? 'embla-optimized' : ''}`} 
        style={{ touchAction: 'pan-x' }}
      >
        <Carousel 
          className="w-full" 
          setApi={setApi}
          opts={{
            dragFree: false,
            containScroll: 'trimSnaps',
            watchDrag: true,
            align: 'center',
            duration: isIOSNative ? 15 : 20,
          }}
        >
          <CarouselContent className={`touch-pan-x ${isIOSNative ? 'embla-track-optimized' : 'will-change-transform'}`}>
            {slidesData.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="flex flex-col items-center justify-center px-8 text-center py-8">
                  {/* Premium icon container - simplified on iOS */}
                  <div className="relative mb-10">
                    {/* Glow behind icon - only on web */}
                    {!isIOSNative && (
                      <div className="absolute inset-0 bg-primary/20 rounded-[28px] blur-xl" />
                    )}
                    <div className={`relative w-28 h-28 rounded-[28px] flex items-center justify-center border border-primary/20 ${
                      isIOSNative 
                        ? 'bg-primary/10 ios-lite-shadow' 
                        : 'bg-gradient-to-br from-primary/15 to-primary/5 backdrop-blur-sm shadow-[0_8px_32px_-8px_rgba(168,85,247,0.4)]'
                    }`}>
                      <div className={`text-primary ${isIOSNative ? '' : 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]'}`}>
                        <SlideIcon icon={slide.icon} isIOSNative={isIOSNative} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Title with premium styling */}
                  <h2 className={`text-3xl font-heading font-bold text-white mb-4 max-w-md ${
                    isIOSNative ? '' : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                  }`}>
                    {slide.title}
                  </h2>
                  
                  {/* Subtitle */}
                  <p className="text-lg max-w-sm" style={{ color: '#B8AEC9' }}>
                    {slide.description}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Progress dots - simplified on iOS */}
      <div className="relative flex justify-center gap-2 py-6 z-10">
        {slidesData.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 rounded-full ${isIOSNative ? '' : 'transition-all duration-300'} ${
              index === current 
                ? `w-8 bg-primary ${isIOSNative ? '' : 'shadow-[0_0_12px_rgba(168,85,247,0.6)]'}`
                : 'w-2 bg-primary/30'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Premium action button - lighter effects on iOS */}
      <div className="relative px-8 pb-8 z-10">
        <Button
          onClick={isLastSlide ? handleComplete : handleNext}
          size="lg"
          className={`w-full rounded-full text-lg font-semibold border border-primary/20 ${
            isIOSNative 
              ? 'bg-primary ios-lite-shadow active:scale-[0.98]' 
              : 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-[0_8px_32px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_12px_40px_-8px_rgba(168,85,247,0.8)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLastSlide ? 'Começar agora' : 'Próximo'}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
