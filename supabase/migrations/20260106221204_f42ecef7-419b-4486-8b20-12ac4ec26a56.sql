-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabela para solicitações de direitos LGPD
CREATE TABLE public.lgpd_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'correction', 'deletion', 'opposition', 'portability')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  description TEXT,
  admin_notes TEXT,
  handled_by UUID,
  handled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comentários para documentação
COMMENT ON TABLE public.lgpd_requests IS 'Solicitações de direitos LGPD dos usuários';
COMMENT ON COLUMN public.lgpd_requests.request_type IS 'access=Acesso aos dados, correction=Correção, deletion=Exclusão, opposition=Oposição, portability=Portabilidade';

-- Enable RLS
ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias solicitações
CREATE POLICY "Users can view own LGPD requests"
ON public.lgpd_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias solicitações
CREATE POLICY "Users can create own LGPD requests"
ON public.lgpd_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para admins verem todas as solicitações
CREATE POLICY "Admins can view all LGPD requests"
ON public.lgpd_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Política para admins atualizarem solicitações
CREATE POLICY "Admins can update LGPD requests"
ON public.lgpd_requests
FOR UPDATE
USING (is_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_lgpd_requests_updated_at
BEFORE UPDATE ON public.lgpd_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();