-- Create team analytics schema
-- This script adds team analytics functionality

-- Create team_analytics table to store team-specific analytics data
CREATE TABLE team_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure uniqueness of team-date pairs
  UNIQUE(team_id, date)
);

-- Create indexes for faster lookups
CREATE INDEX idx_team_analytics_team_id ON team_analytics(team_id);
CREATE INDEX idx_team_analytics_date ON team_analytics(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_team_analytics_updated_at
BEFORE UPDATE ON team_analytics
FOR EACH ROW
EXECUTE FUNCTION update_team_analytics_updated_at();

-- Create RLS policies for team_analytics
ALTER TABLE team_analytics ENABLE ROW LEVEL SECURITY;

-- Policy for select: Users can view analytics for teams they are members of
CREATE POLICY team_analytics_select_policy ON team_analytics
FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Policy for insert: Users can add analytics to teams they are admins or managers of
CREATE POLICY team_analytics_insert_policy ON team_analytics
FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Policy for update: Users can update analytics for teams they are admins or managers of
CREATE POLICY team_analytics_update_policy ON team_analytics
FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Policy for delete: Users can delete analytics from teams they are admins of
CREATE POLICY team_analytics_delete_policy ON team_analytics
FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create team_activity_logs table to store team activity logs
CREATE TABLE team_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_team_activity_logs_team_id ON team_activity_logs(team_id);
CREATE INDEX idx_team_activity_logs_user_id ON team_activity_logs(user_id);
CREATE INDEX idx_team_activity_logs_created_at ON team_activity_logs(created_at);
CREATE INDEX idx_team_activity_logs_entity_type ON team_activity_logs(entity_type);
CREATE INDEX idx_team_activity_logs_entity_id ON team_activity_logs(entity_id);

-- Create RLS policies for team_activity_logs
ALTER TABLE team_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy for select: Users can view activity logs for teams they are members of
CREATE POLICY team_activity_logs_select_policy ON team_activity_logs
FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Policy for insert: Users can add activity logs to teams they are members of
CREATE POLICY team_activity_logs_insert_policy ON team_activity_logs
FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Policy for delete: Users can delete activity logs from teams they are admins of
CREATE POLICY team_activity_logs_delete_policy ON team_activity_logs
FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create function to log team activity
CREATE OR REPLACE FUNCTION log_team_activity(
  p_team_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Check if the user is a member of the team
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not authorized to log activity for this team';
  END IF;
  
  -- Insert the activity log
  INSERT INTO team_activity_logs (
    team_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    p_team_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get team analytics for a specific date range
CREATE OR REPLACE FUNCTION get_team_analytics(
  p_team_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if the user is a member of the team
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not authorized to access analytics for this team';
  END IF;
  
  -- Return analytics for the specified date range
  RETURN QUERY
  SELECT ta.date, ta.metrics, ta.created_at, ta.updated_at
  FROM team_analytics ta
  WHERE ta.team_id = p_team_id
  AND ta.date BETWEEN p_start_date AND p_end_date
  ORDER BY ta.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get team activity logs
CREATE OR REPLACE FUNCTION get_team_activity_logs(
  p_team_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if the user is a member of the team
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not authorized to access activity logs for this team';
  END IF;
  
  -- Return activity logs with filters
  RETURN QUERY
  SELECT 
    tal.id,
    tal.user_id,
    u.email AS user_email,
    u.raw_user_meta_data->>'full_name' AS user_name,
    tal.action,
    tal.entity_type,
    tal.entity_id,
    tal.details,
    tal.created_at
  FROM team_activity_logs tal
  JOIN auth.users u ON tal.user_id = u.id
  WHERE tal.team_id = p_team_id
  AND (p_start_date IS NULL OR tal.created_at >= p_start_date)
  AND (p_end_date IS NULL OR tal.created_at <= p_end_date)
  AND (p_user_id IS NULL OR tal.user_id = p_user_id)
  AND (p_entity_type IS NULL OR tal.entity_type = p_entity_type)
  AND (p_entity_id IS NULL OR tal.entity_id = p_entity_id)
  AND (p_action IS NULL OR tal.action = p_action)
  ORDER BY tal.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update or insert team analytics for a specific date
CREATE OR REPLACE FUNCTION upsert_team_analytics(
  p_team_id UUID,
  p_date DATE,
  p_metrics JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is a member of the team with admin or manager role
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'User is not authorized to update analytics for this team';
  END IF;
  
  -- Insert or update the analytics
  INSERT INTO team_analytics (team_id, date, metrics)
  VALUES (p_team_id, p_date, p_metrics)
  ON CONFLICT (team_id, date)
  DO UPDATE SET metrics = p_metrics, updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get team analytics summary
CREATE OR REPLACE FUNCTION get_team_analytics_summary(
  p_team_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
BEGIN
  -- Check if the user is a member of the team
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not authorized to access analytics for this team';
  END IF;
  
  -- Calculate summary metrics
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date,
      'days', (p_end_date - p_start_date) + 1
    ),
    'projects', (
      SELECT jsonb_build_object(
        'total', COUNT(DISTINCT pr.id),
        'active', COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'active'),
        'completed', COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'completed')
      )
      FROM research_projects pr
      WHERE pr.team_id = p_team_id
      AND (pr.created_at::date BETWEEN p_start_date AND p_end_date
           OR pr.updated_at::date BETWEEN p_start_date AND p_end_date)
    ),
    'activity', (
      SELECT jsonb_build_object(
        'total_logs', COUNT(*),
        'unique_users', COUNT(DISTINCT tal.user_id),
        'actions', jsonb_object_agg(tal.action, COUNT(*))
      )
      FROM team_activity_logs tal
      WHERE tal.team_id = p_team_id
      AND tal.created_at::date BETWEEN p_start_date AND p_end_date
      GROUP BY tal.team_id
    )
  ) INTO v_summary;
  
  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get team member activity summary
CREATE OR REPLACE FUNCTION get_team_member_activity_summary(
  p_team_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  activity_count BIGINT,
  last_active TIMESTAMP WITH TIME ZONE,
  actions JSONB
) AS $$
BEGIN
  -- Check if the user is a member of the team
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not authorized to access member activity for this team';
  END IF;
  
  -- Return member activity summary
  RETURN QUERY
  SELECT 
    tal.user_id,
    u.email AS user_email,
    u.raw_user_meta_data->>'full_name' AS user_name,
    COUNT(*) AS activity_count,
    MAX(tal.created_at) AS last_active,
    jsonb_object_agg(tal.action, COUNT(*)) AS actions
  FROM team_activity_logs tal
  JOIN auth.users u ON tal.user_id = u.id
  WHERE tal.team_id = p_team_id
  AND tal.created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY tal.user_id, u.email, u.raw_user_meta_data->>'full_name'
  ORDER BY activity_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically log team activity

-- Trigger for team resources
CREATE OR REPLACE FUNCTION log_team_resource_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'create',
      'team_resource',
      NEW.id,
      jsonb_build_object('name', NEW.name, 'type', NEW.type)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'update',
      'team_resource',
      NEW.id,
      jsonb_build_object(
        'name', NEW.name, 
        'type', NEW.type,
        'changes', jsonb_build_object(
          'name', CASE WHEN OLD.name != NEW.name THEN jsonb_build_array(OLD.name, NEW.name) ELSE NULL END,
          'type', CASE WHEN OLD.type != NEW.type THEN jsonb_build_array(OLD.type, NEW.type) ELSE NULL END,
          'url', CASE WHEN OLD.url != NEW.url THEN jsonb_build_array(OLD.url, NEW.url) ELSE NULL END
        )
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_team_activity(
      OLD.team_id,
      'delete',
      'team_resource',
      OLD.id,
      jsonb_build_object('name', OLD.name, 'type', OLD.type)
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_team_resource_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON team_resources
FOR EACH ROW
EXECUTE FUNCTION log_team_resource_activity();

-- Trigger for team settings
CREATE OR REPLACE FUNCTION log_team_setting_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'create',
      'team_setting',
      NEW.id,
      jsonb_build_object('key', NEW.key)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'update',
      'team_setting',
      NEW.id,
      jsonb_build_object('key', NEW.key)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_team_activity(
      OLD.team_id,
      'delete',
      'team_setting',
      OLD.id,
      jsonb_build_object('key', OLD.key)
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_team_setting_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON team_settings
FOR EACH ROW
EXECUTE FUNCTION log_team_setting_activity();

-- Trigger for team members
CREATE OR REPLACE FUNCTION log_team_member_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'add_member',
      'team_member',
      NEW.id,
      jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role != NEW.role THEN
      PERFORM log_team_activity(
        NEW.team_id,
        'update_member_role',
        'team_member',
        NEW.id,
        jsonb_build_object(
          'user_id', NEW.user_id,
          'old_role', OLD.role,
          'new_role', NEW.role
        )
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_team_activity(
      OLD.team_id,
      'remove_member',
      'team_member',
      OLD.id,
      jsonb_build_object('user_id', OLD.user_id, 'role', OLD.role)
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_team_member_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION log_team_member_activity();

-- Trigger for team invitations
CREATE OR REPLACE FUNCTION log_team_invitation_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_team_activity(
      NEW.team_id,
      'create_invitation',
      'team_invitation',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'role', NEW.role)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_team_activity(
      OLD.team_id,
      'delete_invitation',
      'team_invitation',
      OLD.id,
      jsonb_build_object('email', OLD.email, 'role', OLD.role)
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_team_invitation_activity_trigger
AFTER INSERT OR DELETE ON team_invitations
FOR EACH ROW
EXECUTE FUNCTION log_team_invitation_activity();
