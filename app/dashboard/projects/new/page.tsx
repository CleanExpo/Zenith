// Zenith/app/dashboard/projects/new/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import NewProjectForm from '@/components/dashboard/projects/NewProjectForm'; // We'll create this next

export default async function NewResearchProjectPage() {
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

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn('User not authenticated on new project page, redirecting to login.', { error: userError?.message });
    redirect('/auth/login');
  }

  logger.info('New Research Project page accessed', { userId: user.id });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Create New Research Project</h1>
        <p className="text-muted-foreground">Fill in the details below to start a new project.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Provide a title and an optional description for your new research project.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewProjectForm />
        </CardContent>
        {/* <CardFooter>
          {/* Optional footer content for the card */}
        {/* </CardFooter> */}
      </Card>
    </div>
  );
}
