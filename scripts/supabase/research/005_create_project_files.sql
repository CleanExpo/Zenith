-- Create project_files table
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS project_files_project_id_idx ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS project_files_user_id_idx ON public.project_files(user_id);
CREATE INDEX IF NOT EXISTS project_files_file_type_idx ON public.project_files(file_type);

-- Add RLS policies for project_files
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project files"
    ON public.project_files
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project files"
    ON public.project_files
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project files"
    ON public.project_files
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project files"
    ON public.project_files
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_project_files_updated_at
    BEFORE UPDATE ON public.project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for project files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'Project Files', false)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for project files
CREATE POLICY "Users can upload their own project files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own project files"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own project files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read their own project files"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
