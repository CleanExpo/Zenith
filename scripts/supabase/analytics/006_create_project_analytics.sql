-- 006_create_project_analytics.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for cross-domain metrics
CREATE TABLE IF NOT EXISTS public.project_external_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    external_data_source_id UUID REFERENCES public.external_data_sources(id),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    UNIQUE(project_id, external_data_source_id, metric_name)
);

-- Create materialized view for combined project analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.combined_project_analytics AS
SELECT 
    p.id AS project_id,
    p.title AS project_title,
    p.status AS project_status,
    p.created_at AS project_created_at,
    p.updated_at AS project_updated_at,
    ede.type AS external_data_type,
    ede.data->>'source' AS external_data_source,
    ede.data->>'relevance_score' AS relevance_score,
    ede.data->>'citations' AS citations,
    ede.data->>'publications' AS publications,
    ede.data->>'funding_amount' AS funding_amount,
    ede.data->>'patents' AS patents,
    pa.metrics->'complexity'->'score' AS complexity_score,
    pa.metrics->'risk'->'score' AS risk_score,
    pa.metrics->'progress'->'completion_percentage' AS completion_percentage
FROM public.projects p
LEFT JOIN public.project_analytics pa ON p.id = pa.project_id
LEFT JOIN public.external_data_entities ede ON p.id = ede.project_id
WITH DATA;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_combined_analytics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.combined_project_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for funding efficiency calculation
CREATE OR REPLACE FUNCTION calculate_funding_efficiency(p_project_id UUID)
RETURNS TABLE(
    project_id UUID,
    total_funding NUMERIC,
    completion_percentage NUMERIC,
    efficiency_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH project_data AS (
        SELECT 
            p.id AS project_id,
            COALESCE(SUM((ede.data->>'funding_amount')::NUMERIC), 0) AS total_funding,
            COALESCE((pa.metrics->'progress'->>'completion_percentage')::NUMERIC, 0) AS completion_percentage
        FROM public.projects p
        LEFT JOIN public.external_data_entities ede 
            ON p.id = ede.project_id 
            AND ede.type = 'funding'
        LEFT JOIN public.project_analytics pa ON p.id = pa.project_id
        WHERE p.id = p_project_id
        GROUP BY p.id, pa.metrics
    )
    SELECT 
        project_id,
        total_funding,
        completion_percentage,
        CASE 
            WHEN total_funding > 0 AND completion_percentage > 0 THEN completion_percentage / total_funding
            ELSE 0
        END AS efficiency_ratio
    FROM project_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for patent impact score
CREATE OR REPLACE FUNCTION get_patent_impact_score(p_project_id UUID)
RETURNS TABLE(
    project_id UUID,
    total_patents INT,
    citations INT,
    impact_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH patent_data AS (
        SELECT 
            p.id AS project_id,
            COALESCE(SUM((ede.data->>'patents')::INT), 0) AS total_patents,
            COALESCE(SUM((ede.data->>'citations')::INT), 0) AS citations
        FROM public.projects p
        LEFT JOIN public.external_data_entities ede 
            ON p.id = ede.project_id 
            AND ede.type = 'patent'
        WHERE p.id = p_project_id
        GROUP BY p.id
    )
    SELECT 
        project_id,
        total_patents,
        citations,
        CASE 
            WHEN total_patents > 0 THEN citations / total_patents
            ELSE 0
        END AS impact_score
    FROM patent_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_combined_analytics_project_id ON public.combined_project_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_project_external_metrics_project_id ON public.project_external_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_project_external_metrics_source_id ON public.project_external_metrics(external_data_source_id);

-- RLS Policies
ALTER TABLE public.project_external_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for projects they have access to"
ON public.project_external_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = project_external_metrics.project_id
        AND (projects.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.project_collaborators
                WHERE project_id = projects.id
                AND user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can insert metrics for projects they own"
ON public.project_external_metrics FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = project_external_metrics.project_id
        AND projects.owner_id = auth.uid()
    )
);

-- Grant permissions
GRANT ALL ON public.project_external_metrics TO authenticated;
GRANT ALL ON public.combined_project_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_combined_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_funding_efficiency TO authenticated;
GRANT EXECUTE ON FUNCTION get_patent_impact_score TO authenticated;
