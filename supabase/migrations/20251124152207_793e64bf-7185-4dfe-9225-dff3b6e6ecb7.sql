-- Permitir que admins possam adicionar outros admins
CREATE POLICY "Admins can insert admin users"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Permitir que admins possam remover outros admins
CREATE POLICY "Admins can delete admin users"
ON public.admin_users
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));