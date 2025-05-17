-- 008_create_custom_reports_schema.sql

-- Create table for report templates
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    sections JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for custom reports
CREATE TABLE IF NOT EXISTS public.custom_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    template_id UUID REFERENCES public.report_templates(id),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    data JSONB,
    external_data_included BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    last_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for report sections
CREATE TABLE IF NOT EXISTS public.report_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES public.custom_reports(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content JSONB,
    external_data_source_id UUID REFERENCES public.external_data_sources(id),
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for report exports
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES public.custom_reports(id) ON DELETE CASCADE,
    format TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    download_count INTEGER DEFAULT 0
);

-- Create table for report sharing
CREATE TABLE IF NOT EXISTS public.report_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES public.custom_reports(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    permission_level TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(report_id, shared_with)
);

-- Create function to generate report with external data
CREATE OR REPLACE FUNCTION generate_report_with_external_data(p_report_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_report RECORD;
    v_project_id UUID;
    v_config JSONB;
    v_data JSONB := '{}'::JSONB;
    v_sections JSONB := '[]'::JSONB;
    v_section RECORD;
    v_external_data JSONB;
    v_result JSONB;
BEGIN
    -- Get report data
    SELECT * INTO v_report FROM public.custom_reports WHERE id = p_report_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Report not found');
    END IF;
    
    v_project_id := v_report.project_id;
    v_config := v_report.config;
    
    -- Process each section
    FOR v_section IN 
        SELECT * FROM public.report_sections 
        WHERE report_id = p_report_id
        ORDER BY display_order
    LOOP
        -- Process section based on type
        IF v_section.section_type = 'project_summary' THEN
            -- Get project summary data
            SELECT jsonb_build_object(
                'title', p.title,
                'description', p.description,
                'status', p.status,
                'created_at', p.created_at,
                'updated_at', p.updated_at,
                'owner', u.email
            ) INTO v_data
            FROM public.projects p
            JOIN auth.users u ON p.owner_id = u.id
            WHERE p.id = v_project_id;
            
        ELSIF v_section.section_type = 'project_analytics' THEN
            -- Get project analytics data
            SELECT metrics INTO v_data
            FROM public.project_analytics
            WHERE project_id = v_project_id;
            
        ELSIF v_section.section_type = 'external_academic' THEN
            -- Get academic data
            SELECT jsonb_build_object(
                'source', eds.name,
                'data', ede.enriched_data
            ) INTO v_external_data
            FROM public.external_data_enriched_entities ede
            JOIN public.external_data_sources eds ON ede.source_id = eds.id
            WHERE ede.entity_type = 'project'
              AND ede.entity_id = v_project_id
              AND eds.source_type = 'academic_database'
            ORDER BY ede.updated_at DESC
            LIMIT 1;
            
            v_data := v_external_data;
            
        ELSIF v_section.section_type = 'external_funding' THEN
            -- Get funding data
            SELECT jsonb_build_object(
                'source', eds.name,
                'data', ede.enriched_data
            ) INTO v_external_data
            FROM public.external_data_enriched_entities ede
            JOIN public.external_data_sources eds ON ede.source_id = eds.id
            WHERE ede.entity_type = 'project'
              AND ede.entity_id = v_project_id
              AND eds.source_type = 'funding_database'
            ORDER BY ede.updated_at DESC
            LIMIT 1;
            
            v_data := v_external_data;
            
        ELSIF v_section.section_type = 'external_patent' THEN
            -- Get patent data
            SELECT jsonb_build_object(
                'source', eds.name,
                'data', ede.enriched_data
            ) INTO v_external_data
            FROM public.external_data_enriched_entities ede
            JOIN public.external_data_sources eds ON ede.source_id = eds.id
            WHERE ede.entity_type = 'project'
              AND ede.entity_id = v_project_id
              AND eds.source_type = 'patent_database'
            ORDER BY ede.updated_at DESC
            LIMIT 1;
            
            v_data := v_external_data;
            
        ELSIF v_section.section_type = 'ml_predictions' THEN
            -- Get ML predictions
            SELECT jsonb_build_object(
                'completion_prediction', (
                    SELECT prediction_data
                    FROM public.ml_predictions
                    WHERE project_id = v_project_id
                      AND prediction_type = 'completion_date'
                    ORDER BY created_at DESC
                    LIMIT 1
                ),
                'external_features', (
                    SELECT jsonb_object_agg(feature_name, feature_value)
                    FROM public.ml_external_features
                    WHERE project_id = v_project_id
                )
            ) INTO v_data;
            
        ELSIF v_section.section_type = 'custom' THEN
            -- Use custom content
            v_data := v_section.content;
        END IF;
        
        -- Add section to sections array
        v_sections := v_sections || jsonb_build_object(
            'id', v_section.id,
            'type', v_section.section_type,
            'title', v_section.title,
            'data', v_data
        );
    END LOOP;
    
    -- Update report with generated data
    UPDATE public.custom_reports
    SET 
        data = v_sections,
        external_data_included = TRUE,
        last_generated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_report_id;
    
    -- Build result
    v_result := jsonb_build_object(
        'report_id', p_report_id,
        'title', v_report.title,
        'project_id', v_project_id,
        'sections', v_sections,
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to export report to JSON
CREATE OR REPLACE FUNCTION export_report_to_json(p_report_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_report RECORD;
    v_export_id UUID;
    v_file_path TEXT;
    v_json TEXT;
BEGIN
    -- Get report data
    SELECT * INTO v_report FROM public.custom_reports WHERE id = p_report_id;
    
    IF NOT FOUND THEN
        RETURN 'Report not found';
    END IF;
    
    -- Generate report if needed
    IF v_report.last_generated_at IS NULL OR v_report.last_generated_at < v_report.updated_at THEN
        PERFORM generate_report_with_external_data(p_report_id);
        
        -- Refresh report data
        SELECT * INTO v_report FROM public.custom_reports WHERE id = p_report_id;
    END IF;
    
    -- Create JSON export
    v_json := jsonb_pretty(jsonb_build_object(
        'report_id', v_report.id,
        'title', v_report.title,
        'description', v_report.description,
        'project_id', v_report.project_id,
        'created_at', v_report.created_at,
        'last_generated_at', v_report.last_generated_at,
        'data', v_report.data
    ));
    
    -- Generate file path
    v_file_path := 'reports/' || v_report.id || '.json';
    
    -- Create export record
    INSERT INTO public.report_exports (
        report_id,
        format,
        file_path,
        file_size,
        created_by,
        created_at
    ) VALUES (
        p_report_id,
        'json',
        v_file_path,
        length(v_json),
        auth.uid(),
        NOW()
    ) RETURNING id INTO v_export_id;
    
    -- In a real implementation, this would save the file to storage
    -- For now, we'll just return the JSON
    
    RETURN v_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default report templates
INSERT INTO public.report_templates (
    name,
    description,
    sections,
    is_system,
    created_at,
    updated_at
) VALUES (
    'Standard Project Report',
    'A standard report template for research projects',
    jsonb_build_array(
        jsonb_build_object(
            'type', 'project_summary',
            'title', 'Project Summary',
            'required', true
        ),
        jsonb_build_object(
            'type', 'project_analytics',
            'title', 'Project Analytics',
            'required', true
        ),
        jsonb_build_object(
            'type', 'ml_predictions',
            'title', 'Predictions & Forecasts',
            'required', false
        )
    ),
    true,
    NOW(),
    NOW()
), (
    'External Data Report',
    'A report template focusing on external data sources',
    jsonb_build_array(
        jsonb_build_object(
            'type', 'project_summary',
            'title', 'Project Summary',
            'required', true
        ),
        jsonb_build_object(
            'type', 'external_academic',
            'title', 'Academic Research Data',
            'required', false
        ),
        jsonb_build_object(
            'type', 'external_funding',
            'title', 'Funding Information',
            'required', false
        ),
        jsonb_build_object(
            'type', 'external_patent',
            'title', 'Patent Information',
            'required', false
        )
    ),
    true,
    NOW(),
    NOW()
), (
    'Comprehensive Project Report',
    'A comprehensive report template including all data sources',
    jsonb_build_array(
        jsonb_build_object(
            'type', 'project_summary',
            'title', 'Project Summary',
            'required', true
        ),
        jsonb_build_object(
            'type', 'project_analytics',
            'title', 'Project Analytics',
            'required', true
        ),
        jsonb_build_object(
            'type', 'external_academic',
            'title', 'Academic Research Data',
            'required', false
        ),
        jsonb_build_object(
            'type', 'external_funding',
            'title', 'Funding Information',
            'required', false
        ),
        jsonb_build_object(
            'type', 'external_patent',
            'title', 'Patent Information',
            'required', false
        ),
        jsonb_build_object(
            'type', 'ml_predictions',
            'title', 'Predictions & Forecasts',
            'required', false
        )
    ),
    true,
    NOW(),
    NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_reports_project_id ON public.custom_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON public.custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_template_id ON public.custom_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_report_id ON public.report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_section_type ON public.report_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_report_exports_report_id ON public.report_exports(report_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_report_id ON public.report_shares(report_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_shared_with ON public.report_shares(shared_with);

-- RLS Policies
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

-- Report templates policies
CREATE POLICY "Users can view all report templates"
ON public.report_templates FOR SELECT
USING (true);

CREATE POLICY "Users can create their own report templates"
ON public.report_templates FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own report templates"
ON public.report_templates FOR UPDATE
USING (created_by = auth.uid() AND NOT is_system);

CREATE POLICY "Users can delete their own report templates"
ON public.report_templates FOR DELETE
USING (created_by = auth.uid() AND NOT is_system);

-- Custom reports policies
CREATE POLICY "Users can view their own reports"
ON public.custom_reports FOR SELECT
USING (
    user_id = auth.uid() OR
    project_id IN (
        SELECT id FROM public.projects
        WHERE owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid()
        )
    ) OR
    id IN (
        SELECT report_id FROM public.report_shares
        WHERE shared_with = auth.uid()
    ) OR
    is_public = true
);

CREATE POLICY "Users can create reports for their projects"
ON public.custom_reports FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND
    (project_id IS NULL OR
     project_id IN (
        SELECT id FROM public.projects
        WHERE owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid()
        )
    ))
);

CREATE POLICY "Users can update their own reports"
ON public.custom_reports FOR UPDATE
USING (
    user_id = auth.uid() OR
    id IN (
        SELECT report_id FROM public.report_shares
        WHERE shared_with = auth.uid() AND permission_level = 'edit'
    )
);

CREATE POLICY "Users can delete their own reports"
ON public.custom_reports FOR DELETE
USING (user_id = auth.uid());

-- Report sections policies
CREATE POLICY "Users can view report sections they have access to"
ON public.report_sections FOR SELECT
USING (
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid() OR
        project_id IN (
            SELECT id FROM public.projects
            WHERE owner_id = auth.uid() OR
            id IN (
                SELECT project_id FROM public.project_collaborators
                WHERE user_id = auth.uid()
            )
        ) OR
        id IN (
            SELECT report_id FROM public.report_shares
            WHERE shared_with = auth.uid()
        ) OR
        is_public = true
    )
);

CREATE POLICY "Users can create sections for their reports"
ON public.report_sections FOR INSERT
WITH CHECK (
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid() OR
        id IN (
            SELECT report_id FROM public.report_shares
            WHERE shared_with = auth.uid() AND permission_level = 'edit'
        )
    )
);

CREATE POLICY "Users can update sections for their reports"
ON public.report_sections FOR UPDATE
USING (
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid() OR
        id IN (
            SELECT report_id FROM public.report_shares
            WHERE shared_with = auth.uid() AND permission_level = 'edit'
        )
    )
);

CREATE POLICY "Users can delete sections for their reports"
ON public.report_sections FOR DELETE
USING (
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid() OR
        id IN (
            SELECT report_id FROM public.report_shares
            WHERE shared_with = auth.uid() AND permission_level = 'edit'
        )
    )
);

-- Report exports policies
CREATE POLICY "Users can view exports for reports they have access to"
ON public.report_exports FOR SELECT
USING (
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid() OR
        project_id IN (
            SELECT id FROM public.projects
            WHERE owner_id = auth.uid() OR
            id IN (
                SELECT project_id FROM public.project_collaborators
                WHERE user_id = auth.uid()
            )
        ) OR
        id IN (
            SELECT report_id FROM public.report_shares
            WHERE shared_with = auth.uid()
        ) OR
        is_public = true
    )
);

CREATE POLICY "Users can create exports for reports they have access to"
ON public.report_exports FOR INSERT
WITH CHECK (
    created_by = auth.uid() AND
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid() OR
        project_id IN (
            SELECT id FROM public.projects
            WHERE owner_id = auth.uid() OR
            id IN (
                SELECT project_id FROM public.project_collaborators
                WHERE user_id = auth.uid()
            )
        ) OR
        id IN (
            SELECT report_id FROM public.report_shares
            WHERE shared_with = auth.uid()
        )
    )
);

-- Report shares policies
CREATE POLICY "Users can view shares for their reports"
ON public.report_shares FOR SELECT
USING (
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid()
    ) OR
    shared_with = auth.uid()
);

CREATE POLICY "Users can share their reports"
ON public.report_shares FOR INSERT
WITH CHECK (
    shared_by = auth.uid() AND
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update shares for their reports"
ON public.report_shares FOR UPDATE
USING (
    shared_by = auth.uid() AND
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete shares for their reports"
ON public.report_shares FOR DELETE
USING (
    shared_by = auth.uid() AND
    report_id IN (
        SELECT id FROM public.custom_reports
        WHERE user_id = auth.uid()
    )
);

-- Grant permissions
GRANT ALL ON public.report_templates TO authenticated;
GRANT ALL ON public.custom_reports TO authenticated;
GRANT ALL ON public.report_sections TO authenticated;
GRANT ALL ON public.report_exports TO authenticated;
GRANT ALL ON public.report_shares TO authenticated;
GRANT EXECUTE ON FUNCTION generate_report_with_external_data TO authenticated;
GRANT EXECUTE ON FUNCTION export_report_to_json TO authenticated;
