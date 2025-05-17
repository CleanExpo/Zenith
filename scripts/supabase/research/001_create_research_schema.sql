-- Create research schema and tables
CREATE SCHEMA IF NOT EXISTS research;

-- Research projects table
CREATE TABLE IF NOT EXISTS research.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project collaborators table
CREATE TABLE IF NOT EXISTS research.project_collaborators (
    project_id UUID REFERENCES research.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Research notes table
CREATE TABLE IF NOT EXISTS research.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES research.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research documents table
CREATE TABLE IF NOT EXISTS research.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES research.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research tasks table
CREATE TABLE IF NOT EXISTS research.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES research.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research tags table
CREATE TABLE IF NOT EXISTS research.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project tags junction table
CREATE TABLE IF NOT EXISTS research.project_tags (
    project_id UUID REFERENCES research.projects(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES research.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, tag_id)
);

-- Research comments table
CREATE TABLE IF NOT EXISTS research.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES research.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES research.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research activity log
CREATE TABLE IF NOT EXISTS research.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES research.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE research.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.activity_log ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_projects_owner ON research.projects(owner_id);
CREATE INDEX idx_project_collaborators_project ON research.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user ON research.project_collaborators(user_id);
CREATE INDEX idx_notes_project ON research.notes(project_id);
CREATE INDEX idx_notes_author ON research.notes(author_id);
CREATE INDEX idx_documents_project ON research.documents(project_id);
CREATE INDEX idx_documents_uploader ON research.documents(uploader_id);
CREATE INDEX idx_tasks_project ON research.tasks(project_id);
CREATE INDEX idx_tasks_assignee ON research.tasks(assignee_id);
CREATE INDEX idx_project_tags_project ON research.project_tags(project_id);
CREATE INDEX idx_project_tags_tag ON research.project_tags(tag_id);
CREATE INDEX idx_comments_project ON research.comments(project_id);
CREATE INDEX idx_comments_author ON research.comments(author_id);
CREATE INDEX idx_comments_parent ON research.comments(parent_id);
CREATE INDEX idx_activity_log_project ON research.activity_log(project_id);
CREATE INDEX idx_activity_log_user ON research.activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON research.activity_log(entity_type, entity_id);
