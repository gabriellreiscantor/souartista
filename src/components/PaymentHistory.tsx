import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
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
      <Card className="bg-white">
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
      <Card className="bg-white">
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
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">Histórico de Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-2"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(payment.status)}
                  <span className="text-sm font-medium">
                    R$ {Number(payment.amount).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vencimento: {format(new Date(payment.due_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
                {payment.payment_date && (
                  <p className="text-xs text-muted-foreground">
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
