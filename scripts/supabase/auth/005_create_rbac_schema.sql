-- Role-Based Access Control (RBAC) Schema

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'manager', 'editor', 'viewer');

-- Create user_profiles table to store user roles and additional information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table for team/organization management
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table to store team memberships and roles
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create invitations table for user invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, team_id)
);

-- Create audit_logs table for tracking authentication and authorization events
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table for API key management
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create permissions table to store custom permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions table to store role-permission mappings
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- Create user_permissions table to store user-specific permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- Create team_permissions table to store team-specific permissions
CREATE TABLE IF NOT EXISTS public.team_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, permission_id)
);

-- Create functions to check permissions

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  -- Check direct user permission
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id AND p.name = p_permission
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Check role-based permission
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.role_permissions rp ON up.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE up.id = p_user_id AND p.name = p_permission
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Check team-based permission
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.team_permissions tp ON tm.team_id = tp.team_id
    JOIN public.permissions p ON tp.permission_id = p.id
    WHERE tm.user_id = p_user_id AND p.name = p_permission
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(
  p_user_id UUID
) RETURNS TABLE (permission TEXT) AS $$
BEGIN
  RETURN QUERY
  -- Get permissions from user's role
  SELECT DISTINCT p.name
  FROM public.user_profiles up
  JOIN public.role_permissions rp ON up.role = rp.role
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE up.id = p_user_id
  
  UNION
  
  -- Get direct user permissions
  SELECT DISTINCT p.name
  FROM public.user_permissions up
  JOIN public.permissions p ON up.permission_id = p.id
  WHERE up.user_id = p_user_id
  
  UNION
  
  -- Get team-based permissions
  SELECT DISTINCT p.name
  FROM public.team_members tm
  JOIN public.team_permissions tp ON tm.team_id = tp.team_id
  JOIN public.permissions p ON tp.permission_id = p.id
  WHERE tm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging

-- Function to log user profile changes
CREATE OR REPLACE FUNCTION public.log_user_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'user_profile',
    NEW.id::TEXT,
    jsonb_build_object(
      'email', NEW.email,
      'role', NEW.role
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user profile changes
CREATE TRIGGER log_user_profile_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_user_profile_changes();

-- Function to log team changes
CREATE OR REPLACE FUNCTION public.log_team_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    NEW.owner_id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'team',
    NEW.id::TEXT,
    jsonb_build_object(
      'name', NEW.name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for team changes
CREATE TRIGGER log_team_changes
AFTER INSERT OR UPDATE OR DELETE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.log_team_changes();

-- Create RLS policies

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_permissions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users with read:user permission can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (public.user_has_permission(auth.uid(), 'read:user'));

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users with update:user permission can update any profile"
  ON public.user_profiles
  FOR UPDATE
  USING (public.user_has_permission(auth.uid(), 'update:user'));

-- Teams policies
CREATE POLICY "Team owners can manage their teams"
  ON public.teams
  FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Users with read:team permission can view teams"
  ON public.teams
  FOR SELECT
  USING (public.user_has_permission(auth.uid(), 'read:team'));

CREATE POLICY "Users with update:team permission can update teams"
  ON public.teams
  FOR UPDATE
  USING (public.user_has_permission(auth.uid(), 'update:team'));

-- Team members policies
CREATE POLICY "Team members can view their memberships"
  ON public.team_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Team owners can manage team members"
  ON public.team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

-- Invitations policies
CREATE POLICY "Users can view invitations they sent"
  ON public.invitations
  FOR SELECT
  USING (auth.uid() = invited_by);

CREATE POLICY "Users with create:user permission can create invitations"
  ON public.invitations
  FOR INSERT
  WITH CHECK (public.user_has_permission(auth.uid(), 'create:user'));

-- API keys policies
CREATE POLICY "Users can manage their own API keys"
  ON public.api_keys
  FOR ALL
  USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users with view:audit_logs permission can view all logs"
  ON public.audit_logs
  FOR SELECT
  USING (public.user_has_permission(auth.uid(), 'view:audit_logs'));

-- Permissions policies
CREATE POLICY "Users with manage:settings permission can manage permissions"
  ON public.permissions
  FOR ALL
  USING (public.user_has_permission(auth.uid(), 'manage:settings'));

CREATE POLICY "All users can view permissions"
  ON public.permissions
  FOR SELECT
  USING (true);

-- Role permissions policies
CREATE POLICY "Users with manage:settings permission can manage role permissions"
  ON public.role_permissions
  FOR ALL
  USING (public.user_has_permission(auth.uid(), 'manage:settings'));

CREATE POLICY "All users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (true);

-- User permissions policies
CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users with manage:settings permission can manage user permissions"
  ON public.user_permissions
  FOR ALL
  USING (public.user_has_permission(auth.uid(), 'manage:settings'));

-- Team permissions policies
CREATE POLICY "Team owners can view their team permissions"
  ON public.team_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users with manage:settings permission can manage team permissions"
  ON public.team_permissions
  FOR ALL
  USING (public.user_has_permission(auth.uid(), 'manage:settings'));

-- Insert default permissions
INSERT INTO public.permissions (name, description)
VALUES
  ('create:project', 'Create new projects'),
  ('read:project', 'View projects'),
  ('update:project', 'Update existing projects'),
  ('delete:project', 'Delete projects'),
  ('create:report', 'Create new reports'),
  ('read:report', 'View reports'),
  ('update:report', 'Update existing reports'),
  ('delete:report', 'Delete reports'),
  ('create:user', 'Create new users'),
  ('read:user', 'View user information'),
  ('update:user', 'Update user information'),
  ('delete:user', 'Delete users'),
  ('create:team', 'Create new teams'),
  ('read:team', 'View team information'),
  ('update:team', 'Update team information'),
  ('delete:team', 'Delete teams'),
  ('view:analytics', 'View analytics data'),
  ('export:analytics', 'Export analytics data'),
  ('manage:settings', 'Manage system settings'),
  ('view:audit_logs', 'View audit logs')
ON CONFLICT (name) DO NOTHING;

-- Create a trigger to automatically create a user profile when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
