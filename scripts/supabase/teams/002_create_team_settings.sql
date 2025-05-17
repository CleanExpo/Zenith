-- Create team settings schema
-- This script adds team settings functionality

-- Create team_settings table to store team-specific settings
CREATE TABLE team_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure uniqueness of team-key pairs
  UNIQUE(team_id, key)
);

-- Create indexes for faster lookups
CREATE INDEX idx_team_settings_team_id ON team_settings(team_id);
CREATE INDEX idx_team_settings_key ON team_settings(key);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_team_settings_updated_at
BEFORE UPDATE ON team_settings
FOR EACH ROW
EXECUTE FUNCTION update_team_settings_updated_at();

-- Create RLS policies for team_settings
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;

-- Policy for select: Users can view settings for teams they are members of
CREATE POLICY team_settings_select_policy ON team_settings
FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Policy for insert: Users can add settings to teams they are admins or managers of
CREATE POLICY team_settings_insert_policy ON team_settings
FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Policy for update: Users can update settings for teams they are admins or managers of
CREATE POLICY team_settings_update_policy ON team_settings
FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Policy for delete: Users can delete settings from teams they are admins of
CREATE POLICY team_settings_delete_policy ON team_settings
FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create function to get a team setting
CREATE OR REPLACE FUNCTION get_team_setting(
  p_team_id UUID,
  p_key TEXT,
  p_default JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_value JSONB;
BEGIN
  -- Check if the user is a member of the team
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not authorized to access settings for this team';
  END IF;
  
  -- Get the setting value
  SELECT value INTO v_value
  FROM team_settings
  WHERE team_id = p_team_id
  AND key = p_key;
  
  -- Return the value or the default if not found
  RETURN COALESCE(v_value, p_default);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set a team setting
CREATE OR REPLACE FUNCTION set_team_setting(
  p_team_id UUID,
  p_key TEXT,
  p_value JSONB
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
    RAISE EXCEPTION 'User is not authorized to modify settings for this team';
  END IF;
  
  -- Insert or update the setting
  INSERT INTO team_settings (team_id, key, value)
  VALUES (p_team_id, p_key, p_value)
  ON CONFLICT (team_id, key)
  DO UPDATE SET value = p_value;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete a team setting
CREATE OR REPLACE FUNCTION delete_team_setting(
  p_team_id UUID,
  p_key TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is a member of the team with admin role
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User is not authorized to delete settings for this team';
  END IF;
  
  -- Delete the setting
  DELETE FROM team_settings
  WHERE team_id = p_team_id
  AND key = p_key;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all settings for a team
CREATE OR REPLACE FUNCTION get_team_settings(
  p_team_id UUID
)
RETURNS TABLE (
  key TEXT,
  value JSONB,
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
    RAISE EXCEPTION 'User is not authorized to access settings for this team';
  END IF;
  
  -- Return all settings for the team
  RETURN QUERY
  SELECT ts.key, ts.value, ts.created_at, ts.updated_at
  FROM team_settings ts
  WHERE ts.team_id = p_team_id
  ORDER BY ts.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default settings for new teams
CREATE OR REPLACE FUNCTION create_default_team_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Default notification settings
  INSERT INTO team_settings (team_id, key, value)
  VALUES (NEW.id, 'notifications', jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'daily_digest', false,
      'weekly_digest', true,
      'project_updates', true,
      'report_updates', true,
      'member_updates', true
    ),
    'in_app', jsonb_build_object(
      'enabled', true,
      'project_updates', true,
      'report_updates', true,
      'member_updates', true
    )
  ));
  
  -- Default theme settings
  INSERT INTO team_settings (team_id, key, value)
  VALUES (NEW.id, 'theme', jsonb_build_object(
    'primary_color', '#0070f3',
    'logo_url', NULL,
    'dark_mode', true
  ));
  
  -- Default privacy settings
  INSERT INTO team_settings (team_id, key, value)
  VALUES (NEW.id, 'privacy', jsonb_build_object(
    'project_visibility', 'team',
    'report_visibility', 'team',
    'member_visibility', 'team'
  ));
  
  -- Default integration settings
  INSERT INTO team_settings (team_id, key, value)
  VALUES (NEW.id, 'integrations', jsonb_build_object(
    'github', jsonb_build_object(
      'enabled', false,
      'repo_url', NULL
    ),
    'slack', jsonb_build_object(
      'enabled', false,
      'webhook_url', NULL
    )
  ));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create default settings for new teams
CREATE TRIGGER create_default_team_settings
AFTER INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION create_default_team_settings();
