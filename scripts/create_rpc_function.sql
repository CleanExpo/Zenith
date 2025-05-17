-- Create a function to bypass RLS for research projects
CREATE OR REPLACE FUNCTION create_research_project(
  p_title TEXT,
  p_description TEXT,
  p_user_id UUID
) RETURNS SETOF research_projects
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_project_id UUID;
BEGIN
  -- Insert the new project
  INSERT INTO research_projects (
    title,
    description,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    p_title,
    p_description,
    p_user_id,
    v_now,
    v_now
  ) RETURNING id INTO v_project_id;
  
  -- Return the newly created project
  RETURN QUERY SELECT * FROM research_projects WHERE id = v_project_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_research_project TO authenticated;
GRANT EXECUTE ON FUNCTION create_research_project TO anon;
