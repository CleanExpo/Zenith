-- Database functions for research management

-- Function to create a new research project
CREATE OR REPLACE FUNCTION research.create_project(
  title TEXT,
  description TEXT,
  visibility TEXT DEFAULT 'private'
)
RETURNS UUID AS $$
DECLARE
  new_project_id UUID;
BEGIN
  -- Insert into projects table
  INSERT INTO research.projects (title, description, owner_id, visibility)
  VALUES (title, description, auth.uid(), visibility)
  RETURNING id INTO new_project_id;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    new_project_id,
    auth.uid(),
    'create',
    'project',
    new_project_id,
    jsonb_build_object('title', title, 'visibility', visibility)
  );

  RETURN new_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a collaborator to a project
CREATE OR REPLACE FUNCTION research.add_collaborator(
  project_id UUID,
  collaborator_email TEXT,
  role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
  collaborator_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO collaborator_id
  FROM auth.users
  WHERE email = collaborator_email;

  -- If user not found, raise exception
  IF collaborator_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', collaborator_email;
  END IF;

  -- Check if user is already a collaborator
  IF EXISTS (
    SELECT 1 FROM research.project_collaborators
    WHERE project_id = add_collaborator.project_id AND user_id = collaborator_id
  ) THEN
    -- Update role if already a collaborator
    UPDATE research.project_collaborators
    SET role = add_collaborator.role
    WHERE project_id = add_collaborator.project_id AND user_id = collaborator_id;
  ELSE
    -- Add new collaborator
    INSERT INTO research.project_collaborators (project_id, user_id, role)
    VALUES (add_collaborator.project_id, collaborator_id, add_collaborator.role);
  END IF;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    add_collaborator.project_id,
    auth.uid(),
    'add_collaborator',
    'user',
    collaborator_id,
    jsonb_build_object('email', collaborator_email, 'role', role)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a collaborator from a project
CREATE OR REPLACE FUNCTION research.remove_collaborator(
  project_id UUID,
  collaborator_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete collaborator
  DELETE FROM research.project_collaborators
  WHERE project_id = remove_collaborator.project_id AND user_id = collaborator_id;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    remove_collaborator.project_id,
    auth.uid(),
    'remove_collaborator',
    'user',
    collaborator_id,
    jsonb_build_object('user_id', collaborator_id)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new note
CREATE OR REPLACE FUNCTION research.create_note(
  project_id UUID,
  title TEXT,
  content TEXT
)
RETURNS UUID AS $$
DECLARE
  new_note_id UUID;
BEGIN
  -- Insert into notes table
  INSERT INTO research.notes (project_id, title, content, author_id)
  VALUES (project_id, title, content, auth.uid())
  RETURNING id INTO new_note_id;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    project_id,
    auth.uid(),
    'create',
    'note',
    new_note_id,
    jsonb_build_object('title', title)
  );

  RETURN new_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new task
CREATE OR REPLACE FUNCTION research.create_task(
  project_id UUID,
  title TEXT,
  description TEXT,
  assignee_email TEXT DEFAULT NULL,
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_task_id UUID;
  assignee_id UUID;
BEGIN
  -- Get assignee ID from email if provided
  IF assignee_email IS NOT NULL THEN
    SELECT id INTO assignee_id
    FROM auth.users
    WHERE email = assignee_email;
  END IF;

  -- Insert into tasks table
  INSERT INTO research.tasks (project_id, title, description, assignee_id, priority, due_date, created_by)
  VALUES (project_id, title, description, assignee_id, priority, due_date, auth.uid())
  RETURNING id INTO new_task_id;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    project_id,
    auth.uid(),
    'create',
    'task',
    new_task_id,
    jsonb_build_object('title', title, 'assignee', assignee_email, 'priority', priority)
  );

  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update task status
CREATE OR REPLACE FUNCTION research.update_task_status(
  task_id UUID,
  new_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  project_id UUID;
BEGIN
  -- Get project ID
  SELECT project_id INTO project_id
  FROM research.tasks
  WHERE id = task_id;

  -- Update task status
  UPDATE research.tasks
  SET status = new_status, updated_at = NOW()
  WHERE id = task_id;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    project_id,
    auth.uid(),
    'update_status',
    'task',
    task_id,
    jsonb_build_object('status', new_status)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a tag to a project
CREATE OR REPLACE FUNCTION research.add_tag_to_project(
  project_id UUID,
  tag_name TEXT,
  tag_color TEXT DEFAULT '#3b82f6'
)
RETURNS BOOLEAN AS $$
DECLARE
  tag_id UUID;
BEGIN
  -- Get or create tag
  SELECT id INTO tag_id
  FROM research.tags
  WHERE name = tag_name;

  IF tag_id IS NULL THEN
    -- Create new tag
    INSERT INTO research.tags (name, color)
    VALUES (tag_name, tag_color)
    RETURNING id INTO tag_id;
  END IF;

  -- Add tag to project
  INSERT INTO research.project_tags (project_id, tag_id)
  VALUES (add_tag_to_project.project_id, tag_id)
  ON CONFLICT (project_id, tag_id) DO NOTHING;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    add_tag_to_project.project_id,
    auth.uid(),
    'add_tag',
    'tag',
    tag_id,
    jsonb_build_object('name', tag_name, 'color', tag_color)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a tag from a project
CREATE OR REPLACE FUNCTION research.remove_tag_from_project(
  project_id UUID,
  tag_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove tag from project
  DELETE FROM research.project_tags
  WHERE project_id = remove_tag_from_project.project_id AND tag_id = remove_tag_from_project.tag_id;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    remove_tag_from_project.project_id,
    auth.uid(),
    'remove_tag',
    'tag',
    tag_id,
    jsonb_build_object('tag_id', tag_id)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a comment to a project
CREATE OR REPLACE FUNCTION research.add_comment(
  project_id UUID,
  content TEXT,
  parent_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_comment_id UUID;
BEGIN
  -- Insert comment
  INSERT INTO research.comments (project_id, content, author_id, parent_id)
  VALUES (project_id, content, auth.uid(), parent_id)
  RETURNING id INTO new_comment_id;

  -- Log activity
  INSERT INTO research.activity_log (project_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    project_id,
    auth.uid(),
    'add_comment',
    'comment',
    new_comment_id,
    jsonb_build_object('parent_id', parent_id)
  );

  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get project statistics
CREATE OR REPLACE FUNCTION research.get_project_stats(
  project_id UUID
)
RETURNS TABLE(
  total_notes BIGINT,
  total_documents BIGINT,
  total_tasks BIGINT,
  completed_tasks BIGINT,
  total_comments BIGINT,
  total_collaborators BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM research.notes WHERE project_id = get_project_stats.project_id) AS total_notes,
    (SELECT COUNT(*) FROM research.documents WHERE project_id = get_project_stats.project_id) AS total_documents,
    (SELECT COUNT(*) FROM research.tasks WHERE project_id = get_project_stats.project_id) AS total_tasks,
    (SELECT COUNT(*) FROM research.tasks WHERE project_id = get_project_stats.project_id AND status = 'completed') AS completed_tasks,
    (SELECT COUNT(*) FROM research.comments WHERE project_id = get_project_stats.project_id) AS total_comments,
    (SELECT COUNT(*) FROM research.project_collaborators WHERE project_id = get_project_stats.project_id) AS total_collaborators;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to search across projects
CREATE OR REPLACE FUNCTION research.search_projects(
  search_term TEXT
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  owner_id UUID,
  status TEXT,
  visibility TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Search in projects
  SELECT 
    p.id, p.title, p.description, p.owner_id, p.status, p.visibility, p.created_at, p.updated_at,
    'project'::TEXT AS match_type
  FROM research.projects p
  WHERE 
    (p.owner_id = auth.uid() OR
     p.visibility = 'public' OR
     EXISTS (
       SELECT 1 FROM research.project_collaborators
       WHERE project_id = p.id AND user_id = auth.uid()
     )
    ) AND
    (p.title ILIKE '%' || search_term || '%' OR
     p.description ILIKE '%' || search_term || '%')
  
  UNION ALL
  
  -- Search in notes
  SELECT 
    p.id, p.title, p.description, p.owner_id, p.status, p.visibility, p.created_at, p.updated_at,
    'note'::TEXT AS match_type
  FROM research.projects p
  JOIN research.notes n ON p.id = n.project_id
  WHERE 
    (p.owner_id = auth.uid() OR
     p.visibility = 'public' OR
     EXISTS (
       SELECT 1 FROM research.project_collaborators
       WHERE project_id = p.id AND user_id = auth.uid()
     )
    ) AND
    (n.title ILIKE '%' || search_term || '%' OR
     n.content ILIKE '%' || search_term || '%')
  
  UNION ALL
  
  -- Search in documents
  SELECT 
    p.id, p.title, p.description, p.owner_id, p.status, p.visibility, p.created_at, p.updated_at,
    'document'::TEXT AS match_type
  FROM research.projects p
  JOIN research.documents d ON p.id = d.project_id
  WHERE 
    (p.owner_id = auth.uid() OR
     p.visibility = 'public' OR
     EXISTS (
       SELECT 1 FROM research.project_collaborators
       WHERE project_id = p.id AND user_id = auth.uid()
     )
    ) AND
    (d.title ILIKE '%' || search_term || '%' OR
     d.description ILIKE '%' || search_term || '%')
  
  UNION ALL
  
  -- Search in tasks
  SELECT 
    p.id, p.title, p.description, p.owner_id, p.status, p.visibility, p.created_at, p.updated_at,
    'task'::TEXT AS match_type
  FROM research.projects p
  JOIN research.tasks t ON p.id = t.project_id
  WHERE 
    (p.owner_id = auth.uid() OR
     p.visibility = 'public' OR
     EXISTS (
       SELECT 1 FROM research.project_collaborators
       WHERE project_id = p.id AND user_id = auth.uid()
     )
    ) AND
    (t.title ILIKE '%' || search_term || '%' OR
     t.description ILIKE '%' || search_term || '%')
  
  UNION ALL
  
  -- Search in comments
  SELECT 
    p.id, p.title, p.description, p.owner_id, p.status, p.visibility, p.created_at, p.updated_at,
    'comment'::TEXT AS match_type
  FROM research.projects p
  JOIN research.comments c ON p.id = c.project_id
  WHERE 
    (p.owner_id = auth.uid() OR
     p.visibility = 'public' OR
     EXISTS (
       SELECT 1 FROM research.project_collaborators
       WHERE project_id = p.id AND user_id = auth.uid()
     )
    ) AND
    c.content ILIKE '%' || search_term || '%'
  
  ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;
