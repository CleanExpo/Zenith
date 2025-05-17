-- 004_update_collaboration_schema.sql

-- Create table for external data annotations
CREATE TABLE IF NOT EXISTS public.external_data_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    external_data_source_id UUID REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    annotation_type TEXT NOT NULL,
    content TEXT NOT NULL,
    data_path TEXT,
    position JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for external data sharing preferences
CREATE TABLE IF NOT EXISTS public.external_data_sharing_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    external_data_source_id UUID REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id, external_data_source_id)
);

-- Create table for collaborative external data filters
CREATE TABLE IF NOT EXISTS public.collaborative_data_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    filter_config JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for external data view configurations
CREATE TABLE IF NOT EXISTS public.external_data_view_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for external data notifications
CREATE TABLE IF NOT EXISTS public.external_data_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    external_data_source_id UUID REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to add annotation to external data
CREATE OR REPLACE FUNCTION add_external_data_annotation(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_external_data_source_id UUID,
    p_annotation_type TEXT,
    p_content TEXT,
    p_data_path TEXT DEFAULT NULL,
    p_position JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_annotation_id UUID;
    v_result JSONB;
BEGIN
    -- Insert annotation
    INSERT INTO public.external_data_annotations (
        entity_type,
        entity_id,
        external_data_source_id,
        user_id,
        annotation_type,
        content,
        data_path,
        position,
        created_at,
        updated_at
    ) VALUES (
        p_entity_type,
        p_entity_id,
        p_external_data_source_id,
        auth.uid(),
        p_annotation_type,
        p_content,
        p_data_path,
        p_position,
        NOW(),
        NOW()
    ) RETURNING id INTO v_annotation_id;
    
    -- Create notification for project collaborators
    IF p_entity_type = 'project' THEN
        INSERT INTO public.external_data_notifications (
            project_id,
            user_id,
            external_data_source_id,
            notification_type,
            content,
            created_at
        )
        SELECT 
            p_entity_id,
            pc.user_id,
            p_external_data_source_id,
            'annotation_added',
            'New annotation added to external data',
            NOW()
        FROM public.project_collaborators pc
        WHERE pc.project_id = p_entity_id
          AND pc.user_id != auth.uid();
    END IF;
    
    -- Build result
    v_result := jsonb_build_object(
        'annotation_id', v_annotation_id,
        'entity_type', p_entity_type,
        'entity_id', p_entity_id,
        'external_data_source_id', p_external_data_source_id,
        'user_id', auth.uid(),
        'annotation_type', p_annotation_type,
        'content', p_content,
        'created_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get annotations for external data
CREATE OR REPLACE FUNCTION get_external_data_annotations(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_external_data_source_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_annotations JSONB;
BEGIN
    -- Get annotations
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'entity_type', a.entity_type,
            'entity_id', a.entity_id,
            'external_data_source', s.name,
            'user', u.email,
            'annotation_type', a.annotation_type,
            'content', a.content,
            'data_path', a.data_path,
            'position', a.position,
            'created_at', a.created_at
        )
    ) INTO v_annotations
    FROM public.external_data_annotations a
    JOIN public.external_data_sources s ON a.external_data_source_id = s.id
    JOIN auth.users u ON a.user_id = u.id
    WHERE a.entity_type = p_entity_type
      AND a.entity_id = p_entity_id
      AND (p_external_data_source_id IS NULL OR a.external_data_source_id = p_external_data_source_id)
    ORDER BY a.created_at DESC;
    
    IF v_annotations IS NULL THEN
        v_annotations := '[]'::JSONB;
    END IF;
    
    RETURN jsonb_build_object(
        'entity_type', p_entity_type,
        'entity_id', p_entity_id,
        'annotations', v_annotations
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to save collaborative filter
CREATE OR REPLACE FUNCTION save_collaborative_data_filter(
    p_name TEXT,
    p_description TEXT,
    p_project_id UUID,
    p_filter_config JSONB,
    p_is_public BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    v_filter_id UUID;
    v_result JSONB;
BEGIN
    -- Insert filter
    INSERT INTO public.collaborative_data_filters (
        name,
        description,
        project_id,
        created_by,
        filter_config,
        is_public,
        created_at,
        updated_at
    ) VALUES (
        p_name,
        p_description,
        p_project_id,
        auth.uid(),
        p_filter_config,
        p_is_public,
        NOW(),
        NOW()
    ) RETURNING id INTO v_filter_id;
    
    -- Create notification for project collaborators
    INSERT INTO public.external_data_notifications (
        project_id,
        user_id,
        notification_type,
        content,
        created_at
    )
    SELECT 
        p_project_id,
        pc.user_id,
        'filter_created',
        'New collaborative filter created: ' || p_name,
        NOW()
    FROM public.project_collaborators pc
    WHERE pc.project_id = p_project_id
      AND pc.user_id != auth.uid();
    
    -- Build result
    v_result := jsonb_build_object(
        'filter_id', v_filter_id,
        'name', p_name,
        'project_id', p_project_id,
        'created_by', auth.uid(),
        'is_public', p_is_public,
        'created_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to apply collaborative filter
CREATE OR REPLACE FUNCTION apply_collaborative_data_filter(
    p_filter_id UUID,
    p_project_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_filter RECORD;
    v_filter_config JSONB;
    v_result JSONB;
    v_filtered_data JSONB := '[]'::JSONB;
    v_source_ids JSONB;
    v_source_id UUID;
    v_source_data JSONB;
BEGIN
    -- Get filter
    SELECT * INTO v_filter
    FROM public.collaborative_data_filters
    WHERE id = p_filter_id
      AND project_id = p_project_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Filter not found');
    END IF;
    
    v_filter_config := v_filter.filter_config;
    
    -- Get source IDs from filter config
    v_source_ids := v_filter_config->'source_ids';
    
    -- Process each source
    FOR i IN 0..jsonb_array_length(v_source_ids) - 1
    LOOP
        v_source_id := (v_source_ids->>i)::UUID;
        
        -- Get enriched data for this source
        SELECT jsonb_build_object(
            'source_id', ede.source_id,
            'source_name', eds.name,
            'source_type', eds.source_type,
            'data', ede.enriched_data
        ) INTO v_source_data
        FROM public.external_data_enriched_entities ede
        JOIN public.external_data_sources eds ON ede.source_id = eds.id
        WHERE ede.entity_type = 'project'
          AND ede.entity_id = p_project_id
          AND ede.source_id = v_source_id;
        
        IF v_source_data IS NOT NULL THEN
            -- Apply filters based on source type
            IF v_filter_config->'filters' ? (eds.source_type) THEN
                -- In a real implementation, this would apply the filters
                -- For now, we'll just include the data
                v_filtered_data := v_filtered_data || v_source_data;
            ELSE
                -- Include unfiltered data
                v_filtered_data := v_filtered_data || v_source_data;
            END IF;
        END IF;
    END LOOP;
    
    -- Build result
    v_result := jsonb_build_object(
        'filter_id', p_filter_id,
        'filter_name', v_filter.name,
        'project_id', p_project_id,
        'filtered_data', v_filtered_data,
        'applied_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to share external data view
CREATE OR REPLACE FUNCTION share_external_data_view(
    p_view_config_id UUID,
    p_is_shared BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_view_config RECORD;
    v_result JSONB;
BEGIN
    -- Get view config
    SELECT * INTO v_view_config
    FROM public.external_data_view_configs
    WHERE id = p_view_config_id
      AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'View configuration not found or not owned by you');
    END IF;
    
    -- Update sharing status
    UPDATE public.external_data_view_configs
    SET 
        is_shared = p_is_shared,
        updated_at = NOW()
    WHERE id = p_view_config_id;
    
    -- Create notification for project collaborators if sharing
    IF p_is_shared THEN
        INSERT INTO public.external_data_notifications (
            project_id,
            user_id,
            notification_type,
            content,
            created_at
        )
        SELECT 
            v_view_config.project_id,
            pc.user_id,
            'view_shared',
            'External data view shared: ' || v_view_config.name,
            NOW()
        FROM public.project_collaborators pc
        WHERE pc.project_id = v_view_config.project_id
          AND pc.user_id != auth.uid();
    END IF;
    
    -- Build result
    v_result := jsonb_build_object(
        'view_config_id', p_view_config_id,
        'name', v_view_config.name,
        'project_id', v_view_config.project_id,
        'is_shared', p_is_shared,
        'updated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_external_data_notifications_read(
    p_notification_ids JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Mark notifications as read
    WITH updated_notifications AS (
        UPDATE public.external_data_notifications
        SET is_read = TRUE
        WHERE id IN (
            SELECT jsonb_array_elements_text(p_notification_ids)::UUID
        )
        AND user_id = auth.uid()
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM updated_notifications;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'count', v_count,
        'updated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_external_data_annotations_entity ON public.external_data_annotations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_external_data_annotations_source ON public.external_data_annotations(external_data_source_id);
CREATE INDEX IF NOT EXISTS idx_external_data_annotations_user ON public.external_data_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_external_data_sharing_preferences_project ON public.external_data_sharing_preferences(project_id);
CREATE INDEX IF NOT EXISTS idx_external_data_sharing_preferences_user ON public.external_data_sharing_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_data_filters_project ON public.collaborative_data_filters(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_data_filters_created_by ON public.collaborative_data_filters(created_by);
CREATE INDEX IF NOT EXISTS idx_external_data_view_configs_project ON public.external_data_view_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_external_data_view_configs_user ON public.external_data_view_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_external_data_notifications_project ON public.external_data_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_external_data_notifications_user ON public.external_data_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_external_data_notifications_is_read ON public.external_data_notifications(is_read);

-- RLS Policies
ALTER TABLE public.external_data_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_sharing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_data_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_view_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_notifications ENABLE ROW LEVEL SECURITY;

-- External data annotations policies
CREATE POLICY "Users can view annotations for projects they have access to"
ON public.external_data_annotations FOR SELECT
USING (
    (entity_type = 'project' AND entity_id IN (
        SELECT id FROM public.projects
        WHERE owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid()
        )
    )) OR
    user_id = auth.uid()
);

CREATE POLICY "Users can create annotations"
ON public.external_data_annotations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own annotations"
ON public.external_data_annotations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own annotations"
ON public.external_data_annotations FOR DELETE
USING (user_id = auth.uid());

-- External data sharing preferences policies
CREATE POLICY "Users can view sharing preferences for projects they have access to"
ON public.external_data_sharing_preferences FOR SELECT
USING (
    project_id IN (
        SELECT id FROM public.projects
        WHERE owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid()
        )
    ) OR
    user_id = auth.uid()
);

CREATE POLICY "Users can create sharing preferences for themselves"
ON public.external_data_sharing_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sharing preferences"
ON public.external_data_sharing_preferences FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sharing preferences"
ON public.external_data_sharing_preferences FOR DELETE
USING (user_id = auth.uid());

-- Collaborative data filters policies
CREATE POLICY "Users can view filters for projects they have access to"
ON public.collaborative_data_filters FOR SELECT
USING (
    project_id IN (
        SELECT id FROM public.projects
        WHERE owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid()
        )
    ) OR
    is_public = true
);

CREATE POLICY "Users can create filters for projects they have access to"
ON public.collaborative_data_filters FOR INSERT
WITH CHECK (
    project_id IN (
        SELECT id FROM public.projects
        WHERE owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can update filters they created"
ON public.collaborative_data_filters FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete filters they created"
ON public.collaborative_data_filters FOR DELETE
USING (created_by = auth.uid());

-- External data view configs policies
CREATE POLICY "Users can view shared view configs or their own"
ON public.external_data_view_configs FOR SELECT
USING (
    user_id = auth.uid() OR
    (is_shared = true AND project_id IN (
        SELECT id FROM public.projects
        WHERE owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid()
        )
    ))
);

CREATE POLICY "Users can create view configs"
ON public.external_data_view_configs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own view configs"
ON public.external_data_view_configs FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own view configs"
ON public.external_data_view_configs FOR DELETE
USING (user_id = auth.uid());

-- External data notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.external_data_notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.external_data_notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications"
ON public.external_data_notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.external_data_notifications FOR DELETE
USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.external_data_annotations TO authenticated;
GRANT ALL ON public.external_data_sharing_preferences TO authenticated;
GRANT ALL ON public.collaborative_data_filters TO authenticated;
GRANT ALL ON public.external_data_view_configs TO authenticated;
GRANT ALL ON public.external_data_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION add_external_data_annotation TO authenticated;
GRANT EXECUTE ON FUNCTION get_external_data_annotations TO authenticated;
GRANT EXECUTE ON FUNCTION save_collaborative_data_filter TO authenticated;
GRANT EXECUTE ON FUNCTION apply_collaborative_data_filter TO authenticated;
GRANT EXECUTE ON FUNCTION share_external_data_view TO authenticated;
GRANT EXECUTE ON FUNCTION mark_external_data_notifications_read TO authenticated;
