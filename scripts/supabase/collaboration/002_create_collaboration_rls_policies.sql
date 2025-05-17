-- Row Level Security (RLS) policies for collaboration tables

-- Enable RLS on all collaboration tables
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Project Collaborators policies
-- Users can view collaborators for projects they have access to
CREATE POLICY "Users can view collaborators for their projects"
    ON public.project_collaborators
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = project_collaborators.project_id
            AND invitation_status = 'accepted'
        )
    );

-- Project owners can manage collaborators
CREATE POLICY "Project owners can manage collaborators"
    ON public.project_collaborators
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = project_collaborators.project_id
            AND role = 'owner'
            AND invitation_status = 'accepted'
        )
    );

-- Users can accept/decline their own invitations
CREATE POLICY "Users can update their own invitation status"
    ON public.project_collaborators
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id 
        AND invitation_status IN ('accepted', 'declined')
        AND OLD.invitation_status = 'pending'
    );

-- Activity Logs policies
-- Users can view activity logs for projects they have access to
CREATE POLICY "Users can view activity logs for their projects"
    ON public.activity_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = activity_logs.project_id
            AND invitation_status = 'accepted'
        )
    );

-- System and project members can insert activity logs
CREATE POLICY "Project members can insert activity logs"
    ON public.activity_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = activity_logs.project_id
            AND invitation_status = 'accepted'
        )
    );

-- Notifications policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Teams policies
-- Users can view teams they are members of
CREATE POLICY "Users can view teams they are members of"
    ON public.teams
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.team_members 
            WHERE team_id = teams.id
        )
    );

-- Team owners can manage their teams
CREATE POLICY "Team owners can manage their teams"
    ON public.teams
    FOR ALL
    USING (auth.uid() = owner_id);

-- Team Members policies
-- Users can view team members for teams they are in
CREATE POLICY "Users can view team members for their teams"
    ON public.team_members
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.team_members 
            WHERE team_id = team_members.team_id
        )
    );

-- Team owners can manage team members
CREATE POLICY "Team owners can manage team members"
    ON public.team_members
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT owner_id FROM public.teams 
            WHERE id = team_members.team_id
        )
    );

-- Comments policies
-- Users can view comments for projects they have access to
CREATE POLICY "Users can view comments for their projects"
    ON public.comments
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = comments.project_id
            AND invitation_status = 'accepted'
        )
    );

-- Project members can insert comments
CREATE POLICY "Project members can insert comments"
    ON public.comments
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = comments.project_id
            AND invitation_status = 'accepted'
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON public.comments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
    ON public.comments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Project owners and editors can delete any comment in their projects
CREATE POLICY "Project owners and editors can delete any comment"
    ON public.comments
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = comments.project_id
            AND role IN ('owner', 'editor')
            AND invitation_status = 'accepted'
        )
    );
