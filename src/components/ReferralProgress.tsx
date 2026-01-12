import { Gift, Copy, Share2, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useReferrals } from '@/hooks/useReferrals';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ReferralProgress() {
  const {
    loading,
    referralCode,
    referrals,
    validatedCount,
    progressPercentage,
    hasEarnedReward,
    copyReferralCode,
    shareOnWhatsApp,
    getStatusInfo,
  } = useReferrals();

  const [showReferrals, setShowReferrals] = useState(false);

  if (loading) {
    return (
      <Card className="bg-white border-purple-200">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  if (!referralCode) {
    return null;
  }

  return (
    <Card className="bg-white border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Gift className="h-5 w-5" />
          Indicações para 1 mês grátis
        </CardTitle>
        <CardDescription className="text-gray-600">
          Indique 5 amigos que assinem e ganhe 1 mês grátis!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium text-purple-800">{validatedCount}/5</span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-purple-100" />
          {hasEarnedReward && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>Parabéns! Você ganhou 1 mês grátis!</span>
            </div>
          )}
        </div>

        {/* Código para Compartilhar */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Seu código de indicação:</p>
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <span className="font-mono font-bold text-lg text-purple-800 flex-1">
              {referralCode}
            </span>
            <Button size="sm" variant="ghost" onClick={copyReferralCode} className="text-purple-600 hover:text-purple-800 hover:bg-purple-100">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Botão de Compartilhar */}
        <Button 
          onClick={shareOnWhatsApp} 
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar no WhatsApp
        </Button>

        {/* Lista de Indicações */}
        {referrals.length > 0 && (
          <Collapsible open={showReferrals} onOpenChange={setShowReferrals}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-gray-600 hover:text-gray-900">
                <span>Suas indicações ({referrals.length})</span>
                {showReferrals ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {referrals.map((ref) => {
                const statusInfo = getStatusInfo(ref.status);
                return (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {ref.referred_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(ref.referred_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <Badge className={statusInfo.color}>
                      {statusInfo.icon} {statusInfo.label}
                    </Badge>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Informação sobre validação */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Uma indicação é validada após 15 dias do pagamento confirmado do indicado.
              Indicações canceladas ou reembolsadas não contam.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
