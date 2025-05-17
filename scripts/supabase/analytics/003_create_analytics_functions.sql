-- Database functions for advanced analytics features

-- Function to calculate project completion prediction
CREATE OR REPLACE FUNCTION public.calculate_project_completion_prediction(
    p_project_id UUID
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    v_total_tasks INT;
    v_completed_tasks INT;
    v_completion_rate FLOAT;
    v_avg_completion_time INTERVAL;
    v_first_task_created TIMESTAMP WITH TIME ZONE;
    v_last_task_completed TIMESTAMP WITH TIME ZONE;
    v_predicted_completion_date TIMESTAMP WITH TIME ZONE;
    v_confidence_score FLOAT;
    v_factors JSONB;
BEGIN
    -- Get total and completed tasks
    SELECT 
        COUNT(*), 
        COUNT(*) FILTER (WHERE completed = true)
    INTO 
        v_total_tasks, 
        v_completed_tasks
    FROM 
        public.project_tasks
    WHERE 
        project_id = p_project_id;
    
    -- If no tasks, return null
    IF v_total_tasks = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Calculate completion rate
    v_completion_rate := v_completed_tasks::FLOAT / v_total_tasks;
    
    -- Get first task created date
    SELECT 
        MIN(created_at)
    INTO 
        v_first_task_created
    FROM 
        public.project_tasks
    WHERE 
        project_id = p_project_id;
    
    -- Get average time to complete tasks
    SELECT 
        AVG(updated_at - created_at)
    INTO 
        v_avg_completion_time
    FROM 
        public.project_tasks
    WHERE 
        project_id = p_project_id
        AND completed = true;
    
    -- If no completed tasks, use a default estimate
    IF v_avg_completion_time IS NULL THEN
        v_avg_completion_time := INTERVAL '7 days';
    END IF;
    
    -- Get last task completion date
    SELECT 
        MAX(updated_at)
    INTO 
        v_last_task_completed
    FROM 
        public.project_tasks
    WHERE 
        project_id = p_project_id
        AND completed = true;
    
    -- If no tasks completed yet, use first task created date
    IF v_last_task_completed IS NULL THEN
        v_last_task_completed := v_first_task_created;
    END IF;
    
    -- Calculate predicted completion date
    IF v_completion_rate > 0 THEN
        -- Estimate based on current completion rate
        v_predicted_completion_date := v_last_task_completed + 
            (v_avg_completion_time * (v_total_tasks - v_completed_tasks) / v_completion_rate);
    ELSE
        -- If no completion rate yet, use a simple estimate
        v_predicted_completion_date := v_first_task_created + 
            (v_avg_completion_time * v_total_tasks);
    END IF;
    
    -- Calculate confidence score (0-1)
    -- Higher score for more completed tasks and consistent completion times
    v_confidence_score := LEAST(0.9, (v_completion_rate * 0.7) + 
        (CASE WHEN v_completed_tasks > 5 THEN 0.3 ELSE v_completed_tasks::FLOAT / 15 END));
    
    -- Store factors used in prediction
    v_factors := jsonb_build_object(
        'total_tasks', v_total_tasks,
        'completed_tasks', v_completed_tasks,
        'completion_rate', v_completion_rate,
        'avg_completion_time_days', EXTRACT(EPOCH FROM v_avg_completion_time) / 86400,
        'first_task_created', v_first_task_created,
        'last_task_completed', v_last_task_completed
    );
    
    -- Store the prediction
    INSERT INTO public.project_completion_predictions (
        project_id,
        predicted_completion_date,
        confidence_score,
        factors
    ) VALUES (
        p_project_id,
        v_predicted_completion_date,
        v_confidence_score,
        v_factors
    )
    ON CONFLICT (project_id) DO UPDATE SET
        predicted_completion_date = EXCLUDED.predicted_completion_date,
        confidence_score = EXCLUDED.confidence_score,
        factors = EXCLUDED.factors,
        updated_at = NOW();
    
    RETURN v_predicted_completion_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate project metrics
CREATE OR REPLACE FUNCTION public.generate_project_metrics(
    p_project_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_start_date TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_task_completion_rate FLOAT;
    v_task_overdue_rate FLOAT;
    v_avg_task_completion_time INTERVAL;
    v_note_count INT;
    v_file_count INT;
    v_comment_count INT;
    v_collaborator_count INT;
    v_activity_count INT;
BEGIN
    -- Get project start date (created_at)
    SELECT created_at INTO v_start_date
    FROM public.research_projects
    WHERE id = p_project_id;
    
    -- Set end date to now
    v_end_date := v_now;
    
    -- Calculate task metrics
    SELECT 
        COUNT(*) FILTER (WHERE completed = true)::FLOAT / NULLIF(COUNT(*), 0),
        COUNT(*) FILTER (WHERE due_date < v_now AND completed = false)::FLOAT / NULLIF(COUNT(*), 0),
        AVG(updated_at - created_at) FILTER (WHERE completed = true)
    INTO 
        v_task_completion_rate,
        v_task_overdue_rate,
        v_avg_task_completion_time
    FROM 
        public.project_tasks
    WHERE 
        project_id = p_project_id;
    
    -- Count notes
    SELECT COUNT(*) INTO v_note_count
    FROM public.project_notes
    WHERE project_id = p_project_id;
    
    -- Count files
    SELECT COUNT(*) INTO v_file_count
    FROM public.project_files
    WHERE project_id = p_project_id;
    
    -- Count comments
    SELECT COUNT(*) INTO v_comment_count
    FROM public.comments
    WHERE project_id = p_project_id;
    
    -- Count collaborators
    SELECT COUNT(*) INTO v_collaborator_count
    FROM public.project_collaborators
    WHERE project_id = p_project_id AND invitation_status = 'accepted';
    
    -- Count activities
    SELECT COUNT(*) INTO v_activity_count
    FROM public.activity_logs
    WHERE project_id = p_project_id;
    
    -- Store task completion rate metric
    INSERT INTO public.project_metrics (
        project_id,
        metric_type,
        metric_name,
        metric_value,
        time_period_start,
        time_period_end
    ) VALUES (
        p_project_id,
        'task',
        'completion_rate',
        v_task_completion_rate,
        v_start_date,
        v_end_date
    );
    
    -- Store task overdue rate metric
    INSERT INTO public.project_metrics (
        project_id,
        metric_type,
        metric_name,
        metric_value,
        time_period_start,
        time_period_end
    ) VALUES (
        p_project_id,
        'task',
        'overdue_rate',
        v_task_overdue_rate,
        v_start_date,
        v_end_date
    );
    
    -- Store average task completion time metric
    INSERT INTO public.project_metrics (
        project_id,
        metric_type,
        metric_name,
        metric_value,
        time_period_start,
        time_period_end
    ) VALUES (
        p_project_id,
        'task',
        'avg_completion_time_hours',
        EXTRACT(EPOCH FROM v_avg_task_completion_time) / 3600,
        v_start_date,
        v_end_date
    );
    
    -- Store content counts metric
    INSERT INTO public.project_metrics (
        project_id,
        metric_type,
        metric_name,
        metric_data,
        time_period_start,
        time_period_end
    ) VALUES (
        p_project_id,
        'content',
        'counts',
        jsonb_build_object(
            'notes', v_note_count,
            'files', v_file_count,
            'comments', v_comment_count
        ),
        v_start_date,
        v_end_date
    );
    
    -- Store collaboration metrics
    INSERT INTO public.project_metrics (
        project_id,
        metric_type,
        metric_name,
        metric_data,
        time_period_start,
        time_period_end
    ) VALUES (
        p_project_id,
        'collaboration',
        'activity',
        jsonb_build_object(
            'collaborators', v_collaborator_count,
            'activities', v_activity_count
        ),
        v_start_date,
        v_end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate user productivity metrics
CREATE OR REPLACE FUNCTION public.generate_user_productivity_metrics(
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_start_date TIMESTAMP WITH TIME ZONE := v_now - INTERVAL '30 days';
    v_end_date TIMESTAMP WITH TIME ZONE := v_now;
    v_project_count INT;
    v_task_created_count INT;
    v_task_completed_count INT;
    v_note_count INT;
    v_file_count INT;
    v_comment_count INT;
    v_activity_count INT;
BEGIN
    -- Count projects
    SELECT COUNT(*) INTO v_project_count
    FROM public.research_projects
    WHERE user_id = p_user_id;
    
    -- Count tasks created
    SELECT COUNT(*) INTO v_task_created_count
    FROM public.project_tasks
    WHERE created_by = p_user_id
    AND created_at BETWEEN v_start_date AND v_end_date;
    
    -- Count tasks completed
    SELECT COUNT(*) INTO v_task_completed_count
    FROM public.project_tasks
    WHERE completed_by = p_user_id
    AND updated_at BETWEEN v_start_date AND v_end_date
    AND completed = true;
    
    -- Count notes created
    SELECT COUNT(*) INTO v_note_count
    FROM public.project_notes
    WHERE created_by = p_user_id
    AND created_at BETWEEN v_start_date AND v_end_date;
    
    -- Count files uploaded
    SELECT COUNT(*) INTO v_file_count
    FROM public.project_files
    WHERE uploaded_by = p_user_id
    AND created_at BETWEEN v_start_date AND v_end_date;
    
    -- Count comments
    SELECT COUNT(*) INTO v_comment_count
    FROM public.comments
    WHERE user_id = p_user_id
    AND created_at BETWEEN v_start_date AND v_end_date;
    
    -- Count activities
    SELECT COUNT(*) INTO v_activity_count
    FROM public.activity_logs
    WHERE user_id = p_user_id
    AND created_at BETWEEN v_start_date AND v_end_date;
    
    -- Store productivity metrics
    INSERT INTO public.user_productivity_metrics (
        user_id,
        metric_type,
        metric_name,
        metric_data,
        time_period_start,
        time_period_end
    ) VALUES (
        p_user_id,
        'productivity',
        'activity_summary',
        jsonb_build_object(
            'projects', v_project_count,
            'tasks_created', v_task_created_count,
            'tasks_completed', v_task_completed_count,
            'notes', v_note_count,
            'files', v_file_count,
            'comments', v_comment_count,
            'activities', v_activity_count
        ),
        v_start_date,
        v_end_date
    );
    
    -- Calculate task completion rate
    IF v_task_created_count > 0 THEN
        INSERT INTO public.user_productivity_metrics (
            user_id,
            metric_type,
            metric_name,
            metric_value,
            time_period_start,
            time_period_end
        ) VALUES (
            p_user_id,
            'productivity',
            'task_completion_rate',
            v_task_completed_count::FLOAT / v_task_created_count,
            v_start_date,
            v_end_date
        );
    END IF;
    
    -- Calculate activity per day
    INSERT INTO public.user_productivity_metrics (
        user_id,
        metric_type,
        metric_name,
        metric_value,
        time_period_start,
        time_period_end
    ) VALUES (
        p_user_id,
        'productivity',
        'activity_per_day',
        v_activity_count::FLOAT / 30,
        v_start_date,
        v_end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run a custom report
CREATE OR REPLACE FUNCTION public.run_custom_report(
    p_report_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_report RECORD;
    v_result JSONB;
    v_query TEXT;
    v_params JSONB;
    v_report_type TEXT;
BEGIN
    -- Get the report details
    SELECT * INTO v_report
    FROM public.custom_reports
    WHERE id = p_report_id AND user_id = auth.uid();
    
    IF v_report IS NULL THEN
        RAISE EXCEPTION 'Report not found or access denied';
    END IF;
    
    v_report_type := v_report.report_type;
    v_params := v_report.parameters;
    
    -- Different report types
    IF v_report_type = 'project_progress' THEN
        -- Project progress report
        SELECT jsonb_build_object(
            'project_id', p.id,
            'project_title', p.title,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'task_stats', jsonb_build_object(
                'total', COUNT(t.id),
                'completed', COUNT(t.id) FILTER (WHERE t.completed = true),
                'pending', COUNT(t.id) FILTER (WHERE t.completed = false),
                'overdue', COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.completed = false)
            ),
            'content_stats', jsonb_build_object(
                'notes', (SELECT COUNT(*) FROM public.project_notes WHERE project_id = p.id),
                'files', (SELECT COUNT(*) FROM public.project_files WHERE project_id = p.id)
            ),
            'prediction', (
                SELECT jsonb_build_object(
                    'predicted_completion_date', predicted_completion_date,
                    'confidence_score', confidence_score,
                    'factors', factors
                )
                FROM public.project_completion_predictions
                WHERE project_id = p.id
                ORDER BY updated_at DESC
                LIMIT 1
            )
        ) INTO v_result
        FROM public.research_projects p
        LEFT JOIN public.project_tasks t ON p.id = t.project_id
        WHERE p.id = (v_params->>'project_id')::UUID
        GROUP BY p.id;
        
    ELSIF v_report_type = 'user_productivity' THEN
        -- User productivity report
        SELECT jsonb_build_object(
            'user_id', auth.uid(),
            'time_period', jsonb_build_object(
                'start', (v_params->>'start_date')::TIMESTAMP WITH TIME ZONE,
                'end', (v_params->>'end_date')::TIMESTAMP WITH TIME ZONE
            ),
            'task_stats', jsonb_build_object(
                'created', COUNT(t.id) FILTER (WHERE t.created_by = auth.uid()),
                'completed', COUNT(t.id) FILTER (WHERE t.completed_by = auth.uid() AND t.completed = true),
                'completion_rate', (
                    COUNT(t.id) FILTER (WHERE t.completed_by = auth.uid() AND t.completed = true)::FLOAT / 
                    NULLIF(COUNT(t.id) FILTER (WHERE t.created_by = auth.uid()), 0)
                )
            ),
            'content_stats', jsonb_build_object(
                'notes', (
                    SELECT COUNT(*) 
                    FROM public.project_notes 
                    WHERE created_by = auth.uid() AND 
                    created_at BETWEEN (v_params->>'start_date')::TIMESTAMP WITH TIME ZONE AND (v_params->>'end_date')::TIMESTAMP WITH TIME ZONE
                ),
                'files', (
                    SELECT COUNT(*) 
                    FROM public.project_files 
                    WHERE uploaded_by = auth.uid() AND 
                    created_at BETWEEN (v_params->>'start_date')::TIMESTAMP WITH TIME ZONE AND (v_params->>'end_date')::TIMESTAMP WITH TIME ZONE
                ),
                'comments', (
                    SELECT COUNT(*) 
                    FROM public.comments 
                    WHERE user_id = auth.uid() AND 
                    created_at BETWEEN (v_params->>'start_date')::TIMESTAMP WITH TIME ZONE AND (v_params->>'end_date')::TIMESTAMP WITH TIME ZONE
                )
            ),
            'activity_stats', jsonb_build_object(
                'total', (
                    SELECT COUNT(*) 
                    FROM public.activity_logs 
                    WHERE user_id = auth.uid() AND 
                    created_at BETWEEN (v_params->>'start_date')::TIMESTAMP WITH TIME ZONE AND (v_params->>'end_date')::TIMESTAMP WITH TIME ZONE
                ),
                'by_type', (
                    SELECT jsonb_object_agg(action_type, count)
                    FROM (
                        SELECT action_type, COUNT(*) as count
                        FROM public.activity_logs
                        WHERE user_id = auth.uid() AND 
                        created_at BETWEEN (v_params->>'start_date')::TIMESTAMP WITH TIME ZONE AND (v_params->>'end_date')::TIMESTAMP WITH TIME ZONE
                        GROUP BY action_type
                    ) as action_counts
                )
            )
        ) INTO v_result
        FROM public.project_tasks t
        WHERE t.created_at BETWEEN (v_params->>'start_date')::TIMESTAMP WITH TIME ZONE AND (v_params->>'end_date')::TIMESTAMP WITH TIME ZONE
        OR (t.completed = true AND t.updated_at BETWEEN (v_params->>'start_date')::TIMESTAMP WITH TIME ZONE AND (v_params->>'end_date')::TIMESTAMP WITH TIME ZONE);
        
    ELSIF v_report_type = 'project_comparison' THEN
        -- Project comparison report
        WITH project_stats AS (
            SELECT 
                p.id,
                p.title,
                p.created_at,
                p.updated_at,
                COUNT(t.id) as total_tasks,
                COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks,
                COUNT(n.id) as notes_count,
                COUNT(f.id) as files_count,
                COUNT(c.id) as comments_count,
                COUNT(a.id) as activities_count
            FROM 
                public.research_projects p
            LEFT JOIN 
                public.project_tasks t ON p.id = t.project_id
            LEFT JOIN 
                public.project_notes n ON p.id = n.project_id
            LEFT JOIN 
                public.project_files f ON p.id = f.project_id
            LEFT JOIN 
                public.comments c ON p.id = c.project_id
            LEFT JOIN 
                public.activity_logs a ON p.id = a.project_id
            WHERE 
                p.id = ANY((v_params->>'project_ids')::UUID[])
            GROUP BY 
                p.id
        )
        SELECT 
            jsonb_build_object(
                'projects', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', id,
                            'title', title,
                            'created_at', created_at,
                            'updated_at', updated_at,
                            'task_stats', jsonb_build_object(
                                'total', total_tasks,
                                'completed', completed_tasks,
                                'completion_rate', 
                                    CASE 
                                        WHEN total_tasks > 0 THEN completed_tasks::FLOAT / total_tasks 
                                        ELSE 0 
                                    END
                            ),
                            'content_stats', jsonb_build_object(
                                'notes', notes_count,
                                'files', files_count,
                                'comments', comments_count
                            ),
                            'activity_count', activities_count
                        )
                    )
                    FROM project_stats
                )
            ) INTO v_result;
    ELSE
        RAISE EXCEPTION 'Unsupported report type: %', v_report_type;
    END IF;
    
    -- Store the report result
    INSERT INTO public.report_results (
        report_id,
        result_data
    ) VALUES (
        p_report_id,
        v_result
    );
    
    -- Update the last run time
    UPDATE public.custom_reports
    SET last_run_at = NOW()
    WHERE id = p_report_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to update project completion prediction when tasks change
CREATE OR REPLACE FUNCTION public.update_project_completion_prediction()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate new prediction
    PERFORM public.calculate_project_completion_prediction(
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.project_id
            ELSE NEW.project_id
        END
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on project_tasks table
DROP TRIGGER IF EXISTS update_project_completion_prediction_trigger ON public.project_tasks;
CREATE TRIGGER update_project_completion_prediction_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.project_tasks
FOR EACH STATEMENT
EXECUTE FUNCTION public.update_project_completion_prediction();
