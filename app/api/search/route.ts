import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { searchService } from '@/lib/services/searchService';
import { logger } from '@/lib/logger';
import { isDevelopmentEnvironment } from '@/lib/utils/auth';
import { CachePrefix, CacheExpiration, withCache } from '@/lib/utils/cacheUtils';

export async function GET(request: NextRequest) {
  try {
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
        logger.warn('Unauthorized search request', { error: userError?.message });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const types = searchParams.get('types')?.split(',') as ('project' | 'task' | 'note' | 'file')[] | undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.has('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Create a cache key based on the search parameters
    const cacheKey = `${CachePrefix.SEARCH}:${query}:${types?.join(',') || 'all'}:${projectId || 'all'}:${limit || 20}:${offset || 0}`;
    
    // Use the withCache utility to get data from cache or perform search
    const results = await withCache(
      cacheKey,
      async () => {
        logger.info('Performing search from database', { query, types, projectId });
        return searchService.search(query, {
          types,
          projectId,
          limit,
          offset,
        });
      },
      CacheExpiration.SHORT // Use a shorter expiration time for search results
    );

    logger.info('Search API request', { 
      query, 
      resultCount: results.length,
      types: types?.join(',') || 'all'
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    logger.error('Error in search API', { error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
