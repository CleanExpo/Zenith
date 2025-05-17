-- Storage configuration for Supabase

-- Enable storage extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage buckets
INSERT INTO storage.buckets (id, name, owner)
VALUES 
  ('user-avatars', 'user-avatars', 'authenticated'),
  ('research-documents', 'research-documents', 'authenticated'),
  ('project-assets', 'project-assets', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Policies for user-avatars bucket
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Policies for research-documents bucket
CREATE POLICY "Researchers can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'research-documents' AND
  EXISTS (
    SELECT 1 FROM auth.user_profiles
    WHERE user_id = auth.uid() AND role IN ('researcher', 'admin')
  )
);

CREATE POLICY "Researchers can update their documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'research-documents' AND
  EXISTS (
    SELECT 1 FROM auth.user_profiles
    WHERE user_id = auth.uid() AND role IN ('researcher', 'admin')
  )
);

CREATE POLICY "Researchers can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'research-documents' AND
  EXISTS (
    SELECT 1 FROM auth.user_profiles
    WHERE user_id = auth.uid() AND role IN ('researcher', 'admin')
  )
);

-- Policies for project-assets bucket
CREATE POLICY "Researchers can upload project assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-assets' AND
  EXISTS (
    SELECT 1 FROM auth.user_profiles
    WHERE user_id = auth.uid() AND role IN ('researcher', 'admin')
  )
);

CREATE POLICY "Researchers can update project assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-assets' AND
  EXISTS (
    SELECT 1 FROM auth.user_profiles
    WHERE user_id = auth.uid() AND role IN ('researcher', 'admin')
  )
);

CREATE POLICY "Researchers can delete project assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-assets' AND
  EXISTS (
    SELECT 1 FROM auth.user_profiles
    WHERE user_id = auth.uid() AND role IN ('researcher', 'admin')
  )
);

-- Function to get avatar URL
CREATE OR REPLACE FUNCTION auth.get_avatar_url(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN avatar_url IS NOT NULL THEN avatar_url
        ELSE 'https://ui-avatars.com/api/?name=' || 
             REPLACE(full_name, ' ', '+') || 
             '&background=random&color=fff'
      END
    FROM auth.user_profiles
    WHERE user_profiles.user_id = get_avatar_url.user_id
  );
END;
$$ LANGUAGE plpgsql STABLE;
