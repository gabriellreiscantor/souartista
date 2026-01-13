-- Create table for soft-deleted users (trash bin)
CREATE TABLE public.deleted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_permanent_delete_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  deleted_by UUID NOT NULL,
  restored_at TIMESTAMPTZ,
  restored_by UUID,
  permanently_deleted_at TIMESTAMPTZ,
  
  -- User profile data for restoration
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
  
  -- Related data (JSON to preserve structure)
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
  
  -- Status: pending_deletion, restored, permanently_deleted
  status TEXT NOT NULL DEFAULT 'pending_deletion',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_deleted_users_status ON public.deleted_users(status);
CREATE INDEX idx_deleted_users_scheduled_delete ON public.deleted_users(scheduled_permanent_delete_at) WHERE status = 'pending_deletion';
CREATE INDEX idx_deleted_users_original_user_id ON public.deleted_users(original_user_id);

-- Enable RLS
ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view deleted users
CREATE POLICY "Admins can view deleted users"
ON public.deleted_users
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can insert (when deleting users)
CREATE POLICY "Admins can insert deleted users"
ON public.deleted_users
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update (when restoring or marking as permanently deleted)
CREATE POLICY "Admins can update deleted users"
ON public.deleted_users
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can delete (cleanup old records)
CREATE POLICY "Admins can delete from deleted users"
ON public.deleted_users
FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_deleted_users_updated_at
BEFORE UPDATE ON public.deleted_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();