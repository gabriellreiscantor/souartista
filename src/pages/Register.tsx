import { useState, useEffect } from 'react';
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
import { Music, Loader2, ArrowLeft, CalendarIcon, Camera, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ImageEditor } from '@/components/ImageEditor';
import { supabase } from '@/integrations/supabase/client';
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
  const { signUp, user, session, loading: authLoading, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados para foto de perfil
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [croppedPhoto, setCroppedPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [imageEditorOpen, setImageEditorOpen] = useState(false);

  // Estados para OTP
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // NÃO redireciona automaticamente - deixa o fluxo do formulário seguir
  // O redirecionamento acontece apenas após verificar o OTP no step 4

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

  const progress = (step / 4) * 100;

  // Timer para reenviar OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handlers para foto
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A foto deve ter no máximo 5MB',
          variant: 'destructive',
        });
        return;
      }
      setPhotoFile(file);
      setImageEditorOpen(true);
    }
  };

  const handlePhotoSave = (croppedBlob: Blob) => {
    setCroppedPhoto(croppedBlob);
    const url = URL.createObjectURL(croppedBlob);
    setPhotoPreview(url);
    setImageEditorOpen(false);
  };

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

    try {
      // Verificar se o e-mail já existe
      const { data: emailExists } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email.toLowerCase())
        .maybeSingle();

      if (emailExists) {
        setLoading(false);
        toast({
          title: 'E-mail já cadastrado',
          description: 'Este e-mail já possui uma conta. Esqueceu sua senha?',
          variant: 'destructive',
          action: (
            <button
              onClick={() => navigate('/reset-password')}
              className="text-sm underline hover:no-underline"
            >
              Redefinir senha
            </button>
          ),
        });
        return;
      }

      // Verificar se o CPF já existe (removendo formatação)
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      const { data: cpfExists } = await supabase
        .from('profiles')
        .select('cpf')
        .eq('cpf', cleanCpf)
        .maybeSingle();

      if (cpfExists) {
        setLoading(false);
        toast({
          title: 'CPF já cadastrado',
          description: 'Este CPF já possui uma conta. Faça login ou recupere sua senha.',
          variant: 'destructive',
          action: (
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => navigate('/login')}
                className="text-sm underline hover:no-underline"
              >
                Fazer login
              </button>
              <button
                onClick={() => navigate('/reset-password')}
                className="text-sm underline hover:no-underline"
              >
                Recuperar senha
              </button>
            </div>
          ),
        });
        return;
      }

      // Verificar se o telefone já existe
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const { data: phoneExists } = await supabase
        .from('profiles')
        .select('phone')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (phoneExists) {
        setLoading(false);
        toast({
          title: 'Telefone já cadastrado',
          description: 'Este número de telefone já possui uma conta. Faça login ou recupere sua senha.',
          variant: 'destructive',
          action: (
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => navigate('/login')}
                className="text-sm underline hover:no-underline"
              >
                Fazer login
              </button>
              <button
                onClick={() => navigate('/reset-password')}
                className="text-sm underline hover:no-underline"
              >
                Recuperar senha
              </button>
            </div>
          ),
        });
        return;
      }

      // Criar a conta
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        cpf: cleanCpf,
        birth_date: formData.birthDate,
        phone: formData.phone,
      });

      if (error) {
        // Melhorar mensagens de erro comuns do Supabase
        let errorMessage = error.message;
        
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          errorMessage = 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.';
        } else if (error.message.includes('password')) {
          errorMessage = 'A senha deve ter no mínimo 6 caracteres com letras e números.';
        } else if (error.message.includes('email')) {
          errorMessage = 'Por favor, insira um e-mail válido.';
        }

        toast({
          title: 'Erro ao criar conta',
          description: errorMessage,
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        // Armazena email e vai para etapa 4 (OTP)
        setRegisteredEmail(formData.email);
        setStep(4);
        setResendTimer(60);
        toast({
          title: 'Código enviado!',
          description: 'Verifique seu e-mail',
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Não foi possível completar o cadastro. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: 'Código incompleto',
        description: 'Digite o código de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);

    const { error } = await verifyOtp(registeredEmail, otpCode);

    if (error) {
      toast({
        title: 'Código inválido',
        description: error.message,
        variant: 'destructive',
      });
      setVerifying(false);
      return;
    }

    // Upload da foto se houver
    if (croppedPhoto) {
      try {
        const fileName = `${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, croppedPhoto, {
            contentType: 'image/jpeg',
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(fileName);

          await supabase
            .from('profiles')
            .update({ photo_url: publicUrl })
            .eq('email', registeredEmail);
        }
      } catch (err) {
        console.error('Erro ao fazer upload da foto:', err);
      }
    }

    toast({
      title: 'Conta verificada!',
      description: 'Bem-vindo ao Sou Artista',
    });
    setVerifying(false);
    navigate('/app');
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    const { error } = await resendOtp(registeredEmail);

    if (error) {
      toast({
        title: 'Erro ao reenviar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Código reenviado!',
        description: 'Verifique seu e-mail',
      });
      setResendTimer(60);
    }
  };

  // Mostra loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: '#1E082B',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: 'none',
        overscrollBehavior: 'none'
      }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-300">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative" style={{
      background: '#1E082B',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      touchAction: 'none',
      overscrollBehavior: 'contain',
      overflow: 'hidden'
    }}>
      {/* Glow central suave e sutil */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-[#B96FFF] opacity-[0.08] blur-[120px] rounded-full" />
      </div>
      
      {/* Vignette nas bordas */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(30, 8, 43, 0.6) 100%)'
      }} />
      {/* Botão Voltar para Home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
        <span className="text-white font-medium text-sm">Voltar</span>
      </Link>

      {/* Partículas discretas */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 80px,
            #B96FFF 80px,
            #B96FFF 81px
          ),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 100px,
            #B96FFF 100px,
            #B96FFF 101px
          )
        `,
      }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-4 relative">
          <img src={logo} alt="Sou Artista" className="h-20 w-auto relative z-10 drop-shadow-[0_0_25px_rgba(185,111,255,0.4)]" />
        </div>

        {/* Card com tema premium */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#B96FFF] opacity-10 blur-[50px] rounded-3xl" />
          
          {/* Card */}
          <div className="relative z-10 rounded-3xl p-4 space-y-3 border border-[#B96FFF]/20" style={{
            background: 'rgba(42, 23, 56, 0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(185, 111, 255, 0.15)'
          }}>
          <div className="space-y-3">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-heading font-bold text-white">Criar conta</h1>
              <p className="text-[#C8BAD4]">Etapa {step} de 4</p>
            </div>
            
            <Progress value={progress} className="h-2" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {step === 1 && (
              <>
                {/* Avatar Upload */}
                <div className="flex flex-col items-center space-y-2 mb-2">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-[#B96FFF]">
                      <AvatarImage src={photoPreview} />
                      <AvatarFallback className="bg-[#1B0D29] text-[#B96FFF] text-2xl">
                        <Camera className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-[#B96FFF] rounded-full p-2 cursor-pointer hover:bg-[#A15EEF] transition-colors">
                      <Camera className="w-3 h-3 text-white" />
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-[#C8BAD4]">Adicionar foto (opcional)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 bg-[#1B0D29] border-[#B96FFF] text-white placeholder:text-[#C8BAD4]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 bg-[#1B0D29] border-[#B96FFF] text-white placeholder:text-[#C8BAD4]"
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
                  <Label htmlFor="cpf" className="text-white">CPF</Label>
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
                    className="h-11 bg-[#1B0D29] border-[#B96FFF] text-white placeholder:text-[#C8BAD4]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-white">Data de nascimento</Label>
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
                    <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
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
                  <Label htmlFor="phone" className="text-white">WhatsApp</Label>
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
                    className="h-11 bg-[#1B0D29] border-[#B96FFF] text-white placeholder:text-[#C8BAD4]"
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
                  <Label htmlFor="password" className="text-white">Senha</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    className="h-11 bg-[#1B0D29] border-[#B96FFF] text-white placeholder:text-[#C8BAD4]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirmar senha</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                    className="h-11 bg-[#1B0D29] border-[#B96FFF] text-white placeholder:text-[#C8BAD4]"
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

            {step === 4 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#B96FFF]/20 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-[#B96FFF]" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Verifique seu email</h2>
                    <p className="text-sm text-[#C8BAD4]">
                      Digite o código de 6 dígitos enviado para<br />
                      <span className="text-white font-medium">{registeredEmail}</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-white border-[#B96FFF]" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-white border-[#B96FFF]" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-white border-[#B96FFF]" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-white border-[#B96FFF]" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-white border-[#B96FFF]" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-white border-[#B96FFF]" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifying || otpCode.length !== 6}
                  className="w-full h-11"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar código'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className="text-sm text-[#B96FFF] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0
                      ? `Reenviar código (${resendTimer}s)`
                      : 'Reenviar código'}
                  </button>
                </div>
              </div>
            )}
          </form>

          {step !== 4 && (
            <div className="text-center text-sm text-[#C8BAD4]">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-[#B96FFF] hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {photoFile && (
        <ImageEditor
          open={imageEditorOpen}
          onOpenChange={setImageEditorOpen}
          imageFile={photoFile}
          onSave={handlePhotoSave}
        />
      )}
    </div>
  );
};

export default Register;
