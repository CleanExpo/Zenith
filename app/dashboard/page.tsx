// Zenith/app/dashboard/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ResearchProjectsList from '@/components/dashboard/ResearchProjectsList';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        // set and remove are not strictly needed for read-only operations like getSession/getUser
        // but including them for completeness if other auth actions were to be performed here.
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn('User not authenticated on dashboard, redirecting to login.', { error: userError?.message });
    // This should ideally be caught by middleware, but as a safeguard:
    redirect('/auth/login');
  }

  logger.info('Dashboard accessed', { userId: user.id });

  // Fetch user-specific data here, e.g., research projects
  // const { data: projects, error: projectsError } = await supabase
  //   .from('research_projects')
  //   .select('*')
  //   .eq('user_id', user.id) // RLS should also enforce this
  //   .order('created_at', { ascending: false });

  // if (projectsError) {
  //   logger.error('Error fetching projects for dashboard', { userId: user.id, error: projectsError });
  //   // Handle error display appropriately
  // }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.email || 'User'}!</p>
      </header>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>My Research Projects</CardTitle>
            <CardDescription>Manage your ongoing and past research projects.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 
              The ResearchProjectsList component now fetches its own data.
              If you prefer server-side fetching for initial load, 
              you would uncomment the data fetching logic above in this page component
              and pass `initialProjects={projects}` to ResearchProjectsList.
            */}
            <ResearchProjectsList />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <p>This is your main dashboard. More widgets and information will be added here.</p>
        {/* Placeholder for other dashboard content */}
      </section>
      
      {/* Add more sections as needed */}
    </div>
  );
}
