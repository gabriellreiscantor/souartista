import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

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
      toast({
        title: "Código incompleto",
        description: "Digite o código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      const { error } = await verifyOtp(email, otpCode);
      if (error) {
        toast({
          title: "Erro na verificação",
          description: error.message || "Código inválido ou expirado",
          variant: "destructive",
        });
        setOtpCode("");
      } else {
        toast({
          title: "Email verificado!",
          description: "Sua conta foi ativada com sucesso.",
        });
        // Refetch user data to update email_confirmed_at
        await refetchUserData();
        navigate("/app");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar código",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      const { error } = await resendOtp(email);
      if (error) {
        toast({
          title: "Erro ao reenviar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Código reenviado",
          description: "Verifique seu email",
        });
        setResendTimer(60);
        setCanResend(false);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
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
