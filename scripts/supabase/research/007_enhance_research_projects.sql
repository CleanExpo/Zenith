-- Migration: 007_enhance_research_projects.sql
-- Description: Add additional fields to research_projects table for enhanced project management

-- Add due_date column
ALTER TABLE public.research_projects
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Add priority column with enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_priority') THEN
        CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high');
    END IF;
END$$;

ALTER TABLE public.research_projects
ADD COLUMN IF NOT EXISTS priority project_priority DEFAULT 'medium';

-- Add tags column as an array of strings
ALTER TABLE public.research_projects
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update RLS policies to include new columns
-- Note: This assumes existing RLS policies are already set up for the table

-- Add comment to document the changes
COMMENT ON TABLE public.research_projects IS 'Research projects with enhanced fields for better project management';
COMMENT ON COLUMN public.research_projects.due_date IS 'Optional deadline for the project';
COMMENT ON COLUMN public.research_projects.priority IS 'Priority level of the project (low, medium, high)';
COMMENT ON COLUMN public.research_projects.tags IS 'Array of tags for categorizing the project';
