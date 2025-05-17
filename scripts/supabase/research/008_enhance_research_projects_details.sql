-- Migration: Enhance Research Projects with Detailed Fields
-- Description: Adds additional fields to the research_projects table for more detailed project views

-- Add new columns to research_projects table
ALTER TABLE public.research_projects
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')) DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS objectives TEXT[],
ADD COLUMN IF NOT EXISTS methodology TEXT,
ADD COLUMN IF NOT EXISTS collaborators UUID[],
ADD COLUMN IF NOT EXISTS external_links TEXT[],
ADD COLUMN IF NOT EXISTS funding_source TEXT,
ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2);

-- Add comments to the new columns for better documentation
COMMENT ON COLUMN public.research_projects.status IS 'Current status of the project';
COMMENT ON COLUMN public.research_projects.category IS 'Category or type of research project';
COMMENT ON COLUMN public.research_projects.estimated_hours IS 'Estimated hours to complete the project';
COMMENT ON COLUMN public.research_projects.actual_hours IS 'Actual hours spent on the project';
COMMENT ON COLUMN public.research_projects.start_date IS 'When the project was started or is planned to start';
COMMENT ON COLUMN public.research_projects.completion_date IS 'When the project was completed';
COMMENT ON COLUMN public.research_projects.objectives IS 'Array of objectives or goals for the project';
COMMENT ON COLUMN public.research_projects.methodology IS 'Research methodology being used';
COMMENT ON COLUMN public.research_projects.collaborators IS 'Array of user IDs who are collaborating on the project';
COMMENT ON COLUMN public.research_projects.external_links IS 'Array of external links related to the project';
COMMENT ON COLUMN public.research_projects.funding_source IS 'Source of funding for the project';
COMMENT ON COLUMN public.research_projects.budget IS 'Budget allocated for the project';

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_research_projects_status ON public.research_projects(status);

-- Create an index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_research_projects_category ON public.research_projects(category);

-- Create an index on start_date for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_research_projects_start_date ON public.research_projects(start_date);

-- Create an index on completion_date for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_research_projects_completion_date ON public.research_projects(completion_date);

-- Update RLS policies to include the new columns
ALTER POLICY "Users can view their own research projects" ON public.research_projects
USING (auth.uid() = user_id);

ALTER POLICY "Users can insert their own research projects" ON public.research_projects
FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own research projects" ON public.research_projects
FOR UPDATE USING (auth.uid() = user_id);

-- Create a function to search research projects with the new fields
CREATE OR REPLACE FUNCTION public.search_research_projects(
  search_term TEXT,
  status_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date_from TIMESTAMPTZ DEFAULT NULL,
  start_date_to TIMESTAMPTZ DEFAULT NULL,
  completion_date_from TIMESTAMPTZ DEFAULT NULL,
  completion_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF public.research_projects
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.research_projects
  WHERE 
    user_id = auth.uid()
    AND (
      search_term IS NULL
      OR title ILIKE '%' || search_term || '%'
      OR description ILIKE '%' || search_term || '%'
      OR category ILIKE '%' || search_term || '%'
      OR methodology ILIKE '%' || search_term || '%'
      OR funding_source ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1
        FROM unnest(objectives) obj
        WHERE obj ILIKE '%' || search_term || '%'
      )
    )
    AND (status_filter IS NULL OR status = status_filter)
    AND (category_filter IS NULL OR category = category_filter)
    AND (start_date_from IS NULL OR start_date >= start_date_from)
    AND (start_date_to IS NULL OR start_date <= start_date_to)
    AND (completion_date_from IS NULL OR completion_date >= completion_date_from)
    AND (completion_date_to IS NULL OR completion_date <= completion_date_to)
  ORDER BY updated_at DESC;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.search_research_projects TO authenticated;

-- Create a view for project statistics
CREATE OR REPLACE VIEW public.research_project_statistics AS
SELECT
  user_id,
  COUNT(*) AS total_projects,
  COUNT(CASE WHEN status = 'not_started' THEN 1 END) AS not_started_count,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
  COUNT(CASE WHEN status = 'on_hold' THEN 1 END) AS on_hold_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count,
  SUM(estimated_hours) AS total_estimated_hours,
  SUM(actual_hours) AS total_actual_hours,
  SUM(budget) AS total_budget,
  AVG(CASE WHEN completion_date IS NOT NULL AND start_date IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (completion_date - start_date))/86400.0 
      ELSE NULL END) AS avg_completion_days
FROM public.research_projects
GROUP BY user_id;

-- Enable RLS on the view
ALTER VIEW public.research_project_statistics OWNER TO postgres;
GRANT SELECT ON public.research_project_statistics TO authenticated;

CREATE POLICY "Users can view their own project statistics" 
ON public.research_project_statistics
FOR SELECT
USING (auth.uid() = user_id);

-- Enable row level security on the view
ALTER VIEW public.research_project_statistics ENABLE ROW LEVEL SECURITY;
