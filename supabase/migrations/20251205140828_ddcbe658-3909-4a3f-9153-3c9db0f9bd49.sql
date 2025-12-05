-- Drop the insecure SELECT policy
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;

-- Create a secure policy that restricts notification visibility
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (
  -- User-specific notifications
  user_id = auth.uid()
  OR
  -- Notifications created by the user (system notifications)
  created_by = auth.uid()
  OR
  -- Role-based notifications (matches user's role)
  (target_role IS NOT NULL AND target_role = (get_user_role(auth.uid()))::text)
  OR
  -- Global notifications (no specific target)
  (user_id IS NULL AND target_role IS NULL)
  OR
  -- Admins can see all
  is_admin(auth.uid())
);