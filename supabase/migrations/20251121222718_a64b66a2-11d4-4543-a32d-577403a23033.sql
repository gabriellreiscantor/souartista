-- Add attachment_url column to support_tickets table
ALTER TABLE public.support_tickets
ADD COLUMN attachment_url text;

-- Create storage bucket for support ticket attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  15728640, -- 15MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for users to upload their own attachments
CREATE POLICY "Users can upload their own attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for users to view their own attachments
CREATE POLICY "Users can view their own attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for admins to view all attachments
CREATE POLICY "Admins can view all attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND public.is_admin(auth.uid())
);