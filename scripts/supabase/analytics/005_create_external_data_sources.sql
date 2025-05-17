-- Create schema for external data sources integration

-- External data source configuration table
CREATE TABLE IF NOT EXISTS public.external_data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL,
    connection_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    refresh_interval_minutes INTEGER DEFAULT 1440, -- Default to daily refresh
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT,
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS external_data_sources_source_type_idx ON public.external_data_sources(source_type);
CREATE INDEX IF NOT EXISTS external_data_sources_is_active_idx ON public.external_data_sources(is_active);
CREATE INDEX IF NOT EXISTS external_data_sources_created_at_idx ON public.external_data_sources(created_at);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_external_data_sources_updated_at
    BEFORE UPDATE ON public.external_data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- External data source mappings table
CREATE TABLE IF NOT EXISTS public.external_data_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    external_field TEXT NOT NULL,
    internal_field TEXT NOT NULL,
    transformation_rule TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS external_data_mappings_source_id_idx ON public.external_data_mappings(source_id);
CREATE INDEX IF NOT EXISTS external_data_mappings_entity_type_idx ON public.external_data_mappings(entity_type);
CREATE INDEX IF NOT EXISTS external_data_mappings_is_active_idx ON public.external_data_mappings(is_active);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_external_data_mappings_updated_at
    BEFORE UPDATE ON public.external_data_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- External data cache table
CREATE TABLE IF NOT EXISTS public.external_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    external_id TEXT,
    data JSONB NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN DEFAULT true
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS external_data_cache_source_id_idx ON public.external_data_cache(source_id);
CREATE INDEX IF NOT EXISTS external_data_cache_entity_type_entity_id_idx ON public.external_data_cache(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS external_data_cache_external_id_idx ON public.external_data_cache(external_id);
CREATE INDEX IF NOT EXISTS external_data_cache_fetched_at_idx ON public.external_data_cache(fetched_at);
CREATE INDEX IF NOT EXISTS external_data_cache_expires_at_idx ON public.external_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS external_data_cache_is_valid_idx ON public.external_data_cache(is_valid);

-- External data enriched entities table
CREATE TABLE IF NOT EXISTS public.external_data_enriched_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    source_id UUID NOT NULL REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
    enriched_data JSONB NOT NULL,
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS external_data_enriched_entities_entity_type_entity_id_idx ON public.external_data_enriched_entities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS external_data_enriched_entities_source_id_idx ON public.external_data_enriched_entities(source_id);
CREATE INDEX IF NOT EXISTS external_data_enriched_entities_created_at_idx ON public.external_data_enriched_entities(created_at);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_external_data_enriched_entities_updated_at
    BEFORE UPDATE ON public.external_data_enriched_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on external data sources table
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;

-- Policy for external_data_sources: Only admins can create/update sources
CREATE POLICY external_data_sources_admin_policy
    ON public.external_data_sources
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for external_data_sources: All authenticated users can view sources
CREATE POLICY external_data_sources_select_policy
    ON public.external_data_sources
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Enable RLS on external data mappings table
ALTER TABLE public.external_data_mappings ENABLE ROW LEVEL SECURITY;

-- Policy for external_data_mappings: Only admins can manage mappings
CREATE POLICY external_data_mappings_admin_policy
    ON public.external_data_mappings
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for external_data_mappings: All authenticated users can view mappings
CREATE POLICY external_data_mappings_select_policy
    ON public.external_data_mappings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Enable RLS on external data cache table
ALTER TABLE public.external_data_cache ENABLE ROW LEVEL SECURITY;

-- Policy for external_data_cache: Only admins can manage cache
CREATE POLICY external_data_cache_admin_policy
    ON public.external_data_cache
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on external data enriched entities table
ALTER TABLE public.external_data_enriched_entities ENABLE ROW LEVEL SECURITY;

-- Policy for external_data_enriched_entities: Users can only see enriched data for projects they have access to
CREATE POLICY external_data_enriched_entities_project_select_policy
    ON public.external_data_enriched_entities
    FOR SELECT
    USING (
        (entity_type = 'project' AND entity_id IN (
            SELECT project_id FROM public.project_collaborators
            WHERE user_id = auth.uid() AND invitation_status = 'accepted'
        )) OR
        (entity_type = 'user' AND entity_id = auth.uid())
    );

-- Policy for external_data_enriched_entities: Only admins can create/update enriched entities
CREATE POLICY external_data_enriched_entities_admin_policy
    ON public.external_data_enriched_entities
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Function to fetch and process external data
CREATE OR REPLACE FUNCTION public.fetch_external_data(
    p_source_id UUID,
    p_entity_type TEXT,
    p_entity_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_source RECORD;
    v_result JSONB;
    v_cache_record RECORD;
    v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
    -- Get the external data source configuration
    SELECT * INTO v_source
    FROM public.external_data_sources
    WHERE id = p_source_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'External data source not found or inactive'
        );
    END IF;
    
    -- Check if we have a valid cached result
    SELECT * INTO v_cache_record
    FROM public.external_data_cache
    WHERE source_id = p_source_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND is_valid = true
      AND (expires_at IS NULL OR expires_at > v_now);
    
    IF FOUND THEN
        -- Return the cached data
        RETURN jsonb_build_object(
            'success', true,
            'data', v_cache_record.data,
            'cached', true,
            'fetched_at', v_cache_record.fetched_at
        );
    END IF;
    
    -- In a real implementation, this would make an API call to the external service
    -- For now, we'll simulate a response based on the source type
    
    IF v_source.source_type = 'academic_database' THEN
        -- Simulate academic database response
        v_result := jsonb_build_object(
            'citations', floor(random() * 100)::int,
            'publications', floor(random() * 10)::int,
            'h_index', floor(random() * 20)::int,
            'research_areas', jsonb_build_array('Machine Learning', 'Data Science', 'Artificial Intelligence'),
            'recent_publications', jsonb_build_array(
                jsonb_build_object(
                    'title', 'Advances in Research Management Systems',
                    'journal', 'Journal of Research Management',
                    'year', 2024,
                    'authors', jsonb_build_array('Smith, J.', 'Johnson, A.', 'Williams, B.')
                ),
                jsonb_build_object(
                    'title', 'Machine Learning Applications in Research',
                    'journal', 'AI Research Journal',
                    'year', 2023,
                    'authors', jsonb_build_array('Johnson, A.', 'Davis, C.')
                )
            )
        );
    ELSIF v_source.source_type = 'funding_database' THEN
        -- Simulate funding database response
        v_result := jsonb_build_object(
            'total_funding', floor(random() * 1000000)::int,
            'active_grants', floor(random() * 5)::int,
            'funding_sources', jsonb_build_array(
                jsonb_build_object(
                    'name', 'National Science Foundation',
                    'amount', floor(random() * 500000)::int,
                    'start_date', '2023-01-01',
                    'end_date', '2025-12-31'
                ),
                jsonb_build_object(
                    'name', 'Research Innovation Fund',
                    'amount', floor(random() * 250000)::int,
                    'start_date', '2024-03-15',
                    'end_date', '2026-03-14'
                )
            ),
            'success_rate', (random() * 0.7 + 0.2)::float
        );
    ELSIF v_source.source_type = 'patent_database' THEN
        -- Simulate patent database response
        v_result := jsonb_build_object(
            'total_patents', floor(random() * 10)::int,
            'pending_patents', floor(random() * 3)::int,
            'patents', jsonb_build_array(
                jsonb_build_object(
                    'title', 'Method for Automated Research Management',
                    'filing_date', '2023-05-12',
                    'status', 'Granted',
                    'patent_number', 'US' || floor(random() * 10000000)::text
                ),
                jsonb_build_object(
                    'title', 'System for Collaborative Research Analysis',
                    'filing_date', '2024-02-28',
                    'status', 'Pending',
                    'application_number', 'US' || floor(random() * 10000000)::text
                )
            )
        );
    ELSE
        -- Generic response for other source types
        v_result := jsonb_build_object(
            'data_points', floor(random() * 100)::int,
            'last_updated', v_now,
            'source', v_source.name
        );
    END IF;
    
    -- Store the result in the cache
    INSERT INTO public.external_data_cache (
        source_id,
        entity_type,
        entity_id,
        data,
        fetched_at,
        expires_at,
        is_valid
    ) VALUES (
        p_source_id,
        p_entity_type,
        p_entity_id,
        v_result,
        v_now,
        v_now + (v_source.refresh_interval_minutes * INTERVAL '1 minute'),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        data = v_result,
        fetched_at = v_now,
        expires_at = v_now + (v_source.refresh_interval_minutes * INTERVAL '1 minute'),
        is_valid = true;
    
    -- Return the result
    RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'cached', false,
        'fetched_at', v_now
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enrich entity with external data
CREATE OR REPLACE FUNCTION public.enrich_entity_with_external_data(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_source_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_source RECORD;
    v_mappings RECORD;
    v_external_data JSONB;
    v_enriched_data JSONB := '{}'::JSONB;
    v_fetch_result JSONB;
    v_confidence_score FLOAT := 0.7; -- Default confidence score
    v_result JSONB;
BEGIN
    -- Get the external data source configuration
    SELECT * INTO v_source
    FROM public.external_data_sources
    WHERE id = p_source_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'External data source not found or inactive'
        );
    END IF;
    
    -- Fetch external data
    v_fetch_result := public.fetch_external_data(p_source_id, p_entity_type, p_entity_id::TEXT);
    
    IF NOT (v_fetch_result->>'success')::BOOLEAN THEN
        RETURN v_fetch_result;
    END IF;
    
    v_external_data := v_fetch_result->'data';
    
    -- Process the data according to mappings
    FOR v_mappings IN
        SELECT *
        FROM public.external_data_mappings
        WHERE source_id = p_source_id
          AND entity_type = p_entity_type
          AND is_active = true
    LOOP
        -- Apply transformation if needed
        IF v_mappings.transformation_rule IS NOT NULL THEN
            -- In a real implementation, this would apply the transformation rule
            -- For now, we'll just copy the value
            v_enriched_data := jsonb_set(
                v_enriched_data,
                array[v_mappings.internal_field],
                v_external_data->v_mappings.external_field
            );
        ELSE
            -- Direct mapping
            v_enriched_data := jsonb_set(
                v_enriched_data,
                array[v_mappings.internal_field],
                v_external_data->v_mappings.external_field
            );
        END IF;
    END LOOP;
    
    -- If no mappings were found, use the raw data
    IF jsonb_typeof(v_enriched_data) = 'object' AND jsonb_object_keys(v_enriched_data) = 0 THEN
        v_enriched_data := v_external_data;
    END IF;
    
    -- Store the enriched data
    INSERT INTO public.external_data_enriched_entities (
        entity_type,
        entity_id,
        source_id,
        enriched_data,
        confidence_score,
        created_at,
        updated_at
    ) VALUES (
        p_entity_type,
        p_entity_id,
        p_source_id,
        v_enriched_data,
        v_confidence_score,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        enriched_data = v_enriched_data,
        confidence_score = v_confidence_score,
        updated_at = now();
    
    -- Return the result
    v_result := jsonb_build_object(
        'success', true,
        'enriched_data', v_enriched_data,
        'confidence_score', v_confidence_score,
        'source', v_source.name,
        'source_type', v_source.source_type
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get enriched entity data
CREATE OR REPLACE FUNCTION public.get_enriched_entity_data(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_source_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_sources JSONB := '[]'::JSONB;
    v_source_record RECORD;
    v_enriched_record RECORD;
BEGIN
    -- If source_id is provided, get data from that source only
    IF p_source_id IS NOT NULL THEN
        SELECT * INTO v_enriched_record
        FROM public.external_data_enriched_entities
        WHERE entity_type = p_entity_type
          AND entity_id = p_entity_id
          AND source_id = p_source_id
        ORDER BY updated_at DESC
        LIMIT 1;
        
        IF FOUND THEN
            SELECT name, source_type INTO v_source_record
            FROM public.external_data_sources
            WHERE id = p_source_id;
            
            v_sources := jsonb_build_array(
                jsonb_build_object(
                    'id', p_source_id,
                    'name', v_source_record.name,
                    'type', v_source_record.source_type,
                    'data', v_enriched_record.enriched_data,
                    'confidence_score', v_enriched_record.confidence_score,
                    'updated_at', v_enriched_record.updated_at
                )
            );
        END IF;
    ELSE
        -- Get data from all sources
        v_sources := (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', e.source_id,
                    'name', s.name,
                    'type', s.source_type,
                    'data', e.enriched_data,
                    'confidence_score', e.confidence_score,
                    'updated_at', e.updated_at
                )
            )
            FROM public.external_data_enriched_entities e
            JOIN public.external_data_sources s ON e.source_id = s.id
            WHERE e.entity_type = p_entity_type
              AND e.entity_id = p_entity_id
        );
        
        IF v_sources IS NULL THEN
            v_sources := '[]'::JSONB;
        END IF;
    END IF;
    
    -- Return the result
    v_result := jsonb_build_object(
        'entity_type', p_entity_type,
        'entity_id', p_entity_id,
        'sources', v_sources
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample external data sources
INSERT INTO public.external_data_sources (
    name,
    description,
    source_type,
    connection_config,
    is_active,
    refresh_interval_minutes
) VALUES (
    'Academic Research Database',
    'Integration with academic research database for citation and publication data',
    'academic_database',
    jsonb_build_object(
        'api_url', 'https://api.academicdatabase.example.com/v1',
        'auth_method', 'api_key',
        'timeout_seconds', 30
    ),
    true,
    1440
), (
    'Research Funding Database',
    'Integration with funding database for grant and funding information',
    'funding_database',
    jsonb_build_object(
        'api_url', 'https://api.fundingdatabase.example.com/v2',
        'auth_method', 'oauth2',
        'timeout_seconds', 30
    ),
    true,
    4320
), (
    'Patent Database',
    'Integration with patent database for intellectual property information',
    'patent_database',
    jsonb_build_object(
        'api_url', 'https://api.patentdatabase.example.com/v1',
        'auth_method', 'api_key',
        'timeout_seconds', 30
    ),
    true,
    10080
);

-- Insert sample external data mappings
INSERT INTO public.external_data_mappings (
    source_id,
    entity_type,
    external_field,
    internal_field,
    is_active
) VALUES (
    (SELECT id FROM public.external_data_sources WHERE name = 'Academic Research Database'),
    'project',
    'citations',
    'citation_count',
    true
), (
    (SELECT id FROM public.external_data_sources WHERE name = 'Academic Research Database'),
    'project',
    'publications',
    'publication_count',
    true
), (
    (SELECT id FROM public.external_data_sources WHERE name = 'Academic Research Database'),
    'project',
    'h_index',
    'h_index',
    true
), (
    (SELECT id FROM public.external_data_sources WHERE name = 'Research Funding Database'),
    'project',
    'total_funding',
    'funding_amount',
    true
), (
    (SELECT id FROM public.external_data_sources WHERE name = 'Research Funding Database'),
    'project',
    'active_grants',
    'active_grant_count',
    true
), (
    (SELECT id FROM public.external_data_sources WHERE name = 'Patent Database'),
    'project',
    'total_patents',
    'patent_count',
    true
), (
    (SELECT id FROM public.external_data_sources WHERE name = 'Patent Database'),
    'project',
    'pending_patents',
    'pending_patent_count',
    true
);
