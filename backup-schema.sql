-- ===============================================
-- SCHEMA COMPLETO PARA SUPABASE DE BACKUP
-- Execute este SQL no SQL Editor do projeto de backup
-- ===============================================

-- Tabela: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  birth_date TEXT,
  photo_url TEXT,
  status_plano TEXT DEFAULT 'inactive',
  plan_type TEXT,
  fcm_token TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  gender TEXT,
  is_verified BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  plan_purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: user_devices
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_name TEXT,
  fcm_token TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: artists
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: musicians
CREATE TABLE IF NOT EXISTS public.musicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL,
  name TEXT NOT NULL,
  instrument TEXT NOT NULL,
  default_fee NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: venues
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: musician_venues
CREATE TABLE IF NOT EXISTS public.musician_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: musician_instruments
CREATE TABLE IF NOT EXISTS public.musician_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: shows
CREATE TABLE IF NOT EXISTS public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL,
  venue_name TEXT NOT NULL,
  date_local DATE NOT NULL,
  time_local TEXT NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  duration_hours NUMERIC DEFAULT 3,
  is_private_event BOOLEAN DEFAULT false,
  team_musician_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  expenses_team JSONB DEFAULT '[]'::jsonb,
  expenses_other JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: locomotion_expenses
CREATE TABLE IF NOT EXISTS public.locomotion_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL,
  show_id UUID,
  type TEXT NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  distance_km NUMERIC,
  price_per_liter NUMERIC,
  vehicle_consumption NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_platform TEXT DEFAULT 'asaas',
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT,
  apple_product_id TEXT,
  apple_original_transaction_id TEXT,
  next_due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: payment_history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  asaas_payment_id TEXT,
  payment_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: referral_codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_platform TEXT,
  first_payment_id TEXT,
  referred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  validation_deadline TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: referral_rewards
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'free_month',
  referrals_count INTEGER NOT NULL DEFAULT 5,
  days_added INTEGER NOT NULL DEFAULT 30,
  original_next_due_date TIMESTAMPTZ,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  created_by UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  target_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: notification_reads
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: notification_hidden
CREATE TABLE IF NOT EXISTS public.notification_hidden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: system_announcements
CREATE TABLE IF NOT EXISTS public.system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_role TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: announcement_dismissed
CREATE TABLE IF NOT EXISTS public.announcement_dismissed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL,
  user_id UUID NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  attachment_url TEXT,
  escalated_to_admin BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  escalated_by UUID,
  escalation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: support_responses
CREATE TABLE IF NOT EXISTS public.support_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: user_feedback
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: lgpd_requests
CREATE TABLE IF NOT EXISTS public.lgpd_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  admin_notes TEXT,
  handled_by UUID,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: deleted_users
CREATE TABLE IF NOT EXISTS public.deleted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  birth_date TEXT,
  photo_url TEXT,
  plan_type TEXT,
  status_plano TEXT,
  timezone TEXT,
  gender TEXT,
  fcm_token TEXT,
  status TEXT NOT NULL DEFAULT 'pending_deletion',
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_by UUID NOT NULL,
  scheduled_permanent_delete_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  restored_at TIMESTAMPTZ,
  restored_by UUID,
  permanently_deleted_at TIMESTAMPTZ,
  user_roles JSONB DEFAULT '[]'::jsonb,
  artists JSONB DEFAULT '[]'::jsonb,
  musicians JSONB DEFAULT '[]'::jsonb,
  venues JSONB DEFAULT '[]'::jsonb,
  musician_venues JSONB DEFAULT '[]'::jsonb,
  musician_instruments JSONB DEFAULT '[]'::jsonb,
  shows JSONB DEFAULT '[]'::jsonb,
  locomotion_expenses JSONB DEFAULT '[]'::jsonb,
  subscriptions JSONB DEFAULT '[]'::jsonb,
  referral_codes JSONB DEFAULT '[]'::jsonb,
  referrals_as_referrer JSONB DEFAULT '[]'::jsonb,
  referrals_as_referred JSONB DEFAULT '[]'::jsonb,
  support_tickets JSONB DEFAULT '[]'::jsonb,
  support_responses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: app_updates
CREATE TABLE IF NOT EXISTS public.app_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  release_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: otp_codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: fcm_token_history
CREATE TABLE IF NOT EXISTS public.fcm_token_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_name TEXT,
  fcm_token TEXT NOT NULL,
  action TEXT NOT NULL,
  old_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: push_notification_logs
CREATE TABLE IF NOT EXISTS public.push_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  error_code TEXT,
  device_id TEXT,
  platform TEXT,
  fcm_token_preview TEXT,
  response_data JSONB,
  source TEXT DEFAULT 'manual',
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: engagement_tip_logs
CREATE TABLE IF NOT EXISTS public.engagement_tip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tip_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: marketing_notification_logs
CREATE TABLE IF NOT EXISTS public.marketing_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  message_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: show_notification_logs
CREATE TABLE IF NOT EXISTS public.show_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: subscription_reminder_logs
CREATE TABLE IF NOT EXISTS public.subscription_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: backup_logs
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tables_copied INTEGER NOT NULL DEFAULT 0,
  records_copied INTEGER NOT NULL DEFAULT 0,
  files_copied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  duration_seconds NUMERIC,
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===============================================
-- STORAGE BUCKETS
-- Criar estes buckets no Storage do projeto de backup
-- ===============================================
-- 1. profile-photos (público)
-- 2. support-attachments (privado)

-- Para criar via SQL:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- FIM DO SCHEMA
-- Após executar este SQL, rode o backup novamente
-- ===============================================
