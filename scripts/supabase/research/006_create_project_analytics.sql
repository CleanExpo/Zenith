-- Create project_analytics table to store aggregated analytics data
CREATE TABLE IF NOT EXISTS public.project_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_tasks INT NOT NULL DEFAULT 0,
    completed_tasks INT NOT NULL DEFAULT 0,
    overdue_tasks INT NOT NULL DEFAULT 0,
    total_notes INT NOT NULL DEFAULT 0,
    total_files INT NOT NULL DEFAULT 0,
    total_file_size BIGINT NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS project_analytics_project_id_idx ON public.project_analytics(project_id);
CREATE INDEX IF NOT EXISTS project_analytics_user_id_idx ON public.project_analytics(user_id);

-- Add RLS policies for project_analytics
ALTER TABLE public.project_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project analytics"
    ON public.project_analytics
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project analytics"
    ON public.project_analytics
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project analytics"
    ON public.project_analytics
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_project_analytics_updated_at
    BEFORE UPDATE ON public.project_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to update project analytics
CREATE OR REPLACE FUNCTION update_project_analytics()
RETURNS TRIGGER AS $$
DECLARE
    p_id UUID;
    u_id UUID;
    total_tasks_count INT;
    completed_tasks_count INT;
    overdue_tasks_count INT;
    total_notes_count INT;
    total_files_count INT;
    total_files_size BIGINT;
BEGIN
    -- Determine which project to update based on the operation
    IF TG_TABLE_NAME = 'research_projects' THEN
        p_id := NEW.id;
        u_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'project_tasks' THEN
        p_id := NEW.project_id;
        u_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'project_notes' THEN
        p_id := NEW.project_id;
        u_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'project_files' THEN
        p_id := NEW.project_id;
        u_id := NEW.user_id;
    END IF;

    -- Count tasks
    SELECT 
        COUNT(*), 
        COUNT(*) FILTER (WHERE completed = true),
        COUNT(*) FILTER (WHERE due_date < NOW() AND completed = false)
    INTO 
        total_tasks_count, 
        completed_tasks_count,
        overdue_tasks_count
    FROM project_tasks
    WHERE project_id = p_id;

    -- Count notes
    SELECT COUNT(*)
    INTO total_notes_count
    FROM project_notes
    WHERE project_id = p_id;

    -- Count files and total size
    SELECT COUNT(*), COALESCE(SUM(file_size), 0)
    INTO total_files_count, total_files_size
    FROM project_files
    WHERE project_id = p_id;

    -- Insert or update analytics
    INSERT INTO project_analytics (
        project_id,
        user_id,
        total_tasks,
        completed_tasks,
        overdue_tasks,
        total_notes,
        total_files,
        total_file_size,
        last_activity_at
    ) VALUES (
        p_id,
        u_id,
        total_tasks_count,
        completed_tasks_count,
        overdue_tasks_count,
        total_notes_count,
        total_files_count,
        total_files_size,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        total_tasks = total_tasks_count,
        completed_tasks = completed_tasks_count,
        overdue_tasks = overdue_tasks_count,
        total_notes = total_notes_count,
        total_files = total_files_count,
        total_file_size = total_files_size,
        last_activity_at = NOW(),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update analytics when related tables change
CREATE TRIGGER update_analytics_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON public.project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_analytics();

CREATE TRIGGER update_analytics_on_note_change
    AFTER INSERT OR UPDATE OR DELETE ON public.project_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_project_analytics();

CREATE TRIGGER update_analytics_on_file_change
    AFTER INSERT OR UPDATE OR DELETE ON public.project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_project_analytics();

-- Create a view for project progress
CREATE OR REPLACE VIEW public.project_progress AS
SELECT
    p.id,
    p.title,
    p.description,
    p.user_id,
    p.created_at,
    p.updated_at,
    COALESCE(a.total_tasks, 0) AS total_tasks,
    COALESCE(a.completed_tasks, 0) AS completed_tasks,
    CASE 
        WHEN COALESCE(a.total_tasks, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(a.completed_tasks, 0)::FLOAT / COALESCE(a.total_tasks, 0)::FLOAT) * 100)
    END AS completion_percentage,
    COALESCE(a.overdue_tasks, 0) AS overdue_tasks,
    COALESCE(a.total_notes, 0) AS total_notes,
    COALESCE(a.total_files, 0) AS total_files,
    COALESCE(a.total_file_size, 0) AS total_file_size,
    a.last_activity_at
FROM
    public.research_projects p
LEFT JOIN
    public.project_analytics a ON p.id = a.project_id;

-- Add RLS policy for the view
ALTER VIEW public.project_progress SECURITY INVOKER;

-- Create a function to get project activity over time
CREATE OR REPLACE FUNCTION get_project_activity(p_id UUID, days_back INT DEFAULT 30)
RETURNS TABLE (
    activity_date DATE,
    tasks_created INT,
    tasks_completed INT,
    notes_created INT,
    files_uploaded INT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_range AS (
        SELECT generate_series(
            (CURRENT_DATE - (days_back || ' days')::INTERVAL)::DATE,
            CURRENT_DATE,
            '1 day'::INTERVAL
        )::DATE AS activity_date
    ),
    task_creation AS (
        SELECT 
            created_at::DATE AS date,
            COUNT(*) AS count
        FROM 
            project_tasks
        WHERE 
            project_id = p_id
            AND created_at >= (CURRENT_DATE - (days_back || ' days')::INTERVAL)
        GROUP BY 
            created_at::DATE
    ),
    task_completion AS (
        SELECT 
            updated_at::DATE AS date,
            COUNT(*) AS count
        FROM 
            project_tasks
        WHERE 
            project_id = p_id
            AND completed = true
            AND updated_at >= (CURRENT_DATE - (days_back || ' days')::INTERVAL)
        GROUP BY 
            updated_at::DATE
    ),
    note_creation AS (
        SELECT 
            created_at::DATE AS date,
            COUNT(*) AS count
        FROM 
            project_notes
        WHERE 
            project_id = p_id
            AND created_at >= (CURRENT_DATE - (days_back || ' days')::INTERVAL)
        GROUP BY 
            created_at::DATE
    ),
    file_upload AS (
        SELECT 
            created_at::DATE AS date,
            COUNT(*) AS count
        FROM 
            project_files
        WHERE 
            project_id = p_id
            AND created_at >= (CURRENT_DATE - (days_back || ' days')::INTERVAL)
        GROUP BY 
            created_at::DATE
    )
    SELECT
        dr.activity_date,
        COALESCE(tc.count, 0) AS tasks_created,
        COALESCE(tco.count, 0) AS tasks_completed,
        COALESCE(nc.count, 0) AS notes_created,
        COALESCE(fu.count, 0) AS files_uploaded
    FROM
        date_range dr
    LEFT JOIN
        task_creation tc ON dr.activity_date = tc.date
    LEFT JOIN
        task_completion tco ON dr.activity_date = tco.date
    LEFT JOIN
        note_creation nc ON dr.activity_date = nc.date
    LEFT JOIN
        file_upload fu ON dr.activity_date = fu.date
    ORDER BY
        dr.activity_date;
END;
$$ LANGUAGE plpgsql;
