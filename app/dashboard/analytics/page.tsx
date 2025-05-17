import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import DashboardAnalyticsClient from './client';

export const dynamic = 'force-dynamic';

export default async function DashboardAnalyticsPage() {
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
  //   logger.warn('User not authenticated on dashboard analytics page, redirecting to login.', { error: userError?.message });
  //   redirect('/auth/login');
  // }

  // Mock user for display purposes while auth is bypassed
  const user = { id: '00000000-0000-4000-a000-000000000000', email: 'user@example.com' };

  // Fetch all projects for the user
  const { data: projects, error: projectsError } = await supabase
    .from('research_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (projectsError) {
    logger.error('Error fetching projects for dashboard analytics', { error: projectsError.message, userId: user.id });
    throw new Error(`Failed to fetch projects: ${projectsError.message}`);
  }

  return <DashboardAnalyticsClient user={user} projects={projects || []} />;
}
