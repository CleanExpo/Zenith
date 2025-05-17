-- Create team resources schema
-- This script adds team relationships to existing resources like projects and reports

-- Add team_id to research_projects table
ALTER TABLE research_projects
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_research_projects_team_id ON research_projects(team_id);

-- Add team_id to reports table
ALTER TABLE reports
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_reports_team_id ON reports(team_id);

-- Create team_resources table to track which resources belong to which teams
CREATE TABLE team_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'project', 'report', etc.
  resource_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure uniqueness of team-resource pairs
  UNIQUE(team_id, resource_type, resource_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_team_resources_team_id ON team_resources(team_id);
CREATE INDEX idx_team_resources_resource_type_resource_id ON team_resources(resource_type, resource_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_team_resources_updated_at
BEFORE UPDATE ON team_resources
FOR EACH ROW
EXECUTE FUNCTION update_team_resources_updated_at();

-- Create RLS policies for team_resources
ALTER TABLE team_resources ENABLE ROW LEVEL SECURITY;

-- Policy for select: Users can view resources for teams they are members of
CREATE POLICY team_resources_select_policy ON team_resources
FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Policy for insert: Users can add resources to teams they are admins or managers of
CREATE POLICY team_resources_insert_policy ON team_resources
FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Policy for update: Users can update resources for teams they are admins or managers of
CREATE POLICY team_resources_update_policy ON team_resources
FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Policy for delete: Users can delete resources from teams they are admins of
CREATE POLICY team_resources_delete_policy ON team_resources
FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create function to add a resource to a team
CREATE OR REPLACE FUNCTION add_resource_to_team(
  p_team_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_team_resource_id UUID;
BEGIN
  -- Check if the user is a member of the team with admin or manager role
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'User is not authorized to add resources to this team';
  END IF;
  
  -- Insert the resource into the team_resources table
  INSERT INTO team_resources (team_id, resource_type, resource_id)
  VALUES (p_team_id, p_resource_type, p_resource_id)
  RETURNING id INTO v_team_resource_id;
  
  -- Update the resource's team_id if it's a project or report
  IF p_resource_type = 'project' THEN
    UPDATE research_projects SET team_id = p_team_id WHERE id = p_resource_id;
  ELSIF p_resource_type = 'report' THEN
    UPDATE reports SET team_id = p_team_id WHERE id = p_resource_id;
  END IF;
  
  RETURN v_team_resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove a resource from a team
CREATE OR REPLACE FUNCTION remove_resource_from_team(
  p_team_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID
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
    RAISE EXCEPTION 'User is not authorized to remove resources from this team';
  END IF;
  
  -- Delete the resource from the team_resources table
  DELETE FROM team_resources 
  WHERE team_id = p_team_id 
  AND resource_type = p_resource_type 
  AND resource_id = p_resource_id;
  
  -- Update the resource's team_id if it's a project or report
  IF p_resource_type = 'project' THEN
    UPDATE research_projects SET team_id = NULL WHERE id = p_resource_id;
  ELSIF p_resource_type = 'report' THEN
    UPDATE reports SET team_id = NULL WHERE id = p_resource_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all resources for a team
CREATE OR REPLACE FUNCTION get_team_resources(
  p_team_id UUID
)
RETURNS TABLE (
  id UUID,
  resource_type TEXT,
  resource_id UUID,
  resource_name TEXT,
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
    RAISE EXCEPTION 'User is not authorized to view resources for this team';
  END IF;
  
  RETURN QUERY
  SELECT 
    tr.id,
    tr.resource_type,
    tr.resource_id,
    CASE
      WHEN tr.resource_type = 'project' THEN (SELECT title FROM research_projects WHERE id = tr.resource_id)
      WHEN tr.resource_type = 'report' THEN (SELECT title FROM reports WHERE id = tr.resource_id)
      ELSE 'Unknown'
    END AS resource_name,
    tr.created_at,
    tr.updated_at
  FROM team_resources tr
  WHERE tr.team_id = p_team_id
  ORDER BY tr.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
