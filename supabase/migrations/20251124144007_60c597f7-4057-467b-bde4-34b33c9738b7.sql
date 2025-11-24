-- Permitir que admins deletem notificações
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));