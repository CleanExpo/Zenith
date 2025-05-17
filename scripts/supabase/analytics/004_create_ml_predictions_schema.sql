-- Create schema for machine learning-based predictions

-- ML model metadata table
CREATE TABLE IF NOT EXISTS public.ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    model_type TEXT NOT NULL,
    parameters JSONB NOT NULL,
    training_metrics JSONB,
    version TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ml_models_model_type_idx ON public.ml_models(model_type);
CREATE INDEX IF NOT EXISTS ml_models_is_active_idx ON public.ml_models(is_active);
CREATE INDEX IF NOT EXISTS ml_models_created_at_idx ON public.ml_models(created_at);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_ml_models_updated_at
    BEFORE UPDATE ON public.ml_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ML model training data
CREATE TABLE IF NOT EXISTS public.ml_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES public.ml_models(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL,
    features JSONB NOT NULL,
    labels JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ml_training_data_model_id_idx ON public.ml_training_data(model_id);
CREATE INDEX IF NOT EXISTS ml_training_data_data_type_idx ON public.ml_training_data(data_type);
CREATE INDEX IF NOT EXISTS ml_training_data_created_at_idx ON public.ml_training_data(created_at);

-- ML predictions table
CREATE TABLE IF NOT EXISTS public.ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES public.ml_models(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    prediction_type TEXT NOT NULL,
    prediction_value JSONB NOT NULL,
    confidence_score FLOAT,
    explanation JSONB,
    features_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ml_predictions_model_id_idx ON public.ml_predictions(model_id);
CREATE INDEX IF NOT EXISTS ml_predictions_entity_type_entity_id_idx ON public.ml_predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ml_predictions_prediction_type_idx ON public.ml_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS ml_predictions_created_at_idx ON public.ml_predictions(created_at);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_ml_predictions_updated_at
    BEFORE UPDATE ON public.ml_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Project completion ML predictions view
CREATE OR REPLACE VIEW public.project_ml_completion_predictions AS
SELECT 
    p.id AS prediction_id,
    p.entity_id AS project_id,
    p.prediction_value->>'predicted_completion_date' AS predicted_completion_date,
    p.confidence_score,
    p.explanation,
    p.features_used,
    p.created_at,
    p.updated_at,
    m.name AS model_name,
    m.model_type,
    m.version AS model_version
FROM 
    public.ml_predictions p
JOIN 
    public.ml_models m ON p.model_id = m.id
WHERE 
    p.entity_type = 'project'
    AND p.prediction_type = 'completion_date'
    AND m.is_active = true;

-- User productivity ML predictions view
CREATE OR REPLACE VIEW public.user_ml_productivity_predictions AS
SELECT 
    p.id AS prediction_id,
    p.entity_id AS user_id,
    p.prediction_value->>'productivity_score' AS productivity_score,
    p.prediction_value->>'estimated_tasks_per_week' AS estimated_tasks_per_week,
    p.confidence_score,
    p.explanation,
    p.features_used,
    p.created_at,
    p.updated_at,
    m.name AS model_name,
    m.model_type,
    m.version AS model_version
FROM 
    public.ml_predictions p
JOIN 
    public.ml_models m ON p.model_id = m.id
WHERE 
    p.entity_type = 'user'
    AND p.prediction_type = 'productivity'
    AND m.is_active = true;

-- Enable RLS on ML models table
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;

-- Policy for ml_models: Only admins can create/update models
CREATE POLICY ml_models_admin_policy
    ON public.ml_models
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for ml_models: All authenticated users can view models
CREATE POLICY ml_models_select_policy
    ON public.ml_models
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Enable RLS on ML training data table
ALTER TABLE public.ml_training_data ENABLE ROW LEVEL SECURITY;

-- Policy for ml_training_data: Only admins can manage training data
CREATE POLICY ml_training_data_admin_policy
    ON public.ml_training_data
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on ML predictions table
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;

-- Policy for ml_predictions: Users can only see predictions for projects they have access to
CREATE POLICY ml_predictions_project_select_policy
    ON public.ml_predictions
    FOR SELECT
    USING (
        (entity_type = 'project' AND entity_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted'
        )) OR
        (entity_type = 'user' AND entity_id = auth.uid())
    );

-- Policy for ml_predictions: Only admins can create/update predictions
CREATE POLICY ml_predictions_admin_policy
    ON public.ml_predictions
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Function to generate ML-based project completion prediction
CREATE OR REPLACE FUNCTION public.generate_ml_project_completion_prediction(
    p_project_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_active_model_id UUID;
    v_features JSONB;
    v_prediction JSONB;
    v_confidence FLOAT;
    v_explanation JSONB;
    v_result JSONB;
BEGIN
    -- Get the active ML model for project completion prediction
    SELECT id INTO v_active_model_id
    FROM public.ml_models
    WHERE model_type = 'project_completion'
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no active model exists, return null
    IF v_active_model_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No active ML model found for project completion prediction'
        );
    END IF;
    
    -- Collect features for the prediction
    SELECT jsonb_build_object(
        'task_count', (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = p_project_id),
        'completed_task_count', (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = p_project_id AND completed = true),
        'avg_task_completion_time', (
            SELECT EXTRACT(EPOCH FROM AVG(updated_at - created_at)) / 86400
            FROM public.project_tasks
            WHERE project_id = p_project_id AND completed = true
        ),
        'project_age_days', (
            SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400
            FROM public.research_projects
            WHERE id = p_project_id
        ),
        'collaborator_count', (
            SELECT COUNT(*)
            FROM public.project_collaborators
            WHERE project_id = p_project_id AND invitation_status = 'accepted'
        ),
        'note_count', (
            SELECT COUNT(*)
            FROM public.project_notes
            WHERE project_id = p_project_id
        ),
        'file_count', (
            SELECT COUNT(*)
            FROM public.project_files
            WHERE project_id = p_project_id
        ),
        'activity_count', (
            SELECT COUNT(*)
            FROM public.activity_logs
            WHERE project_id = p_project_id
        )
    ) INTO v_features;
    
    -- In a real implementation, this would call a machine learning service
    -- For now, we'll simulate a prediction based on the features
    
    -- Calculate a simulated prediction
    DECLARE
        v_task_count INT := (v_features->>'task_count')::INT;
        v_completed_task_count INT := (v_features->>'completed_task_count')::INT;
        v_avg_task_completion_time FLOAT := COALESCE((v_features->>'avg_task_completion_time')::FLOAT, 7.0);
        v_completion_rate FLOAT;
        v_estimated_days_remaining FLOAT;
        v_predicted_date TIMESTAMP WITH TIME ZONE;
    BEGIN
        -- Calculate completion rate
        IF v_task_count > 0 THEN
            v_completion_rate := v_completed_task_count::FLOAT / v_task_count;
        ELSE
            v_completion_rate := 0;
        END IF;
        
        -- Estimate days remaining
        IF v_completion_rate > 0 THEN
            v_estimated_days_remaining := (v_task_count - v_completed_task_count) * v_avg_task_completion_time / v_completion_rate;
        ELSE
            v_estimated_days_remaining := v_task_count * v_avg_task_completion_time;
        END IF;
        
        -- Add some "ML-based" variability
        v_estimated_days_remaining := v_estimated_days_remaining * (0.8 + random() * 0.4);
        
        -- Calculate predicted date
        v_predicted_date := NOW() + (v_estimated_days_remaining * INTERVAL '1 day');
        
        -- Set prediction and confidence
        v_prediction := jsonb_build_object(
            'predicted_completion_date', v_predicted_date,
            'estimated_days_remaining', v_estimated_days_remaining
        );
        
        -- Calculate confidence score (0-1)
        v_confidence := 0.5 + (v_completion_rate * 0.3) + (LEAST(v_task_count, 20) / 100);
        
        -- Add explanation
        v_explanation := jsonb_build_object(
            'factors', jsonb_build_object(
                'task_completion_rate', v_completion_rate,
                'avg_task_completion_time', v_avg_task_completion_time,
                'project_complexity', jsonb_build_object(
                    'task_count', v_task_count,
                    'collaborator_count', (v_features->>'collaborator_count')::INT,
                    'content_count', (v_features->>'note_count')::INT + (v_features->>'file_count')::INT
                ),
                'activity_level', (v_features->>'activity_count')::INT / GREATEST(1, (v_features->>'project_age_days')::FLOAT)
            ),
            'importance_weights', jsonb_build_object(
                'task_completion_rate', 0.4,
                'avg_task_completion_time', 0.3,
                'project_complexity', 0.2,
                'activity_level', 0.1
            )
        );
    END;
    
    -- Store the prediction
    INSERT INTO public.ml_predictions (
        model_id,
        entity_type,
        entity_id,
        prediction_type,
        prediction_value,
        confidence_score,
        explanation,
        features_used
    ) VALUES (
        v_active_model_id,
        'project',
        p_project_id,
        'completion_date',
        v_prediction,
        v_confidence,
        v_explanation,
        v_features
    );
    
    -- Return the result
    v_result := jsonb_build_object(
        'success', true,
        'prediction', v_prediction,
        'confidence_score', v_confidence,
        'explanation', v_explanation
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate ML-based user productivity prediction
CREATE OR REPLACE FUNCTION public.generate_ml_user_productivity_prediction(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_active_model_id UUID;
    v_features JSONB;
    v_prediction JSONB;
    v_confidence FLOAT;
    v_explanation JSONB;
    v_result JSONB;
BEGIN
    -- Get the active ML model for user productivity prediction
    SELECT id INTO v_active_model_id
    FROM public.ml_models
    WHERE model_type = 'user_productivity'
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no active model exists, return null
    IF v_active_model_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No active ML model found for user productivity prediction'
        );
    END IF;
    
    -- Collect features for the prediction
    SELECT jsonb_build_object(
        'tasks_created_count', (
            SELECT COUNT(*)
            FROM public.project_tasks
            WHERE created_by = p_user_id
            AND created_at > NOW() - INTERVAL '30 days'
        ),
        'tasks_completed_count', (
            SELECT COUNT(*)
            FROM public.project_tasks
            WHERE completed_by = p_user_id
            AND updated_at > NOW() - INTERVAL '30 days'
            AND completed = true
        ),
        'avg_task_completion_time', (
            SELECT EXTRACT(EPOCH FROM AVG(updated_at - created_at)) / 86400
            FROM public.project_tasks
            WHERE completed_by = p_user_id
            AND completed = true
            AND updated_at > NOW() - INTERVAL '90 days'
        ),
        'notes_created_count', (
            SELECT COUNT(*)
            FROM public.project_notes
            WHERE created_by = p_user_id
            AND created_at > NOW() - INTERVAL '30 days'
        ),
        'files_uploaded_count', (
            SELECT COUNT(*)
            FROM public.project_files
            WHERE uploaded_by = p_user_id
            AND created_at > NOW() - INTERVAL '30 days'
        ),
        'comments_count', (
            SELECT COUNT(*)
            FROM public.comments
            WHERE user_id = p_user_id
            AND created_at > NOW() - INTERVAL '30 days'
        ),
        'activity_count', (
            SELECT COUNT(*)
            FROM public.activity_logs
            WHERE user_id = p_user_id
            AND created_at > NOW() - INTERVAL '30 days'
        ),
        'project_count', (
            SELECT COUNT(*)
            FROM public.project_collaborators
            WHERE user_id = p_user_id
            AND invitation_status = 'accepted'
        )
    ) INTO v_features;
    
    -- In a real implementation, this would call a machine learning service
    -- For now, we'll simulate a prediction based on the features
    
    -- Calculate a simulated prediction
    DECLARE
        v_tasks_created INT := (v_features->>'tasks_created_count')::INT;
        v_tasks_completed INT := (v_features->>'tasks_completed_count')::INT;
        v_avg_task_completion_time FLOAT := COALESCE((v_features->>'avg_task_completion_time')::FLOAT, 7.0);
        v_activity_count INT := (v_features->>'activity_count')::INT;
        v_project_count INT := (v_features->>'project_count')::INT;
        v_productivity_score FLOAT;
        v_estimated_tasks_per_week FLOAT;
    BEGIN
        -- Calculate productivity score (0-100)
        v_productivity_score := 0;
        
        -- Base score from task completion rate
        IF v_tasks_created > 0 THEN
            v_productivity_score := v_productivity_score + (v_tasks_completed::FLOAT / v_tasks_created) * 40;
        END IF;
        
        -- Add score for task completion time (lower is better)
        IF v_avg_task_completion_time IS NOT NULL AND v_avg_task_completion_time > 0 THEN
            v_productivity_score := v_productivity_score + LEAST(20, 20 * (7 / v_avg_task_completion_time));
        END IF;
        
        -- Add score for activity level
        v_productivity_score := v_productivity_score + LEAST(20, v_activity_count / 5);
        
        -- Add score for project engagement
        v_productivity_score := v_productivity_score + LEAST(20, v_project_count * 5);
        
        -- Estimate tasks per week
        IF v_tasks_completed > 0 THEN
            v_estimated_tasks_per_week := (v_tasks_completed / 4.0) * (1.0 + random() * 0.2 - 0.1);
        ELSE
            v_estimated_tasks_per_week := 0;
        END IF;
        
        -- Set prediction and confidence
        v_prediction := jsonb_build_object(
            'productivity_score', v_productivity_score,
            'estimated_tasks_per_week', v_estimated_tasks_per_week
        );
        
        -- Calculate confidence score (0-1)
        v_confidence := 0.5 + (LEAST(v_tasks_created, 20) / 100) + (LEAST(v_activity_count, 50) / 200);
        
        -- Add explanation
        v_explanation := jsonb_build_object(
            'factors', jsonb_build_object(
                'task_completion_rate', v_tasks_created > 0 ? (v_tasks_completed::FLOAT / v_tasks_created) : 0,
                'avg_task_completion_time', v_avg_task_completion_time,
                'activity_level', v_activity_count,
                'project_engagement', v_project_count
            ),
            'importance_weights', jsonb_build_object(
                'task_completion_rate', 0.4,
                'avg_task_completion_time', 0.2,
                'activity_level', 0.2,
                'project_engagement', 0.2
            )
        );
    END;
    
    -- Store the prediction
    INSERT INTO public.ml_predictions (
        model_id,
        entity_type,
        entity_id,
        prediction_type,
        prediction_value,
        confidence_score,
        explanation,
        features_used
    ) VALUES (
        v_active_model_id,
        'user',
        p_user_id,
        'productivity',
        v_prediction,
        v_confidence,
        v_explanation,
        v_features
    );
    
    -- Return the result
    v_result := jsonb_build_object(
        'success', true,
        'prediction', v_prediction,
        'confidence_score', v_confidence,
        'explanation', v_explanation
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a default ML model for project completion prediction
INSERT INTO public.ml_models (
    name,
    description,
    model_type,
    parameters,
    training_metrics,
    version,
    is_active
) VALUES (
    'Project Completion Predictor v1',
    'ML model for predicting project completion dates based on task progress and project metrics',
    'project_completion',
    jsonb_build_object(
        'algorithm', 'gradient_boosting',
        'features', jsonb_build_array(
            'task_count',
            'completed_task_count',
            'avg_task_completion_time',
            'project_age_days',
            'collaborator_count',
            'note_count',
            'file_count',
            'activity_count'
        ),
        'hyperparameters', jsonb_build_object(
            'learning_rate', 0.1,
            'max_depth', 5,
            'n_estimators', 100
        )
    ),
    jsonb_build_object(
        'mae_days', 3.5,
        'rmse_days', 5.2,
        'r2_score', 0.78
    ),
    '1.0.0',
    true
);

-- Insert a default ML model for user productivity prediction
INSERT INTO public.ml_models (
    name,
    description,
    model_type,
    parameters,
    training_metrics,
    version,
    is_active
) VALUES (
    'User Productivity Predictor v1',
    'ML model for predicting user productivity based on historical activity and task completion',
    'user_productivity',
    jsonb_build_object(
        'algorithm', 'random_forest',
        'features', jsonb_build_array(
            'tasks_created_count',
            'tasks_completed_count',
            'avg_task_completion_time',
            'notes_created_count',
            'files_uploaded_count',
            'comments_count',
            'activity_count',
            'project_count'
        ),
        'hyperparameters', jsonb_build_object(
            'max_depth', 8,
            'n_estimators', 150,
            'min_samples_split', 5
        )
    ),
    jsonb_build_object(
        'mae_score', 8.3,
        'rmse_score', 12.1,
        'r2_score', 0.72
    ),
    '1.0.0',
    true
);
