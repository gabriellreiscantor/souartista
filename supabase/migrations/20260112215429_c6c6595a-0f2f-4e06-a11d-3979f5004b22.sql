
-- =====================================================
-- SISTEMA DE INDICAÇÃO BLINDADO - ANTI-FRAUDE
-- =====================================================

-- 1. Tabela referral_codes: Armazena código único de cada usuário
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela referrals: Rastreia cada indicação com status progressivo
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'awaiting_validation', 'validated', 'rewarded', 'cancelled')),
  referred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  validation_deadline TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE,
  payment_platform TEXT CHECK (payment_platform IN ('asaas', 'apple')),
  first_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- 3. Tabela referral_rewards: Registra recompensas concedidas
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referrals_count INTEGER NOT NULL DEFAULT 5,
  reward_type TEXT NOT NULL DEFAULT 'free_month',
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  days_added INTEGER NOT NULL DEFAULT 30,
  original_next_due_date TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_reward_per_cycle UNIQUE (user_id, referrals_count)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_referrals_validation_deadline ON public.referrals(validation_deadline) WHERE status = 'awaiting_validation';
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);

-- =====================================================
-- HABILITAR RLS
-- =====================================================
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - REFERRAL_CODES
-- =====================================================
-- Usuários podem ver apenas seu próprio código
CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Service role pode gerenciar (para triggers/webhooks)
CREATE POLICY "Service can manage referral codes"
  ON public.referral_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- POLÍTICAS RLS - REFERRALS
-- =====================================================
-- Usuários podem ver suas indicações (como indicador)
CREATE POLICY "Users can view own referrals as referrer"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Usuários podem ver se foram indicados
CREATE POLICY "Users can view own referral as referred"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_id);

-- Service role pode gerenciar (webhooks não podem permitir cliente alterar status)
CREATE POLICY "Service can manage referrals"
  ON public.referrals FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- POLÍTICAS RLS - REFERRAL_REWARDS
-- =====================================================
-- Usuários podem ver suas próprias recompensas
CREATE POLICY "Users can view own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Service role pode gerenciar
CREATE POLICY "Service can manage rewards"
  ON public.referral_rewards FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TRIGGER: Atualizar updated_at em referrals
-- =====================================================
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNÇÃO: Gerar código de indicação único
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Gerar código único de 8 caracteres
  LOOP
    new_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text || RANDOM()::text) FROM 1 FOR 8));
    
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Inserir código para o novo usuário
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, new_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: Gerar código automaticamente ao criar perfil
-- =====================================================
CREATE TRIGGER on_profile_created_generate_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- =====================================================
-- GERAR CÓDIGOS PARA USUÁRIOS EXISTENTES
-- =====================================================
INSERT INTO public.referral_codes (user_id, code)
SELECT 
  p.id,
  UPPER(SUBSTRING(MD5(p.id::text || NOW()::text || RANDOM()::text) FROM 1 FOR 8))
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.referral_codes rc WHERE rc.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;
