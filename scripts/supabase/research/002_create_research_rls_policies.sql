-- RLS Policies for research schema

-- Projects table policies
CREATE POLICY "Users can view their own projects"
ON research.projects
FOR SELECT
USING (
  owner_id = auth.uid() OR
  visibility = 'public' OR
  EXISTS (
    SELECT 1 FROM research.project_collaborators
    WHERE project_id = research.projects.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own projects"
ON research.projects
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their projects"
ON research.projects
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their projects"
ON research.projects
FOR DELETE
USING (owner_id = auth.uid());

-- Project collaborators table policies
CREATE POLICY "Project owners can manage collaborators"
ON research.project_collaborators
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.project_collaborators.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view projects they collaborate on"
ON research.project_collaborators
FOR SELECT
USING (user_id = auth.uid());

-- Notes table policies
CREATE POLICY "Users can view notes for their projects"
ON research.notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.notes.project_id AND (
      owner_id = auth.uid() OR
      visibility = 'public' OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.notes.project_id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create notes for their projects"
ON research.notes
FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.notes.project_id AND (
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.notes.project_id AND user_id = auth.uid() AND role IN ('editor', 'admin')
      )
    )
  )
);

CREATE POLICY "Users can update their own notes"
ON research.notes
FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Project owners can update any notes"
ON research.notes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.notes.project_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.notes.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own notes"
ON research.notes
FOR DELETE
USING (author_id = auth.uid());

CREATE POLICY "Project owners can delete any notes"
ON research.notes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.notes.project_id AND owner_id = auth.uid()
  )
);

-- Documents table policies
CREATE POLICY "Users can view documents for their projects"
ON research.documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.documents.project_id AND (
      owner_id = auth.uid() OR
      visibility = 'public' OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.documents.project_id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can upload documents to their projects"
ON research.documents
FOR INSERT
WITH CHECK (
  uploader_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.documents.project_id AND (
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.documents.project_id AND user_id = auth.uid() AND role IN ('editor', 'admin')
      )
    )
  )
);

CREATE POLICY "Users can update their own documents"
ON research.documents
FOR UPDATE
USING (uploader_id = auth.uid())
WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "Project owners can update any documents"
ON research.documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.documents.project_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.documents.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own documents"
ON research.documents
FOR DELETE
USING (uploader_id = auth.uid());

CREATE POLICY "Project owners can delete any documents"
ON research.documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.documents.project_id AND owner_id = auth.uid()
  )
);

-- Tasks table policies
CREATE POLICY "Users can view tasks for their projects"
ON research.tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.tasks.project_id AND (
      owner_id = auth.uid() OR
      visibility = 'public' OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.tasks.project_id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create tasks for their projects"
ON research.tasks
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.tasks.project_id AND (
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.tasks.project_id AND user_id = auth.uid() AND role IN ('editor', 'admin')
      )
    )
  )
);

CREATE POLICY "Assignees can update their tasks"
ON research.tasks
FOR UPDATE
USING (assignee_id = auth.uid())
WITH CHECK (assignee_id = auth.uid());

CREATE POLICY "Task creators can update their tasks"
ON research.tasks
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Project owners can update any tasks"
ON research.tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.tasks.project_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.tasks.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Task creators can delete their tasks"
ON research.tasks
FOR DELETE
USING (created_by = auth.uid());

CREATE POLICY "Project owners can delete any tasks"
ON research.tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.tasks.project_id AND owner_id = auth.uid()
  )
);

-- Tags table policies
CREATE POLICY "Everyone can view tags"
ON research.tags
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create tags"
ON research.tags
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Project tags junction table policies
CREATE POLICY "Users can view project tags"
ON research.project_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.project_tags.project_id AND (
      owner_id = auth.uid() OR
      visibility = 'public' OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.project_tags.project_id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Project owners can manage project tags"
ON research.project_tags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.project_tags.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Project editors can manage project tags"
ON research.project_tags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM research.project_collaborators
    WHERE project_id = research.project_tags.project_id AND user_id = auth.uid() AND role IN ('editor', 'admin')
  )
);

-- Comments table policies
CREATE POLICY "Users can view comments for their projects"
ON research.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.comments.project_id AND (
      owner_id = auth.uid() OR
      visibility = 'public' OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.comments.project_id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create comments for their projects"
ON research.comments
FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.comments.project_id AND (
      owner_id = auth.uid() OR
      visibility = 'public' OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.comments.project_id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update their own comments"
ON research.comments
FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
ON research.comments
FOR DELETE
USING (author_id = auth.uid());

CREATE POLICY "Project owners can delete any comments"
ON research.comments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.comments.project_id AND owner_id = auth.uid()
  )
);

-- Activity log policies
CREATE POLICY "Users can view activity logs for their projects"
ON research.activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM research.projects
    WHERE id = research.activity_log.project_id AND (
      owner_id = auth.uid() OR
      visibility = 'public' OR
      EXISTS (
        SELECT 1 FROM research.project_collaborators
        WHERE project_id = research.activity_log.project_id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "System can insert activity logs"
ON research.activity_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
