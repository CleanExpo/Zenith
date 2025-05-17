import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import EnhancedCustomReportForm from '@/components/dashboard/reports/EnhancedCustomReportForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create New Report | Zenith',
  description: 'Create a new enhanced report with external data',
};

export const dynamic = 'force-dynamic';

interface NewReportPageProps {
  searchParams: {
    projectId?: string;
  };
}

export default async function NewReportPage({ searchParams }: NewReportPageProps) {
  const { projectId } = searchParams;
  
  // If no project ID is provided, redirect to the projects page
  if (!projectId) {
    redirect('/dashboard');
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
  
  // Check if project exists
  const { data: project, error } = await supabase
    .from('research_projects')
    .select('id, title')
    .eq('id', projectId)
    .single();
  
  if (error || !project) {
    redirect('/dashboard');
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href={`/dashboard/projects/${projectId}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Project
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create New Report</h1>
        <p className="text-muted-foreground">
          Create a custom report for project: <span className="font-medium">{project.title}</span>
        </p>
      </div>
      
      <EnhancedCustomReportForm projectId={projectId} />
    </div>
  );
}
