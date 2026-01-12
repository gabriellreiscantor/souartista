import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type ReferralStatus = 'pending' | 'paid' | 'awaiting_validation' | 'validated' | 'rewarded' | 'cancelled';

interface Referral {
  id: string;
  referred_id: string;
  status: ReferralStatus;
  referred_at: string;
  paid_at: string | null;
  validation_deadline: string | null;
  validated_at: string | null;
  referred_name?: string;
}

interface ReferralReward {
  id: string;
  referrals_count: number;
  reward_type: string;
  granted_at: string;
  days_added: number;
}

export function useReferrals() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [validatedCount, setValidatedCount] = useState(0);

  const fetchReferralData = useCallback(async () => {
    if (!userData?.id) return;

    setLoading(true);
    try {
      // Buscar código de indicação do usuário
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (codeError) throw codeError;
      setReferralCode(codeData?.code || null);

      // Buscar indicações feitas pelo usuário
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userData.id)
        .order('referred_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Buscar nomes dos indicados
      const referralsWithNames = await Promise.all(
        (referralsData || []).map(async (ref) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', ref.referred_id)
            .maybeSingle();
          
          return {
            ...ref,
            referred_name: profile?.name || 'Usuário',
          };
        })
      );

      setReferrals(referralsWithNames as Referral[]);

      // Contar indicações validadas (validated ou rewarded)
      const validated = referralsWithNames.filter(
        (r: { status: string }) => r.status === 'validated' || r.status === 'rewarded'
      ).length;
      setValidatedCount(validated);

      // Buscar recompensas
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userData.id);

      if (rewardsError) throw rewardsError;
      setRewards(rewardsData || []);

    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return;
    
    const referralLink = `https://souartista.app/r/${referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: 'Link copiado!',
        description: 'O link de indicação foi copiado para a área de transferência.',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [referralCode, toast]);

  const shareOnWhatsApp = useCallback(() => {
    if (!referralCode) return;
    
    const referralLink = `https://souartista.app/r/${referralCode}`;
    const message = encodeURIComponent(
      `🎵 Conhece o Sou Artista? É o app que uso para organizar meus shows e finanças!\n\n` +
      `Use meu link e comece a usar agora:\n${referralLink}`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }, [referralCode]);

  const shareGeneric = useCallback(async () => {
    if (!referralCode) return;
    
    const referralLink = `https://souartista.app/r/${referralCode}`;
    const shareData = {
      title: 'Sou Artista - Organize seus shows!',
      text: '🎵 Use meu link de indicação e comece a usar o Sou Artista!',
      url: referralLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyReferralCode();
      }
    } catch (error) {
      // User cancelled or share failed, fallback to copy
      if ((error as Error).name !== 'AbortError') {
        await copyReferralCode();
      }
    }
  }, [referralCode, copyReferralCode]);

  const getStatusInfo = useCallback((status: Referral['status']) => {
    switch (status) {
      case 'validated':
      case 'rewarded':
        return {
          label: 'Validado',
          color: 'bg-green-100 text-green-800',
          icon: '✅',
        };
      case 'awaiting_validation':
        return {
          label: 'Aguardando validação',
          color: 'bg-yellow-100 text-yellow-800',
          icon: '⏳',
        };
      case 'paid':
        return {
          label: 'Pago - Aguarde',
          color: 'bg-blue-100 text-blue-800',
          icon: '💰',
        };
      case 'pending':
        return {
          label: 'Pendente',
          color: 'bg-gray-100 text-gray-800',
          icon: '⏱️',
        };
      case 'cancelled':
        return {
          label: 'Não validado',
          color: 'bg-red-100 text-red-800',
          icon: '❌',
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: '•',
        };
    }
  }, []);

  return {
    loading,
    referralCode,
    referrals,
    rewards,
    validatedCount,
    progressPercentage: Math.min((validatedCount / 5) * 100, 100),
    hasEarnedReward: rewards.some(r => r.referrals_count === 5),
    copyReferralCode,
    shareOnWhatsApp,
    shareGeneric,
    getStatusInfo,
    refresh: fetchReferralData,
  };
}
