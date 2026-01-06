-- Drop existing policies on user_devices
DROP POLICY IF EXISTS "Users can manage own devices" ON user_devices;
DROP POLICY IF EXISTS "Block anonymous access to user_devices" ON user_devices;
DROP POLICY IF EXISTS "Admins can view all devices" ON user_devices;

-- Create proper policies with WITH CHECK for INSERT
-- Policy for SELECT
CREATE POLICY "Users can view own devices" 
ON user_devices FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for INSERT (requires WITH CHECK)
CREATE POLICY "Users can insert own devices" 
ON user_devices FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (requires both USING and WITH CHECK)
CREATE POLICY "Users can update own devices" 
ON user_devices FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE
CREATE POLICY "Users can delete own devices" 
ON user_devices FOR DELETE 
USING (auth.uid() = user_id);

-- Policy for admins to view all devices
CREATE POLICY "Admins can view all devices" 
ON user_devices FOR SELECT 
USING (public.is_admin(auth.uid()));