-- Database functions for collaboration features

-- Function to add a project owner when a project is created
CREATE OR REPLACE FUNCTION public.add_project_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.project_collaborators (
        project_id, 
        user_id, 
        role, 
        invitation_status
    ) VALUES (
        NEW.id, 
        NEW.user_id, 
        'owner', 
        'accepted'
    );
    
    -- Log the activity
    INSERT INTO public.activity_logs (
        project_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        details
    ) VALUES (
        NEW.id,
        NEW.user_id,
        'create',
        'project',
        NEW.id,
        jsonb_build_object(
            'title', NEW.title,
            'description', NEW.description
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add project owner when a project is created
DROP TRIGGER IF EXISTS add_project_owner_trigger ON public.research_projects;
CREATE TRIGGER add_project_owner_trigger
AFTER INSERT ON public.research_projects
FOR EACH ROW
EXECUTE FUNCTION public.add_project_owner();

-- Function to invite a user to a project
CREATE OR REPLACE FUNCTION public.invite_user_to_project(
    p_project_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'viewer'
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_invitation_token TEXT;
    v_collaborator_id UUID;
    v_project_title TEXT;
BEGIN
    -- Check if the user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    -- Generate a random token for the invitation
    v_invitation_token := encode(gen_random_bytes(32), 'hex');
    
    -- Get project title for notification
    SELECT title INTO v_project_title FROM public.research_projects WHERE id = p_project_id;
    
    -- Insert the collaborator record
    INSERT INTO public.project_collaborators (
        project_id,
        user_id,
        role,
        invited_by,
        invitation_status,
        invitation_email,
        invitation_token,
        invitation_expires_at
    ) VALUES (
        p_project_id,
        COALESCE(v_user_id, NULL),
        p_role,
        auth.uid(),
        'pending',
        p_email,
        v_invitation_token,
        NOW() + INTERVAL '7 days'
    )
    RETURNING id INTO v_collaborator_id;
    
    -- If the user exists, create a notification
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            sender_id,
            project_id,
            type,
            title,
            message,
            link
        ) VALUES (
            v_user_id,
            auth.uid(),
            p_project_id,
            'invitation',
            'Project Invitation',
            'You have been invited to collaborate on project: ' || v_project_title,
            '/dashboard/invitations'
        );
    END IF;
    
    -- Log the activity
    INSERT INTO public.activity_logs (
        project_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_project_id,
        auth.uid(),
        'invite',
        'collaborator',
        v_collaborator_id,
        jsonb_build_object(
            'email', p_email,
            'role', p_role
        )
    );
    
    RETURN v_collaborator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept a project invitation
CREATE OR REPLACE FUNCTION public.accept_project_invitation(
    p_invitation_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_collaborator_record RECORD;
    v_project_title TEXT;
    v_inviter_name TEXT;
BEGIN
    -- Get the invitation record
    SELECT pc.*, rp.title as project_title, u.email as inviter_email
    INTO v_collaborator_record
    FROM public.project_collaborators pc
    JOIN public.research_projects rp ON pc.project_id = rp.id
    LEFT JOIN auth.users u ON pc.invited_by = u.id
    WHERE pc.invitation_token = p_invitation_token
    AND pc.invitation_status = 'pending'
    AND pc.invitation_expires_at > NOW();
    
    -- If no valid invitation found
    IF v_collaborator_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update the invitation status
    UPDATE public.project_collaborators
    SET 
        invitation_status = 'accepted',
        user_id = auth.uid(),
        updated_at = NOW()
    WHERE invitation_token = p_invitation_token;
    
    -- Log the activity
    INSERT INTO public.activity_logs (
        project_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_collaborator_record.project_id,
        auth.uid(),
        'accept_invitation',
        'collaborator',
        v_collaborator_record.id,
        jsonb_build_object(
            'role', v_collaborator_record.role
        )
    );
    
    -- Notify the project owner
    INSERT INTO public.notifications (
        user_id,
        sender_id,
        project_id,
        type,
        title,
        message,
        link
    ) 
    SELECT 
        pc.user_id,
        auth.uid(),
        v_collaborator_record.project_id,
        'collaboration',
        'Invitation Accepted',
        'Your invitation to ' || (SELECT email FROM auth.users WHERE id = auth.uid()) || ' for project "' || v_collaborator_record.project_title || '" has been accepted.',
        '/dashboard/projects/' || v_collaborator_record.project_id
    FROM public.project_collaborators pc
    WHERE pc.project_id = v_collaborator_record.project_id
    AND pc.role = 'owner';
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline a project invitation
CREATE OR REPLACE FUNCTION public.decline_project_invitation(
    p_invitation_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_collaborator_record RECORD;
BEGIN
    -- Get the invitation record
    SELECT pc.*, rp.title as project_title
    INTO v_collaborator_record
    FROM public.project_collaborators pc
    JOIN public.research_projects rp ON pc.project_id = rp.id
    WHERE pc.invitation_token = p_invitation_token
    AND pc.invitation_status = 'pending'
    AND pc.invitation_expires_at > NOW();
    
    -- If no valid invitation found
    IF v_collaborator_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update the invitation status
    UPDATE public.project_collaborators
    SET 
        invitation_status = 'declined',
        user_id = auth.uid(),
        updated_at = NOW()
    WHERE invitation_token = p_invitation_token;
    
    -- Notify the project owner
    INSERT INTO public.notifications (
        user_id,
        sender_id,
        project_id,
        type,
        title,
        message,
        link
    ) 
    SELECT 
        pc.user_id,
        auth.uid(),
        v_collaborator_record.project_id,
        'collaboration',
        'Invitation Declined',
        'Your invitation to ' || (SELECT email FROM auth.users WHERE id = auth.uid()) || ' for project "' || v_collaborator_record.project_title || '" has been declined.',
        '/dashboard/projects/' || v_collaborator_record.project_id
    FROM public.project_collaborators pc
    WHERE pc.project_id = v_collaborator_record.project_id
    AND pc.role = 'owner';
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a collaborator from a project
CREATE OR REPLACE FUNCTION public.remove_project_collaborator(
    p_project_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_collaborator_record RECORD;
    v_project_title TEXT;
BEGIN
    -- Check if the collaborator exists and is not the owner
    SELECT * INTO v_collaborator_record
    FROM public.project_collaborators
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    IF v_collaborator_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Don't allow removing the owner
    IF v_collaborator_record.role = 'owner' THEN
        RETURN false;
    END IF;
    
    -- Get project title for notification
    SELECT title INTO v_project_title FROM public.research_projects WHERE id = p_project_id;
    
    -- Delete the collaborator
    DELETE FROM public.project_collaborators
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    -- Log the activity
    INSERT INTO public.activity_logs (
        project_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_project_id,
        auth.uid(),
        'remove',
        'collaborator',
        v_collaborator_record.id,
        jsonb_build_object(
            'user_id', p_user_id,
            'role', v_collaborator_record.role
        )
    );
    
    -- Notify the removed user
    INSERT INTO public.notifications (
        user_id,
        sender_id,
        project_id,
        type,
        title,
        message,
        link
    ) VALUES (
        p_user_id,
        auth.uid(),
        p_project_id,
        'collaboration',
        'Removed from Project',
        'You have been removed from project: ' || v_project_title,
        '/dashboard'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a collaborator's role
CREATE OR REPLACE FUNCTION public.update_collaborator_role(
    p_project_id UUID,
    p_user_id UUID,
    p_new_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_collaborator_record RECORD;
    v_project_title TEXT;
BEGIN
    -- Check if the collaborator exists
    SELECT * INTO v_collaborator_record
    FROM public.project_collaborators
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    IF v_collaborator_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Don't allow changing the owner's role
    IF v_collaborator_record.role = 'owner' THEN
        RETURN false;
    END IF;
    
    -- Get project title for notification
    SELECT title INTO v_project_title FROM public.research_projects WHERE id = p_project_id;
    
    -- Update the role
    UPDATE public.project_collaborators
    SET role = p_new_role, updated_at = NOW()
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    -- Log the activity
    INSERT INTO public.activity_logs (
        project_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_project_id,
        auth.uid(),
        'update',
        'collaborator',
        v_collaborator_record.id,
        jsonb_build_object(
            'user_id', p_user_id,
            'old_role', v_collaborator_record.role,
            'new_role', p_new_role
        )
    );
    
    -- Notify the user about role change
    INSERT INTO public.notifications (
        user_id,
        sender_id,
        project_id,
        type,
        title,
        message,
        link
    ) VALUES (
        p_user_id,
        auth.uid(),
        p_project_id,
        'collaboration',
        'Role Updated',
        'Your role in project "' || v_project_title || '" has been changed to ' || p_new_role,
        '/dashboard/projects/' || p_project_id
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity when entities are created, updated, or deleted
CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_action_type TEXT;
    v_entity_type TEXT;
    v_details JSONB;
BEGIN
    -- Determine the action type
    IF TG_OP = 'INSERT' THEN
        v_action_type := 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        v_action_type := 'update';
    ELSIF TG_OP = 'DELETE' THEN
        v_action_type := 'delete';
    END IF;
    
    -- Determine the entity type based on the table
    IF TG_TABLE_NAME = 'project_tasks' THEN
        v_entity_type := 'task';
        
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_details := jsonb_build_object(
                'title', NEW.title,
                'description', NEW.description,
                'due_date', NEW.due_date,
                'completed', NEW.completed
            );
        ELSE
            v_details := jsonb_build_object(
                'title', OLD.title,
                'description', OLD.description
            );
        END IF;
        
    ELSIF TG_TABLE_NAME = 'project_notes' THEN
        v_entity_type := 'note';
        
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_details := jsonb_build_object(
                'title', NEW.title,
                'content_preview', substring(NEW.content, 1, 100)
            );
        ELSE
            v_details := jsonb_build_object(
                'title', OLD.title,
                'content_preview', substring(OLD.content, 1, 100)
            );
        END IF;
        
    ELSIF TG_TABLE_NAME = 'project_files' THEN
        v_entity_type := 'file';
        
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_details := jsonb_build_object(
                'file_name', NEW.file_name,
                'description', NEW.description
            );
        ELSE
            v_details := jsonb_build_object(
                'file_name', OLD.file_name,
                'description', OLD.description
            );
        END IF;
        
    ELSIF TG_TABLE_NAME = 'comments' THEN
        v_entity_type := 'comment';
        
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_details := jsonb_build_object(
                'content_preview', substring(NEW.content, 1, 100),
                'entity_type', NEW.entity_type,
                'entity_id', NEW.entity_id
            );
        ELSE
            v_details := jsonb_build_object(
                'content_preview', substring(OLD.content, 1, 100),
                'entity_type', OLD.entity_type,
                'entity_id', OLD.entity_id
            );
        END IF;
    END IF;
    
    -- Insert the activity log
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_logs (
            project_id,
            user_id,
            action_type,
            entity_type,
            entity_id,
            details
        ) VALUES (
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN NEW.project_id
                ELSE NEW.project_id
            END,
            auth.uid(),
            v_action_type,
            v_entity_type,
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN NEW.id
                ELSE NEW.id
            END,
            v_details
        );
    ELSE
        INSERT INTO public.activity_logs (
            project_id,
            user_id,
            action_type,
            entity_type,
            entity_id,
            details
        ) VALUES (
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN OLD.project_id
                ELSE OLD.project_id
            END,
            auth.uid(),
            v_action_type,
            v_entity_type,
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN OLD.id
                ELSE OLD.id
            END,
            v_details
        );
    END IF;
    
    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging
DROP TRIGGER IF EXISTS log_task_activity ON public.project_tasks;
CREATE TRIGGER log_task_activity
AFTER INSERT OR UPDATE OR DELETE ON public.project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.log_project_activity();

DROP TRIGGER IF EXISTS log_note_activity ON public.project_notes;
CREATE TRIGGER log_note_activity
AFTER INSERT OR UPDATE OR DELETE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION public.log_project_activity();

DROP TRIGGER IF EXISTS log_file_activity ON public.project_files;
CREATE TRIGGER log_file_activity
AFTER INSERT OR UPDATE OR DELETE ON public.project_files
FOR EACH ROW
EXECUTE FUNCTION public.log_project_activity();

DROP TRIGGER IF EXISTS log_comment_activity ON public.comments;
CREATE TRIGGER log_comment_activity
AFTER INSERT OR UPDATE OR DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.log_project_activity();
