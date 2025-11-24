import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { Calendar, DollarSign, Users, TrendingUp, Music } from 'lucide-react';
import logo from '@/assets/logo.png';

// Premium floating particles background
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
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

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: <DollarSign className="w-16 h-16" />,
    title: "Suas finanças musicais, organizadas.",
    description: "Veja cachês, despesas e lucro de cada show em um só lugar."
  },
  {
    icon: <Calendar className="w-16 h-16" />,
    title: "Agenda sempre em dia.",
    description: "Controle datas, horários e locais sem depender de planilhas."
  },
  {
    icon: <Users className="w-16 h-16" />,
    title: "Pague sua equipe sem dor de cabeça.",
    description: "Cadastre músicos fixos, valores e custos de cada evento."
  },
  {
    icon: <TrendingUp className="w-16 h-16" />,
    title: "Saiba quanto você realmente está ganhando.",
    description: "Relatórios mensais, fluxo de caixa e análise de lucro."
  },
  {
    icon: <Music className="w-16 h-16" />,
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

  const isLastSlide = current === slides.length - 1;

  const handleNext = () => {
    if (api) {
      api.scrollNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ backgroundColor: '#1E082B' }}>
      {/* Premium background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle vertical gradient for texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E082B] via-[#23092E] to-[#1E082B] opacity-60" />
        
        {/* Center glow effect */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[120px]" />
        
        {/* Vignette effect */}
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.4)]" />
        
        {/* Floating particles */}
        <FloatingParticles />
      </div>

      {/* Logo */}
      <div className="relative flex justify-center pt-8 pb-6 z-10">
        <img src={logo} alt="SouArtista" className="h-12 w-auto animate-fade-in drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]" />
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-6 text-muted-foreground text-sm hover:text-foreground transition-all duration-300 z-20 hover:scale-105"
      >
        Pular
      </button>

      {/* Carousel */}
      <div className="relative flex-1 flex items-center z-10">
        <Carousel className="w-full" setApi={setApi}>
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="flex flex-col items-center justify-center px-8 text-center py-8">
                  {/* Premium icon container with glow and shadow */}
                  <div className="relative mb-10 animate-scale-in">
                    <div className="absolute inset-0 bg-primary/20 rounded-[28px] blur-xl" />
                    <div className="relative w-28 h-28 rounded-[28px] bg-gradient-to-br from-primary/15 to-primary/5 backdrop-blur-sm flex items-center justify-center border border-primary/20 shadow-[0_8px_32px_-8px_rgba(168,85,247,0.4)]">
                      <div className="text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                        {slide.icon}
                      </div>
                    </div>
                  </div>
                  
                  {/* Title with premium styling */}
                  <h2 className="text-3xl font-heading font-bold text-white mb-4 max-w-md animate-fade-in drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                    {slide.title}
                  </h2>
                  
                  {/* Subtitle */}
                  <p className="text-lg max-w-sm animate-fade-in" style={{ color: '#B8AEC9' }}>
                    {slide.description}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Progress dots */}
      <div className="relative flex justify-center gap-2 py-6 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current 
                ? 'w-8 bg-primary shadow-[0_0_12px_rgba(168,85,247,0.6)]' 
                : 'w-2 bg-primary/30'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Premium action button */}
      <div className="relative px-8 pb-8 z-10">
        <Button
          onClick={isLastSlide ? handleComplete : handleNext}
          size="lg"
          className="w-full rounded-full text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-[0_8px_32px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_12px_40px_-8px_rgba(168,85,247,0.8)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-primary/20"
        >
          {isLastSlide ? 'Começar agora' : 'Próximo'}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
