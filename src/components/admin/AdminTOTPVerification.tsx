import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface AdminTOTPVerificationProps {
  onVerified: () => void;
  onNeedsSetup: () => void;
}

export function AdminTOTPVerification({ onVerified, onNeedsSetup }: AdminTOTPVerificationProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (code.length === 6) {
      verifyCode();
    }
  }, [code]);

  const verifyCode = async () => {
    if (code.length !== 6) return;
    if (attempts >= maxAttempts) {
      toast.error('Muitas tentativas. Tente novamente mais tarde.');
      return;
    }

    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await supabase.functions.invoke('admin-totp-verify', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { code },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.verified) {
        toast.success('🔓 Acesso autorizado!');
        onVerified();
      } else {
        setAttempts(prev => prev + 1);
        toast.error(response.data.error || 'Código inválido');
        setCode('');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      
      // Check if TOTP is not configured
      if (error.message?.includes('não configurado')) {
        onNeedsSetup();
        return;
      }
      
      setAttempts(prev => prev + 1);
      toast.error(error.message || 'Erro ao verificar código');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para o App
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verificação de Segurança</CardTitle>
          <CardDescription>
            Digite o código do Google Authenticator para acessar o painel admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {attempts >= maxAttempts ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Limite de tentativas atingido</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Por segurança, aguarde alguns minutos antes de tentar novamente.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
                  disabled={verifying}
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

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
                </div>
              )}

              {attempts > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Tentativas restantes: {maxAttempts - attempts}
                </p>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Abra o Google Authenticator no seu celular e digite o código de 6 dígitos
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
