-- 007_update_ml_predictions_schema.sql

-- Create table for ML model features based on external data
CREATE TABLE IF NOT EXISTS public.ml_external_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_value NUMERIC,
    feature_importance NUMERIC,
    feature_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, feature_name)
);

-- Create table for ML model versions with external data
CREATE TABLE IF NOT EXISTS public.ml_model_versions_external (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL,
    version TEXT NOT NULL,
    training_date TIMESTAMPTZ DEFAULT NOW(),
    accuracy NUMERIC,
    features JSONB,
    external_features_used BOOLEAN DEFAULT FALSE,
    hyperparameters JSONB,
    metadata JSONB,
    UNIQUE(model_name, version)
);

-- Create function to extract features from external data
CREATE OR REPLACE FUNCTION extract_ml_features_from_external_data(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_features JSONB := '{}'::JSONB;
    v_academic_data JSONB;
    v_funding_data JSONB;
    v_patent_data JSONB;
    v_project_data RECORD;
BEGIN
    -- Get project data
    SELECT * INTO v_project_data FROM public.projects WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Project not found');
    END IF;
    
    -- Get academic data
    SELECT data INTO v_academic_data 
    FROM public.external_data_enriched_entities 
    WHERE entity_type = 'project' 
      AND entity_id = p_project_id
      AND source_id IN (SELECT id FROM public.external_data_sources WHERE source_type = 'academic_database')
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Get funding data
    SELECT data INTO v_funding_data 
    FROM public.external_data_enriched_entities 
    WHERE entity_type = 'project' 
      AND entity_id = p_project_id
      AND source_id IN (SELECT id FROM public.external_data_sources WHERE source_type = 'funding_database')
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Get patent data
    SELECT data INTO v_patent_data 
    FROM public.external_data_enriched_entities 
    WHERE entity_type = 'project' 
      AND entity_id = p_project_id
      AND source_id IN (SELECT id FROM public.external_data_sources WHERE source_type = 'patent_database')
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Extract features from academic data
    IF v_academic_data IS NOT NULL THEN
        v_features = jsonb_set(v_features, '{citations}', COALESCE(v_academic_data->'citations', '0'));
        v_features = jsonb_set(v_features, '{publications}', COALESCE(v_academic_data->'publications', '0'));
        v_features = jsonb_set(v_features, '{h_index}', COALESCE(v_academic_data->'h_index', '0'));
        v_features = jsonb_set(v_features, '{has_academic_data}', 'true');
    ELSE
        v_features = jsonb_set(v_features, '{has_academic_data}', 'false');
    END IF;
    
    -- Extract features from funding data
    IF v_funding_data IS NOT NULL THEN
        v_features = jsonb_set(v_features, '{total_funding}', COALESCE(v_funding_data->'total_funding', '0'));
        v_features = jsonb_set(v_features, '{active_grants}', COALESCE(v_funding_data->'active_grants', '0'));
        v_features = jsonb_set(v_features, '{success_rate}', COALESCE(v_funding_data->'success_rate', '0'));
        v_features = jsonb_set(v_features, '{has_funding_data}', 'true');
    ELSE
        v_features = jsonb_set(v_features, '{has_funding_data}', 'false');
    END IF;
    
    -- Extract features from patent data
    IF v_patent_data IS NOT NULL THEN
        v_features = jsonb_set(v_features, '{total_patents}', COALESCE(v_patent_data->'total_patents', '0'));
        v_features = jsonb_set(v_features, '{pending_patents}', COALESCE(v_patent_data->'pending_patents', '0'));
        v_features = jsonb_set(v_features, '{has_patent_data}', 'true');
    ELSE
        v_features = jsonb_set(v_features, '{has_patent_data}', 'false');
    END IF;
    
    -- Calculate derived features
    IF v_academic_data IS NOT NULL AND v_funding_data IS NOT NULL THEN
        v_features = jsonb_set(v_features, '{publications_per_funding}', 
            CASE 
                WHEN (v_funding_data->>'total_funding')::NUMERIC > 0 
                THEN to_jsonb((v_academic_data->>'publications')::NUMERIC / (v_funding_data->>'total_funding')::NUMERIC * 1000)
                ELSE '0'
            END
        );
    END IF;
    
    IF v_academic_data IS NOT NULL AND v_patent_data IS NOT NULL THEN
        v_features = jsonb_set(v_features, '{patents_to_publications_ratio}', 
            CASE 
                WHEN (v_academic_data->>'publications')::NUMERIC > 0 
                THEN to_jsonb((v_patent_data->>'total_patents')::NUMERIC / (v_academic_data->>'publications')::NUMERIC)
                ELSE '0'
            END
        );
    END IF;
    
    -- Store the extracted features
    FOR feature_name, feature_value IN SELECT * FROM jsonb_each(v_features)
    LOOP
        -- Skip boolean flags
        IF feature_name NOT IN ('has_academic_data', 'has_funding_data', 'has_patent_data') THEN
            INSERT INTO public.ml_external_features (
                project_id,
                feature_name,
                feature_value,
                feature_source,
                created_at,
                updated_at
            ) VALUES (
                p_project_id,
                feature_name,
                (feature_value#>>'{}')::NUMERIC,
                CASE
                    WHEN feature_name IN ('citations', 'publications', 'h_index') THEN 'academic'
                    WHEN feature_name IN ('total_funding', 'active_grants', 'success_rate') THEN 'funding'
                    WHEN feature_name IN ('total_patents', 'pending_patents') THEN 'patent'
                    ELSE 'derived'
                END,
                NOW(),
                NOW()
            )
            ON CONFLICT (project_id, feature_name) 
            DO UPDATE SET
                feature_value = (feature_value#>>'{}')::NUMERIC,
                updated_at = NOW();
        END IF;
    END LOOP;
    
    RETURN v_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to predict completion date with external data
CREATE OR REPLACE FUNCTION predict_completion_with_external_data(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_project RECORD;
    v_features JSONB;
    v_prediction JSONB;
    v_completion_days INTEGER;
    v_completion_date DATE;
    v_confidence NUMERIC;
    v_feature_importance JSONB := '{}'::JSONB;
BEGIN
    -- Get project data
    SELECT * INTO v_project FROM public.projects WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Project not found');
    END IF;
    
    -- Extract features from external data
    v_features := extract_ml_features_from_external_data(p_project_id);
    
    -- In a real implementation, this would use a trained ML model
    -- For now, we'll simulate a prediction based on the features
    
    -- Base prediction on project age and complexity
    v_completion_days := EXTRACT(EPOCH FROM (NOW() - v_project.created_at)) / 86400;
    
    -- Adjust based on external features
    IF (v_features->>'has_academic_data')::BOOLEAN THEN
        -- More citations generally means more complex research
        v_completion_days := v_completion_days + (v_features->>'citations')::INTEGER / 10;
        
        -- More publications means more experience, potentially faster completion
        v_completion_days := v_completion_days - (v_features->>'publications')::INTEGER / 5;
        
        -- Higher h-index indicates more impactful research, potentially more complex
        v_completion_days := v_completion_days + (v_features->>'h_index')::INTEGER * 2;
        
        -- Set feature importance
        v_feature_importance := jsonb_set(v_feature_importance, '{citations}', '0.15');
        v_feature_importance := jsonb_set(v_feature_importance, '{publications}', '0.2');
        v_feature_importance := jsonb_set(v_feature_importance, '{h_index}', '0.1');
    END IF;
    
    IF (v_features->>'has_funding_data')::BOOLEAN THEN
        -- More funding generally means more resources, potentially faster completion
        v_completion_days := v_completion_days - (v_features->>'total_funding')::NUMERIC / 10000;
        
        -- More active grants means more administrative overhead
        v_completion_days := v_completion_days + (v_features->>'active_grants')::INTEGER * 5;
        
        -- Set feature importance
        v_feature_importance := jsonb_set(v_feature_importance, '{total_funding}', '0.25');
        v_feature_importance := jsonb_set(v_feature_importance, '{active_grants}', '0.1');
    END IF;
    
    IF (v_features->>'has_patent_data')::BOOLEAN THEN
        -- More patents generally means more innovation, potentially more complex
        v_completion_days := v_completion_days + (v_features->>'total_patents')::INTEGER * 3;
        
        -- Pending patents means ongoing innovation
        v_completion_days := v_completion_days + (v_features->>'pending_patents')::INTEGER * 2;
        
        -- Set feature importance
        v_feature_importance := jsonb_set(v_feature_importance, '{total_patents}', '0.1');
        v_feature_importance := jsonb_set(v_feature_importance, '{pending_patents}', '0.1');
    END IF;
    
    -- Ensure completion days is positive
    v_completion_days := GREATEST(v_completion_days, 1);
    
    -- Calculate completion date
    v_completion_date := CURRENT_DATE + v_completion_days;
    
    -- Set confidence based on available data
    v_confidence := 0.5; -- Base confidence
    
    IF (v_features->>'has_academic_data')::BOOLEAN THEN
        v_confidence := v_confidence + 0.1;
    END IF;
    
    IF (v_features->>'has_funding_data')::BOOLEAN THEN
        v_confidence := v_confidence + 0.1;
    END IF;
    
    IF (v_features->>'has_patent_data')::BOOLEAN THEN
        v_confidence := v_confidence + 0.1;
    END IF;
    
    -- Build prediction result
    v_prediction := jsonb_build_object(
        'project_id', p_project_id,
        'predicted_completion_days', v_completion_days,
        'predicted_completion_date', v_completion_date,
        'confidence', v_confidence,
        'feature_importance', v_feature_importance,
        'features_used', v_features,
        'prediction_date', CURRENT_DATE,
        'model_version', 'external-data-v1'
    );
    
    -- Store prediction in ml_predictions table
    INSERT INTO public.ml_predictions (
        project_id,
        prediction_type,
        prediction_data,
        created_at
    ) VALUES (
        p_project_id,
        'completion_date',
        v_prediction,
        NOW()
    );
    
    -- Update feature importance in ml_external_features
    FOR feature_name, importance IN SELECT * FROM jsonb_each(v_feature_importance)
    LOOP
        UPDATE public.ml_external_features
        SET feature_importance = (importance#>>'{}')::NUMERIC
        WHERE project_id = p_project_id AND feature_name = feature_name;
    END LOOP;
    
    RETURN v_prediction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to predict user productivity with external data
CREATE OR REPLACE FUNCTION predict_user_productivity_with_external_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_projects JSONB;
    v_external_data JSONB := '{}'::JSONB;
    v_prediction JSONB;
    v_productivity_score NUMERIC;
    v_confidence NUMERIC;
BEGIN
    -- Get user data
    SELECT * INTO v_user FROM auth.users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'User not found');
    END IF;
    
    -- Get projects owned by the user
    SELECT jsonb_agg(id) INTO v_projects
    FROM public.projects
    WHERE owner_id = p_user_id;
    
    -- Aggregate external data across all user projects
    SELECT 
        jsonb_build_object(
            'total_citations', COALESCE(SUM((data->>'citations')::INTEGER), 0),
            'total_publications', COALESCE(SUM((data->>'publications')::INTEGER), 0),
            'total_funding', COALESCE(SUM((data->>'total_funding')::NUMERIC), 0),
            'total_patents', COALESCE(SUM((data->>'total_patents')::INTEGER), 0),
            'project_count', COUNT(DISTINCT entity_id)
        ) INTO v_external_data
    FROM public.external_data_enriched_entities
    WHERE entity_type = 'project'
      AND entity_id IN (SELECT id FROM public.projects WHERE owner_id = p_user_id);
    
    -- In a real implementation, this would use a trained ML model
    -- For now, we'll simulate a prediction based on the aggregated data
    
    -- Calculate productivity score based on external data
    v_productivity_score := 50; -- Base score
    
    -- Adjust based on external data
    IF v_external_data->>'total_citations' IS NOT NULL THEN
        v_productivity_score := v_productivity_score + (v_external_data->>'total_citations')::INTEGER / 10;
    END IF;
    
    IF v_external_data->>'total_publications' IS NOT NULL THEN
        v_productivity_score := v_productivity_score + (v_external_data->>'total_publications')::INTEGER * 5;
    END IF;
    
    IF v_external_data->>'total_funding' IS NOT NULL THEN
        v_productivity_score := v_productivity_score + (v_external_data->>'total_funding')::NUMERIC / 10000;
    END IF;
    
    IF v_external_data->>'total_patents' IS NOT NULL THEN
        v_productivity_score := v_productivity_score + (v_external_data->>'total_patents')::INTEGER * 10;
    END IF;
    
    -- Normalize score to 0-100 range
    v_productivity_score := LEAST(100, GREATEST(0, v_productivity_score));
    
    -- Set confidence based on available data
    v_confidence := 0.5; -- Base confidence
    
    IF (v_external_data->>'project_count')::INTEGER > 0 THEN
        v_confidence := v_confidence + 0.1 * LEAST(5, (v_external_data->>'project_count')::INTEGER) / 5;
    END IF;
    
    -- Build prediction result
    v_prediction := jsonb_build_object(
        'user_id', p_user_id,
        'productivity_score', v_productivity_score,
        'confidence', v_confidence,
        'external_data_summary', v_external_data,
        'projects_analyzed', v_projects,
        'prediction_date', CURRENT_DATE,
        'model_version', 'user-productivity-v1'
    );
    
    -- Store prediction in ml_predictions table
    INSERT INTO public.ml_predictions (
        user_id,
        prediction_type,
        prediction_data,
        created_at
    ) VALUES (
        p_user_id,
        'user_productivity',
        v_prediction,
        NOW()
    );
    
    RETURN v_prediction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ml_external_features_project_id ON public.ml_external_features(project_id);
CREATE INDEX IF NOT EXISTS idx_ml_external_features_feature_name ON public.ml_external_features(feature_name);
CREATE INDEX IF NOT EXISTS idx_ml_external_features_feature_source ON public.ml_external_features(feature_source);
CREATE INDEX IF NOT EXISTS idx_ml_model_versions_external_model_name ON public.ml_model_versions_external(model_name);

-- RLS Policies
ALTER TABLE public.ml_external_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_versions_external ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ML features for projects they have access to"
ON public.ml_external_features FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = ml_external_features.project_id
        AND (projects.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.project_collaborators
                WHERE project_id = projects.id
                AND user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can view ML model versions"
ON public.ml_model_versions_external FOR SELECT
USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.ml_external_features TO authenticated;
GRANT ALL ON public.ml_model_versions_external TO authenticated;
GRANT EXECUTE ON FUNCTION extract_ml_features_from_external_data TO authenticated;
GRANT EXECUTE ON FUNCTION predict_completion_with_external_data TO authenticated;
GRANT EXECUTE ON FUNCTION predict_user_productivity_with_external_data TO authenticated;
