import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Music, Loader2, ArrowLeft, CalendarIcon } from 'lucide-react';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

// Formatação de CPF: 000.000.000-00
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return value.slice(0, 14);
};

// Formatação de WhatsApp: +55 65 9 9614-6969
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 0) return '+55 ';
  if (numbers.length <= 2) return `+${numbers}`;
  if (numbers.length <= 4) return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`;
  if (numbers.length <= 5) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
  if (numbers.length <= 9) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 5)} ${numbers.slice(5)}`;
  
  return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 5)} ${numbers.slice(5, 9)}-${numbers.slice(9, 13)}`;
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    birthDate: '',
    phone: '+55 ',
    password: '',
    confirmPassword: '',
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const progress = (step / 3) * 100;

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, preencha nome e e-mail',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.cpf || !formData.birthDate || !formData.phone) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, preencha todos os campos',
          variant: 'destructive',
        });
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter no mínimo 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'As senhas digitadas são diferentes',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      name: formData.name,
      cpf: formData.cpf,
      birth_date: formData.birthDate,
      phone: formData.phone,
    });

    if (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Bem-vindo ao Sou Artista',
      });
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img src={logo} alt="Sou Artista" className="h-16 w-auto" />
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-heading font-bold">Criar conta</h1>
              <p className="text-muted-foreground">Etapa {step} de 3</p>
            </div>
            
            <Progress value={progress} className="h-2" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                  />
                </div>

                <Button type="button" onClick={handleNext} className="w-full h-11">
                  Continuar
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      setFormData({ ...formData, cpf: formatted });
                    }}
                    maxLength={14}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de nascimento</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-11 w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione sua data de nascimento"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setFormData({ ...formData, birthDate: `${year}-${month}-${day}` });
                            setDatePickerOpen(false);
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        variant="light"
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+55 65 9 9614-6969"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData({ ...formData, phone: formatted });
                    }}
                    maxLength={19}
                    className="h-11"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleBack} variant="outline" className="flex-1 h-11">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1 h-11">
                    Continuar
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleBack} variant="outline" className="flex-1 h-11" disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1 h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
