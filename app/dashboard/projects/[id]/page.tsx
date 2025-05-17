import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Calendar, RefreshCw, Edit, Trash2 } from 'lucide-react';
import ProjectNotes from '@/components/dashboard/projects/ProjectNotes';
import ProjectTasks from '@/components/dashboard/projects/ProjectTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditProjectForm from '@/components/dashboard/projects/EditProjectForm';

// Define the type for a research project
interface ResearchProject {
  id: string;
  title: string;
  description?: string | null;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

// This component is needed for client-side interactivity
export const dynamic = 'force-dynamic';

import ProjectClient from './client';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  if (!id) {
    logger.error('Project ID is missing from params');
    return notFound();
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );

  // Temporarily bypass authentication check
  // const { data: { user }, error: userError } = await supabase.auth.getUser();
  // if (userError || !user) {
  //   logger.warn('User not authenticated on project detail page, redirecting to login.', { error: userError?.message });
  //   redirect('/auth/login');
  // }

  // Mock user for display purposes while auth is bypassed
  const user = { id: '00000000-0000-4000-a000-000000000000', email: 'user@example.com' };

  // Fetch the project data
  const { data: project, error: projectError } = await supabase
    .from('research_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError) {
    if (projectError.code === 'PGRST116') {
      // PGRST116 is "Row not found" error code from PostgREST
      logger.warn('Project not found', { projectId: id });
      return notFound();
    }
    
    logger.error('Error fetching project details', { projectId: id, error: projectError });
    throw new Error(`Failed to fetch project: ${projectError.message}`);
  }

  if (!project) {
    logger.warn('Project not found (no data returned)', { projectId: id });
    return notFound();
  }

  // Check if the user has permission to view this project
  // In a real app with RLS, this might be handled by Supabase policies
  // For now, with auth bypassed, we'll allow access
  // if (project.user_id !== user.id) {
  //   logger.warn('User attempted to access project they do not own', { userId: user.id, projectId: id, ownerId: project.user_id });
  //   return (
  //     <div className="space-y-4">
  //       <h1 className="text-2xl font-bold">Access Denied</h1>
  //       <p>You do not have permission to view this project.</p>
  //       <Button asChild>
  //         <Link href="/dashboard">Back to Dashboard</Link>
  //       </Button>
  //     </div>
  //   );
  // }

  return <ProjectClient project={project} />;
}
