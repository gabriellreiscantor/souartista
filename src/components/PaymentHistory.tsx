import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentHistoryProps {
  subscription_id: string;
  paymentMethod?: string;
  subscriptionStatus?: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  payment_method: string | null;
  created_at: string;
}

export function PaymentHistory({ subscription_id, paymentMethod, subscriptionStatus }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchPaymentHistory();
  }, [subscription_id]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('subscription_id', subscription_id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setPayments(data as PaymentRecord[] || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extrair anos disponíveis (mais recente primeiro)
  const availableYears = useMemo(() => {
    const years = [...new Set(payments.map(p => new Date(p.due_date).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [payments]);

  // Atualizar ano selecionado quando os pagamentos carregarem
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  // Filtrar pagamentos pelo ano selecionado
  const filteredPayments = useMemo(() => {
    return payments.filter(p => new Date(p.due_date).getFullYear() === selectedYear);
  }, [payments, selectedYear]);

  // Navegação entre anos
  const currentYearIndex = availableYears.indexOf(selectedYear);
  const canGoNext = currentYearIndex > 0;
  const canGoPrev = currentYearIndex < availableYears.length - 1;

  const goToNextYear = () => {
    if (canGoNext) setSelectedYear(availableYears[currentYearIndex - 1]);
  };

  const goToPrevYear = () => {
    if (canGoPrev) setSelectedYear(availableYears[currentYearIndex + 1]);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      paid: { label: 'Pago', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Vencido', className: 'bg-red-100 text-red-800' },
      failed: { label: 'Falhou', className: 'bg-gray-100 text-gray-800' }
    };
    const { label, className } = config[status as keyof typeof config] || config.failed;
    return <Badge className={className}>{label}</Badge>;
  };

  if (loading) {
    return (
      <Card className="bg-white border border-black shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    const getEmptyMessage = () => {
      if (paymentMethod === 'CREDIT_CARD' && (subscriptionStatus === 'active' || subscriptionStatus === 'pending')) {
        return 'Você está no período de teste de 7 dias. A primeira cobrança será feita automaticamente após o término do período de teste.';
      }
      if (paymentMethod === 'PIX') {
        return 'Quando você realizar um pagamento via PIX, ele aparecerá aqui no histórico.';
      }
      return 'Nenhum histórico de pagamentos encontrado.';
    };

    return (
      <Card className="bg-white border border-black shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            {getEmptyMessage()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-black shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">Histórico de Pagamentos</CardTitle>
        
        {/* Navegação por Ano */}
        {availableYears.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevYear}
              disabled={!canGoPrev}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-gray-900 min-w-[60px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextYear}
              disabled={!canGoNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg gap-2 bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(payment.status)}
                  <span className="text-sm font-medium text-gray-900">
                    R$ {Number(payment.amount).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Vencimento: {format(new Date(payment.due_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
                {payment.payment_date && (
                  <p className="text-xs text-gray-500">
                    Pago em: {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
