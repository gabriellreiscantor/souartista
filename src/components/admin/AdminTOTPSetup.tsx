import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Smartphone, Copy, Check, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface AdminTOTPSetupProps {
  onSetupComplete: () => void;
}

export function AdminTOTPSetup({ onSetupComplete }: AdminTOTPSetupProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await supabase.functions.invoke('admin-totp-setup', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.already_configured) {
        toast.info('TOTP já está configurado. Use o código para verificar.');
        onSetupComplete();
        return;
      }

      setQrCodeUrl(response.data.qr_code_url);
      setSecret(response.data.secret);
      toast.success('QR Code gerado! Escaneie com seu autenticador.');
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(error.message || 'Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
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
        toast.success('🔐 Autenticação configurada com sucesso!');
        onSetupComplete();
      } else {
        toast.error(response.data.error || 'Código inválido');
        setCode('');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast.error(error.message || 'Erro ao verificar código');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = async () => {
    if (secret) {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
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
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configurar Autenticação</CardTitle>
          <CardDescription>
            Configure o Google Authenticator para proteger o acesso ao painel admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!qrCodeUrl ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium">Instruções:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Baixe o Google Authenticator no seu celular</li>
                  <li>Clique no botão abaixo para gerar o QR Code</li>
                  <li>Escaneie o QR Code com o app</li>
                  <li>Digite o código de 6 dígitos para confirmar</li>
                </ol>
              </div>
              <Button 
                onClick={generateQRCode} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar QR Code'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code para Google Authenticator" 
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Escaneie este QR Code com o Google Authenticator
                </p>
              </div>

              {/* Manual Entry */}
              {secret && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Ou digite manualmente:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded text-xs font-mono break-all">
                      {secret}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copySecret}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Code Input */}
              <div className="space-y-4">
                <p className="text-sm text-center font-medium">
                  Digite o código de 6 dígitos:
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => setCode(value)}
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
                <Button
                  onClick={verifyCode}
                  disabled={verifying || code.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Confirmar Configuração'
                  )}
                </Button>
              </div>

              {/* Regenerate */}
              <Button
                variant="ghost"
                onClick={generateQRCode}
                disabled={loading}
                className="w-full text-muted-foreground"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar novo QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
