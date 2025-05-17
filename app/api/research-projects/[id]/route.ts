import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { EnhancedCachedResearchProjectService } from '@/lib/services/enhancedCachedResearchProjectService';

// Define the type for a research project based on your schema
interface ResearchProject {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.warn('Unauthorized attempt to access research project', { error: userError?.message });
      return NextResponse.json({ error: 'You must be logged in to access research projects.' }, { status: 401 });
    }

    // Use the enhanced cached service to get the research project by ID
    try {
      const project = await EnhancedCachedResearchProjectService.getProjectById(params.id, user.id);
      if (!project) {
        return NextResponse.json({ error: 'Research project not found.' }, { status: 404 });
      }
      // Additional check to ensure the user owns the project or has access
      if (project.user_id !== user.id) {
        logger.warn('Unauthorized access to research project', { userId: user.id, projectId: params.id });
        return NextResponse.json({ error: 'You do not have permission to access this research project.' }, { status: 403 });
      }
      return NextResponse.json(project);
    } catch (error: any) {
      logger.error('Error fetching research project', { error: error.message, userId: user.id, projectId: params.id });
      return NextResponse.json({ error: 'Failed to fetch research project: ' + error.message }, { status: 500 });
    }
  } catch (e: any) {
    logger.error('Unexpected error in GET /api/research-projects/[id]', { error: e.message, stack: e.stack });
    return NextResponse.json({ error: 'An unexpected error occurred: ' + e.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.warn('Unauthorized attempt to update research project', { error: userError?.message });
      return NextResponse.json({ error: 'You must be logged in to update a research project.' }, { status: 401 });
    }

    let projectData: Partial<ResearchProject>;
    try {
      projectData = await request.json();
    } catch (e) {
      logger.warn('Invalid JSON in PUT /api/research-projects/[id]', { error: (e as Error).message });
      return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }
    
    if (!projectData.title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    // First, check if the project exists and the user has access
    const existingProject = await EnhancedCachedResearchProjectService.getProjectById(params.id, user.id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Research project not found.' }, { status: 404 });
    }
    if (existingProject.user_id !== user.id) {
      logger.warn('Unauthorized update attempt on research project', { userId: user.id, projectId: params.id });
      return NextResponse.json({ error: 'You do not have permission to update this research project.' }, { status: 403 });
    }

    // Use the enhanced cached service to update the project
    try {
      // Pass all fields from projectData to the update method
      const updatedProject = await EnhancedCachedResearchProjectService.updateProject(params.id, projectData, user.id);
      return NextResponse.json(updatedProject);
    } catch (error: any) {
      logger.error('Error updating research project', { error: error.message, userId: user.id, projectId: params.id });
      return NextResponse.json({ error: 'Failed to update research project: ' + error.message }, { status: 500 });
    }
  } catch (e: any) {
    logger.error('Unexpected error in PUT /api/research-projects/[id]', { error: e.message, stack: e.stack });
    return NextResponse.json({ error: 'An unexpected error occurred: ' + e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.warn('Unauthorized attempt to delete research project', { error: userError?.message });
      return NextResponse.json({ error: 'You must be logged in to delete a research project.' }, { status: 401 });
    }

    // First, check if the project exists and the user has access
    const existingProject = await EnhancedCachedResearchProjectService.getProjectById(params.id, user.id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Research project not found.' }, { status: 404 });
    }
    if (existingProject.user_id !== user.id) {
      logger.warn('Unauthorized delete attempt on research project', { userId: user.id, projectId: params.id });
      return NextResponse.json({ error: 'You do not have permission to delete this research project.' }, { status: 403 });
    }

    // Use the enhanced cached service to delete the project
    try {
      await EnhancedCachedResearchProjectService.deleteProject(params.id, user.id);
      return NextResponse.json({ message: 'Research project deleted successfully.' });
    } catch (error: any) {
      logger.error('Error deleting research project', { error: error.message, userId: user.id, projectId: params.id });
      return NextResponse.json({ error: 'Failed to delete research project: ' + error.message }, { status: 500 });
    }
  } catch (e: any) {
    logger.error('Unexpected error in DELETE /api/research-projects/[id]', { error: e.message, stack: e.stack });
    return NextResponse.json({ error: 'An unexpected error occurred: ' + e.message }, { status: 500 });
  }
}
