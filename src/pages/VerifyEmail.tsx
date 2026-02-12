import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import logo from "@/assets/logo.png";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { verifyOtp, resendOtp, signOut, user, refetchUserData } = useAuth();
  const navigate = useNavigate();
  

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }

    setVerifying(true);
    try {
      const { error } = await verifyOtp(email, otpCode);
      if (error) {
        // Mensagem mais clara para código inválido
        const errorMessage = error.message?.toLowerCase().includes('invalid') || 
                            error.message?.toLowerCase().includes('expired') ||
                            error.message?.toLowerCase().includes('inválido') ||
                            error.message?.toLowerCase().includes('expirado')
          ? "Código inválido ou expirado. Verifique o código ou solicite um novo."
          : error.message || "Código inválido ou expirado";
        
        toast.error(errorMessage);
        setOtpCode("");
      } else {
        toast.success("Email verificado!");
        // Refetch user data to update email_confirmed_at
        await refetchUserData();
        navigate("/app");
      }
    } catch (error: any) {
      toast.error(error.message || "Não foi possível verificar o código. Tente novamente.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      const { error } = await resendOtp(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Código reenviado! Verifique seu email");
        setResendTimer(60);
        setCanResend(false);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border/50">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verificar Email
            </h1>
            <p className="text-muted-foreground text-sm">
              Enviamos um código de 6 dígitos para
            </p>
            <p className="text-primary font-medium mt-1">{email}</p>
          </div>

          {/* OTP Input */}
          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerifyOtp}
            disabled={verifying || otpCode.length !== 6}
            className="w-full mb-4"
          >
            {verifying ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {verifying ? "Verificando..." : "Verificar"}
          </Button>

          {/* Resend Code */}
          <div className="text-center mb-4">
            {canResend ? (
              <button
                onClick={handleResendOtp}
                className="text-primary hover:underline text-sm font-medium"
              >
                Reenviar código
              </button>
            ) : (
              <p className="text-muted-foreground text-sm">
                Reenviar código em {resendTimer}s
              </p>
            )}
          </div>

          {/* Cancel Button */}
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar e voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
