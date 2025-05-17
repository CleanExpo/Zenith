-- Row Level Security (RLS) policies for analytics tables

-- Enable RLS on project_completion_predictions table
ALTER TABLE public.project_completion_predictions ENABLE ROW LEVEL SECURITY;

-- Policy for project_completion_predictions: Users can only see predictions for projects they have access to
CREATE POLICY project_completion_predictions_select_policy
    ON public.project_completion_predictions
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted'
        )
    );

-- Policy for project_completion_predictions: Only project owners and editors can insert predictions
CREATE POLICY project_completion_predictions_insert_policy
    ON public.project_completion_predictions
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted' AND role IN ('owner', 'editor')
        )
    );

-- Policy for project_completion_predictions: Only project owners and editors can update predictions
CREATE POLICY project_completion_predictions_update_policy
    ON public.project_completion_predictions
    FOR UPDATE
    USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted' AND role IN ('owner', 'editor')
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted' AND role IN ('owner', 'editor')
        )
    );

-- Policy for project_completion_predictions: Only project owners and editors can delete predictions
CREATE POLICY project_completion_predictions_delete_policy
    ON public.project_completion_predictions
    FOR DELETE
    USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted' AND role IN ('owner', 'editor')
        )
    );

-- Enable RLS on custom_reports table
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

-- Policy for custom_reports: Users can only see their own reports
CREATE POLICY custom_reports_select_policy
    ON public.custom_reports
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy for custom_reports: Users can only insert their own reports
CREATE POLICY custom_reports_insert_policy
    ON public.custom_reports
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy for custom_reports: Users can only update their own reports
CREATE POLICY custom_reports_update_policy
    ON public.custom_reports
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy for custom_reports: Users can only delete their own reports
CREATE POLICY custom_reports_delete_policy
    ON public.custom_reports
    FOR DELETE
    USING (user_id = auth.uid());

-- Enable RLS on report_results table
ALTER TABLE public.report_results ENABLE ROW LEVEL SECURITY;

-- Policy for report_results: Users can only see results for their own reports
CREATE POLICY report_results_select_policy
    ON public.report_results
    FOR SELECT
    USING (
        report_id IN (
            SELECT id FROM public.custom_reports
            WHERE user_id = auth.uid()
        )
    );

-- Policy for report_results: Users can only insert results for their own reports
CREATE POLICY report_results_insert_policy
    ON public.report_results
    FOR INSERT
    WITH CHECK (
        report_id IN (
            SELECT id FROM public.custom_reports
            WHERE user_id = auth.uid()
        )
    );

-- Policy for report_results: Users can only delete results for their own reports
CREATE POLICY report_results_delete_policy
    ON public.report_results
    FOR DELETE
    USING (
        report_id IN (
            SELECT id FROM public.custom_reports
            WHERE user_id = auth.uid()
        )
    );

-- Enable RLS on project_metrics table
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for project_metrics: Users can only see metrics for projects they have access to
CREATE POLICY project_metrics_select_policy
    ON public.project_metrics
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted'
        )
    );

-- Policy for project_metrics: Only project owners and editors can insert metrics
CREATE POLICY project_metrics_insert_policy
    ON public.project_metrics
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted' AND role IN ('owner', 'editor')
        )
    );

-- Policy for project_metrics: Only project owners and editors can update metrics
CREATE POLICY project_metrics_update_policy
    ON public.project_metrics
    FOR UPDATE
    USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted' AND role IN ('owner', 'editor')
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted' AND role IN ('owner', 'editor')
        )
    );

-- Policy for project_metrics: Only project owners and editors can delete metrics
CREATE POLICY project_metrics_delete_policy
    ON public.project_metrics
    FOR DELETE
    USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted' AND role IN ('owner', 'editor')
        )
    );

-- Enable RLS on user_productivity_metrics table
ALTER TABLE public.user_productivity_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for user_productivity_metrics: Users can only see their own productivity metrics
CREATE POLICY user_productivity_metrics_select_policy
    ON public.user_productivity_metrics
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy for user_productivity_metrics: Only the system can insert productivity metrics
CREATE POLICY user_productivity_metrics_insert_policy
    ON public.user_productivity_metrics
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- Policy for user_productivity_metrics: Only the system can update productivity metrics
CREATE POLICY user_productivity_metrics_update_policy
    ON public.user_productivity_metrics
    FOR UPDATE
    USING (user_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- Policy for user_productivity_metrics: Only the system can delete productivity metrics
CREATE POLICY user_productivity_metrics_delete_policy
    ON public.user_productivity_metrics
    FOR DELETE
    USING (user_id = auth.uid() OR auth.role() = 'service_role');
