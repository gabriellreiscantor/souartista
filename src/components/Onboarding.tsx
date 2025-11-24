import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Users, TrendingUp, Music } from 'lucide-react';
import logo from '@/assets/logo.png';

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleComplete = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const isLastSlide = selectedIndex === slides.length - 1;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Logo */}
      <div className="flex justify-center pt-8 pb-6">
        <img src={logo} alt="SouArtista" className="h-12 w-auto animate-fade-in" />
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-6 text-muted-foreground text-sm hover:text-foreground transition-colors z-10"
      >
        Pular
      </button>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center px-8 text-center">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 text-primary animate-scale-in">
                {slide.icon}
              </div>
              <h2 className="text-3xl font-heading font-bold text-foreground mb-4 max-w-md animate-fade-in">
                {slide.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-sm animate-fade-in">
                {slide.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex 
                ? 'w-8 bg-primary' 
                : 'w-2 bg-primary/30'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Action button */}
      <div className="px-8 pb-8">
        <Button
          onClick={isLastSlide ? handleComplete : scrollNext}
          size="lg"
          className="w-full rounded-full text-lg font-medium shadow-primary"
        >
          {isLastSlide ? 'Começar agora' : 'Próximo'}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
