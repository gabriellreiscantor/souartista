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
import { Music, Loader2, ArrowLeft, CalendarIcon, Camera, Mail, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ImageEditor } from '@/components/ImageEditor';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

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

  // Estados de erro inline
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');

  // Estados para modais de Termos e Privacidade
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    gender: '' as 'male' | 'female' | '',
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

  // Validação de email
  const validateEmail = (email: string): { valid: boolean; error?: string } => {
    const trimmed = email.trim().toLowerCase();
    
    // Regex básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: 'Por favor, insira um e-mail válido' };
    }
    
    const domain = trimmed.split('@')[1];
    
    // Verifica se tem formato válido de domínio
    if (!domain || !domain.includes('.')) {
      return { valid: false, error: 'Domínio de e-mail inválido' };
    }
    
    return { valid: true };
  };

  const handleNext = () => {
    // Limpar erros anteriores
    setNameError('');
    setEmailError('');
    setCpfError('');
    setBirthDateError('');
    setPhoneError('');

    if (step === 1) {
      let hasError = false;
      
      if (!formData.name.trim()) {
        setNameError('Por favor, preencha seu nome');
        hasError = true;
      }
      
      if (!formData.email.trim()) {
        setEmailError('Por favor, preencha o e-mail');
        hasError = true;
      } else {
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.valid) {
          setEmailError(emailValidation.error || 'E-mail inválido');
          hasError = true;
        }
      }
      
      if (hasError) return;
    }
    
    if (step === 2) {
      let hasError = false;
      
      if (!formData.cpf || formData.cpf.replace(/\D/g, '').length < 11) {
        setCpfError('Por favor, preencha o CPF completo');
        hasError = true;
      }
      if (!formData.birthDate) {
        setBirthDateError('Selecione sua data de nascimento');
        hasError = true;
      } else {
        // Validação de idade mínima (14 anos)
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Ajustar idade se ainda não fez aniversário este ano
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 14) {
          setBirthDateError('Você precisa ter no mínimo 14 anos para criar uma conta');
          hasError = true;
        }
      }
      
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (!formData.phone || cleanPhone.length < 13) {
        setPhoneError('Por favor, preencha o WhatsApp completo');
        hasError = true;
      }

      if (!formData.gender) {
        toast({
          title: 'Selecione seu sexo',
          variant: 'destructive',
        });
        hasError = true;
      }
      
      if (hasError) return;
    }

    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = async () => {
    // Se está na etapa 4 (OTP), fazer logout e ir para home
    if (step === 4) {
      const { signOut } = await import('@/hooks/useAuth').then(m => ({ signOut: m.useAuth }));
      // Signout usando supabase diretamente
      await supabase.auth.signOut();
      navigate('/');
      return;
    }
    
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpar erros anteriores
    setPasswordError('');
    setConfirmPasswordError('');
    setEmailError('');
    setCpfError('');
    setPhoneError('');

    let hasError = false;

    if (!formData.password || formData.password.length < 6) {
      setPasswordError('A senha deve ter no mínimo 6 caracteres');
      hasError = true;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError('As senhas não conferem');
      hasError = true;
    }

    if (hasError) return;

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
        setStep(1);
        setEmailError('Este e-mail já possui uma conta');
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
        setStep(2);
        setCpfError('Este CPF já possui uma conta');
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
        setStep(2);
        setPhoneError('Este telefone já possui uma conta');
        return;
      }

      // Criar a conta
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        cpf: cleanCpf,
        birth_date: formData.birthDate,
        phone: formData.phone,
        gender: formData.gender as 'male' | 'female',
      });

      if (error) {
        // Mapear erros para campos específicos
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          setStep(1);
          setEmailError('Este e-mail já está cadastrado');
        } else if (error.message.includes('password')) {
          setPasswordError('A senha deve ter no mínimo 6 caracteres');
        } else if (error.message.includes('email')) {
          setStep(1);
          setEmailError('Por favor, insira um e-mail válido');
        } else {
          // Para erros genéricos, usar toast
          toast({
            title: 'Erro ao criar conta',
            description: error.message,
            variant: 'destructive',
          });
        }
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
    setOtpError('');
    
    if (otpCode.length !== 6) {
      setOtpError('Digite o código de 6 dígitos');
      return;
    }

    setVerifying(true);

    const { error } = await verifyOtp(registeredEmail, otpCode);

    if (error) {
      setOtpError('Código inválido ou expirado');
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

    // === SISTEMA DE INDICAÇÃO: Capturar referral code ===
    const referralCode = localStorage.getItem('referral_code');
    if (referralCode) {
      try {
        // Obter session para pegar o user_id
        const { data: sessionData } = await supabase.auth.getSession();
        const newUserId = sessionData?.session?.user?.id;

        if (newUserId) {
          // Buscar quem é o dono do código
          const { data: codeData } = await supabase
            .from('referral_codes')
            .select('user_id')
            .eq('code', referralCode.toUpperCase())
            .maybeSingle();

          // Validar: código existe e não é auto-indicação
          if (codeData && codeData.user_id !== newUserId) {
            // Criar referral pendente
            const { error: refError } = await supabase
              .from('referrals')
              .insert({
                referrer_id: codeData.user_id,
                referred_id: newUserId,
                status: 'pending',
              });

            if (refError) {
              console.error('❌ Error creating referral:', refError);
            } else {
              console.log('✅ Referral created successfully for code:', referralCode);
            }
          } else if (codeData?.user_id === newUserId) {
            console.warn('⚠️ Self-referral attempted and blocked');
          } else {
            console.warn('⚠️ Invalid referral code:', referralCode);
          }
        }
      } catch (refError) {
        console.error('❌ Error processing referral:', refError);
      } finally {
        // Sempre remover o código do localStorage após processar
        localStorage.removeItem('referral_code');
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
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setNameError('');
                    }}
                    className={`h-11 bg-[#1B0D29] text-white placeholder:text-[#C8BAD4] ${
                      nameError ? 'border-red-500' : 'border-[#B96FFF]'
                    }`}
                  />
                  {nameError && (
                    <p className="text-red-500 text-xs mt-1">{nameError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setEmailError('');
                    }}
                    className={`h-11 bg-[#1B0D29] text-white placeholder:text-[#C8BAD4] ${
                      emailError ? 'border-red-500' : 'border-[#B96FFF]'
                    }`}
                  />
                  {emailError && (
                    <p className="text-red-500 text-xs mt-1">{emailError}</p>
                  )}
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
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      setFormData({ ...formData, cpf: formatted });
                      setCpfError('');
                    }}
                    maxLength={14}
                    className={`h-11 bg-[#1B0D29] text-white placeholder:text-[#C8BAD4] ${
                      cpfError ? 'border-red-500' : 'border-[#B96FFF]'
                    }`}
                  />
                  {cpfError && (
                    <p className="text-red-500 text-xs mt-1">{cpfError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-white">Data de nascimento</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-11 w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                          birthDateError ? "border-red-500" : ""
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
                          setBirthDateError('');
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
                  {birthDateError && (
                    <p className="text-red-500 text-xs mt-1">{birthDateError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="+55 65 9 9614-6969"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData({ ...formData, phone: formatted });
                      setPhoneError('');
                    }}
                    onFocus={(e) => {
                      // Move cursor para o final para evitar edição do +55
                      const length = e.target.value.length;
                      setTimeout(() => e.target.setSelectionRange(length, length), 0);
                    }}
                    maxLength={19}
                    className={`h-11 bg-[#1B0D29] text-white placeholder:text-[#C8BAD4] ${
                      phoneError ? 'border-red-500' : 'border-[#B96FFF]'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Sexo</Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'male' })}
                      className={`flex-1 h-11 rounded-md border-2 text-sm font-medium transition-all ${
                        formData.gender === 'male'
                          ? 'bg-[#B96FFF] border-[#B96FFF] text-white'
                          : 'bg-[#1B0D29] border-[#B96FFF]/50 text-[#C8BAD4] hover:border-[#B96FFF]'
                      }`}
                    >
                      Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'female' })}
                      className={`flex-1 h-11 rounded-md border-2 text-sm font-medium transition-all ${
                        formData.gender === 'female'
                          ? 'bg-[#B96FFF] border-[#B96FFF] text-white'
                          : 'bg-[#1B0D29] border-[#B96FFF]/50 text-[#C8BAD4] hover:border-[#B96FFF]'
                      }`}
                    >
                      Feminino
                    </button>
                  </div>
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
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setPasswordError('');
                    }}
                    disabled={loading}
                    className={`h-11 bg-[#1B0D29] text-white placeholder:text-[#C8BAD4] ${
                      passwordError ? 'border-red-500' : 'border-[#B96FFF]'
                    }`}
                  />
                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirmar senha</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      setConfirmPasswordError('');
                    }}
                    disabled={loading}
                    className={`h-11 bg-[#1B0D29] text-white placeholder:text-[#C8BAD4] ${
                      confirmPasswordError ? 'border-red-500' : 'border-[#B96FFF]'
                    }`}
                  />
                  {confirmPasswordError && (
                    <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
                  )}
                </div>

                {/* Checkbox de aceite dos Termos e Privacidade */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-0.5 border-[#B96FFF] data-[state=checked]:bg-[#B96FFF] data-[state=checked]:border-[#B96FFF]"
                  />
                  <label htmlFor="accept-terms" className="text-xs text-[#C8BAD4] cursor-pointer leading-relaxed">
                    Li e aceito os{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsModalOpen(true);
                      }}
                      className="text-[#B96FFF] hover:underline font-medium"
                    >
                      Termos de Uso
                    </button>{' '}
                    e a{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPrivacyModalOpen(true);
                      }}
                      className="text-[#B96FFF] hover:underline font-medium"
                    >
                      Política de Privacidade
                    </button>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleBack} variant="outline" className="flex-1 h-11" disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1 h-11" disabled={loading || !acceptedTerms}>
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
                {/* Botão Voltar no topo da etapa 4 */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 text-[#C8BAD4] hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Cancelar verificação</span>
                </button>
                
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

                <div className="flex flex-col items-center gap-2">
                  <InputOTP 
                    maxLength={6} 
                    value={otpCode} 
                    onChange={(value) => {
                      setOtpCode(value);
                      setOtpError('');
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className={`h-12 w-12 text-white ${otpError ? 'border-red-500' : 'border-[#B96FFF]'}`} />
                      <InputOTPSlot index={1} className={`h-12 w-12 text-white ${otpError ? 'border-red-500' : 'border-[#B96FFF]'}`} />
                      <InputOTPSlot index={2} className={`h-12 w-12 text-white ${otpError ? 'border-red-500' : 'border-[#B96FFF]'}`} />
                      <InputOTPSlot index={3} className={`h-12 w-12 text-white ${otpError ? 'border-red-500' : 'border-[#B96FFF]'}`} />
                      <InputOTPSlot index={4} className={`h-12 w-12 text-white ${otpError ? 'border-red-500' : 'border-[#B96FFF]'}`} />
                      <InputOTPSlot index={5} className={`h-12 w-12 text-white ${otpError ? 'border-red-500' : 'border-[#B96FFF]'}`} />
                    </InputOTPGroup>
                  </InputOTP>
                  {otpError && (
                    <p className="text-red-500 text-xs">{otpError}</p>
                  )}
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

      {/* Modal Termos de Uso */}
      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Termos de Uso</DialogTitle>
          </DialogHeader>
          <ScrollArea className="px-6 pb-6 max-h-[60vh]">
            <div className="space-y-4 text-sm text-gray-600">
              <p className="text-xs text-gray-500">Última atualização: Janeiro de 2026</p>
              
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">1. Aceitação dos Termos</h3>
                <p>Ao acessar e usar o SouArtista, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá usar nossos serviços.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">2. Descrição do Serviço</h3>
                <p>O SouArtista é uma plataforma de gestão profissional para artistas e músicos, oferecendo ferramentas para gerenciamento de shows, finanças, agenda e relatórios.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">3. Cadastro e Conta</h3>
                <p>Você é responsável por manter a confidencialidade de sua conta e senha. Todas as atividades realizadas em sua conta são de sua responsabilidade.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">4. Acesso Administrativo e Uso de Dados</h3>
                <p>Para fins de operação, suporte, segurança, análise e gestão da plataforma, os administradores do SouArtista (incluindo perfis de CEO, COO ou funções equivalentes) poderão acessar dados cadastrais e operacionais dos usuários, tais como nome, e-mail, telefone, CPF, informações de plano, bem como dados financeiros inseridos na plataforma relacionados à atividade profissional do usuário, incluindo registros de shows, cachês, receitas, despesas e indicadores financeiros agregados.</p>
                <p className="mt-2">O SouArtista não acessa senhas, códigos de autenticação, dados completos de cartões de crédito ou informações bancárias sensíveis, os quais são processados exclusivamente por parceiros de pagamento externos.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">5. Uso Aceitável</h3>
                <p>Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos. É proibido usar o serviço para qualquer atividade ilegal ou não autorizada.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">6. Pagamentos e Assinaturas</h3>
                <p>Os planos de assinatura são cobrados de forma recorrente. Você pode cancelar a qualquer momento, mas não haverá reembolso proporcional do período já pago.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">7. Limitação de Responsabilidade</h3>
                <p>O SouArtista não se responsabiliza por perdas ou danos indiretos resultantes do uso ou impossibilidade de uso do serviço.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">8. Contato</h3>
                <p>Para dúvidas sobre estes termos, entre em contato pelo e-mail: contato@souartista.com.br</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal Política de Privacidade */}
      <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Política de Privacidade</DialogTitle>
          </DialogHeader>
          <ScrollArea className="px-6 pb-6 max-h-[60vh]">
            <div className="space-y-4 text-sm text-gray-600">
              <p className="text-xs text-gray-500">Última atualização: Janeiro de 2026</p>
              
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">1. Informações que Coletamos</h3>
                <p>Coletamos informações fornecidas diretamente pelo usuário no momento do cadastro e durante o uso da plataforma, incluindo nome, e-mail, telefone, CPF, data de nascimento, informações de plano e dados relacionados à atividade profissional, como registros de shows, cachês, receitas, despesas e outros dados financeiros inseridos pelo próprio usuário.</p>
                <p className="mt-2">Também coletamos informações técnicas e de uso da plataforma, como datas de acesso, interações com funcionalidades e dados necessários para suporte e segurança.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">2. Como Usamos Suas Informações</h3>
                <p>Utilizamos suas informações para fornecer e melhorar nossos serviços, processar pagamentos, enviar comunicações importantes e personalizar sua experiência.</p>
                <p className="mt-2">As informações coletadas poderão ser acessadas por administradores autorizados da plataforma exclusivamente para fins de operação, manutenção, suporte ao usuário, análise interna, geração de relatórios, prevenção a fraudes e melhoria contínua do serviço.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">3. Compartilhamento de Informações</h3>
                <p>Não vendemos suas informações pessoais. Podemos compartilhar dados com processadores de pagamento e outros parceiros essenciais para a operação do serviço.</p>
                <p className="mt-2">O SouArtista não comercializa dados pessoais. Dados financeiros de pagamento são processados por parceiros externos (como operadoras de pagamento e lojas de aplicativos), não sendo armazenados integralmente em nossos sistemas.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">4. Segurança</h3>
                <p>Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração ou destruição.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">5. Seus Direitos</h3>
                <p>Você tem direito de acessar, corrigir ou excluir suas informações pessoais. Para exercer esses direitos, entre em contato conosco.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">6. Contato</h3>
                <p>Para questões sobre privacidade, entre em contato pelo e-mail: contato@souartista.com.br</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
