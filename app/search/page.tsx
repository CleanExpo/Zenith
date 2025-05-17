import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import SearchPageClient from './client';
import { isDevelopmentEnvironment } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
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

  // Skip auth check in development
  if (!isDevelopmentEnvironment()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.warn('User not authenticated on search page, redirecting to login.', { error: userError?.message });
      redirect('/auth/login');
    }
  }

  // Get the search query from URL parameters
  const query = searchParams.q || '';

  // Log the search request
  logger.info('Search page accessed', { query });

  return <SearchPageClient initialQuery={query} />;
}
