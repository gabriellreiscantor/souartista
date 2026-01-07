-- Tabela de avisos do sistema
CREATE TABLE public.system_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Tabela para registrar quem já fechou o aviso
CREATE TABLE public.announcement_dismissed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.system_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissed ENABLE ROW LEVEL SECURITY;

-- Policies para system_announcements
CREATE POLICY "Authenticated users can view active announcements"
ON public.system_announcements
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can view all announcements"
ON public.system_announcements
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert announcements"
ON public.system_announcements
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements"
ON public.system_announcements
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements"
ON public.system_announcements
FOR DELETE
USING (is_admin(auth.uid()));

-- Policies para announcement_dismissed
CREATE POLICY "Users can view own dismissed"
ON public.announcement_dismissed
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissed"
ON public.announcement_dismissed
FOR INSERT
WITH CHECK (auth.uid() = user_id);