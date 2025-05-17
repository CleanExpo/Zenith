-- Create predictive analytics schema for project completion predictions

-- Project completion predictions table
CREATE TABLE IF NOT EXISTS public.project_completion_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    predicted_completion_date TIMESTAMP WITH TIME ZONE,
    confidence_score FLOAT NOT NULL,
    factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS project_completion_predictions_project_id_idx ON public.project_completion_predictions(project_id);
CREATE INDEX IF NOT EXISTS project_completion_predictions_created_at_idx ON public.project_completion_predictions(created_at);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_project_completion_predictions_updated_at
    BEFORE UPDATE ON public.project_completion_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Custom reports table
CREATE TABLE IF NOT EXISTS public.custom_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL,
    parameters JSONB NOT NULL,
    schedule TEXT,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS custom_reports_user_id_idx ON public.custom_reports(user_id);
CREATE INDEX IF NOT EXISTS custom_reports_report_type_idx ON public.custom_reports(report_type);
CREATE INDEX IF NOT EXISTS custom_reports_created_at_idx ON public.custom_reports(created_at);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_custom_reports_updated_at
    BEFORE UPDATE ON public.custom_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Report results table
CREATE TABLE IF NOT EXISTS public.report_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.custom_reports(id) ON DELETE CASCADE,
    result_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS report_results_report_id_idx ON public.report_results(report_id);
CREATE INDEX IF NOT EXISTS report_results_created_at_idx ON public.report_results(created_at);

-- Project metrics table for advanced analytics
CREATE TABLE IF NOT EXISTS public.project_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value FLOAT,
    metric_data JSONB,
    time_period_start TIMESTAMP WITH TIME ZONE,
    time_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS project_metrics_project_id_idx ON public.project_metrics(project_id);
CREATE INDEX IF NOT EXISTS project_metrics_metric_type_idx ON public.project_metrics(metric_type);
CREATE INDEX IF NOT EXISTS project_metrics_time_period_start_idx ON public.project_metrics(time_period_start);
CREATE INDEX IF NOT EXISTS project_metrics_time_period_end_idx ON public.project_metrics(time_period_end);
CREATE INDEX IF NOT EXISTS project_metrics_created_at_idx ON public.project_metrics(created_at);

-- User productivity metrics table
CREATE TABLE IF NOT EXISTS public.user_productivity_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value FLOAT,
    metric_data JSONB,
    time_period_start TIMESTAMP WITH TIME ZONE,
    time_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS user_productivity_metrics_user_id_idx ON public.user_productivity_metrics(user_id);
CREATE INDEX IF NOT EXISTS user_productivity_metrics_metric_type_idx ON public.user_productivity_metrics(metric_type);
CREATE INDEX IF NOT EXISTS user_productivity_metrics_time_period_start_idx ON public.user_productivity_metrics(time_period_start);
CREATE INDEX IF NOT EXISTS user_productivity_metrics_time_period_end_idx ON public.user_productivity_metrics(time_period_end);
CREATE INDEX IF NOT EXISTS user_productivity_metrics_created_at_idx ON public.user_productivity_metrics(created_at);
