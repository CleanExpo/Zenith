-- Create schema for project templates

-- Project templates table
CREATE TABLE IF NOT EXISTS public.project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    tasks JSONB DEFAULT '[]'::jsonb,
    notes JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS project_templates_created_by_idx ON public.project_templates(created_by);
CREATE INDEX IF NOT EXISTS project_templates_is_public_idx ON public.project_templates(is_public);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_project_templates_updated_at
    BEFORE UPDATE ON public.project_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on templates table
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
-- Users can view their own templates and public templates
CREATE POLICY "Users can view their own templates and public templates"
    ON public.project_templates
    FOR SELECT
    USING (
        auth.uid() = created_by OR is_public = true
    );

-- Users can manage their own templates
CREATE POLICY "Users can manage their own templates"
    ON public.project_templates
    FOR ALL
    USING (auth.uid() = created_by);

-- Function to create a project from a template
CREATE OR REPLACE FUNCTION public.create_project_from_template(
    p_template_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_project_id UUID;
    v_task JSONB;
    v_note JSONB;
BEGIN
    -- Get template data
    SELECT * INTO v_template FROM public.project_templates WHERE id = p_template_id;
    
    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Create new project
    INSERT INTO public.research_projects (
        title,
        description,
        user_id
    ) VALUES (
        v_template.title,
        v_template.description,
        auth.uid()
    ) RETURNING id INTO v_project_id;
    
    -- Add tasks from template
    IF v_template.tasks IS NOT NULL AND jsonb_array_length(v_template.tasks) > 0 THEN
        FOR v_task IN SELECT * FROM jsonb_array_elements(v_template.tasks)
        LOOP
            INSERT INTO public.project_tasks (
                project_id,
                title,
                description,
                due_date,
                completed
            ) VALUES (
                v_project_id,
                v_task->>'title',
                v_task->>'description',
                (v_task->>'due_date')::TIMESTAMP WITH TIME ZONE,
                false
            );
        END LOOP;
    END IF;
    
    -- Add notes from template
    IF v_template.notes IS NOT NULL AND jsonb_array_length(v_template.notes) > 0 THEN
        FOR v_note IN SELECT * FROM jsonb_array_elements(v_template.notes)
        LOOP
            INSERT INTO public.project_notes (
                project_id,
                title,
                content
            ) VALUES (
                v_project_id,
                v_note->>'title',
                v_note->>'content'
            );
        END LOOP;
    END IF;
    
    -- Log activity
    INSERT INTO public.activity_logs (
        project_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_project_id,
        auth.uid(),
        'create_from_template',
        'project',
        v_project_id,
        jsonb_build_object(
            'template_id', p_template_id,
            'template_title', v_template.title
        )
    );
    
    RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save a project as a template
CREATE OR REPLACE FUNCTION public.save_project_as_template(
    p_project_id UUID,
    p_template_title TEXT,
    p_template_description TEXT DEFAULT NULL,
    p_is_public BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    v_project RECORD;
    v_tasks JSONB;
    v_notes JSONB;
    v_template_id UUID;
BEGIN
    -- Get project data
    SELECT * INTO v_project FROM public.research_projects WHERE id = p_project_id;
    
    IF v_project IS NULL THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    -- Check if user has access to the project
    IF NOT EXISTS (
        SELECT 1 FROM public.project_collaborators 
        WHERE project_id = p_project_id 
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
        AND invitation_status = 'accepted'
    ) THEN
        RAISE EXCEPTION 'You do not have permission to create a template from this project';
    END IF;
    
    -- Get tasks
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', title,
            'description', description,
            'due_date', due_date
        )
    ) INTO v_tasks
    FROM public.project_tasks
    WHERE project_id = p_project_id;
    
    -- Get notes
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', title,
            'content', content
        )
    ) INTO v_notes
    FROM public.project_notes
    WHERE project_id = p_project_id;
    
    -- Create template
    INSERT INTO public.project_templates (
        title,
        description,
        tasks,
        notes,
        created_by,
        is_public
    ) VALUES (
        p_template_title,
        COALESCE(p_template_description, v_project.description),
        COALESCE(v_tasks, '[]'::jsonb),
        COALESCE(v_notes, '[]'::jsonb),
        auth.uid(),
        p_is_public
    ) RETURNING id INTO v_template_id;
    
    -- Log activity
    INSERT INTO public.activity_logs (
        project_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_project_id,
        auth.uid(),
        'save_as_template',
        'template',
        v_template_id,
        jsonb_build_object(
            'template_title', p_template_title,
            'is_public', p_is_public
        )
    );
    
    RETURN v_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
