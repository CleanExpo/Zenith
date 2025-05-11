import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './lib/database.types'; // We'll need to create this types file

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set(name, '', options);
        },
      },
    }
  );

  // Get session
  console.log('[Middleware] Attempting to get Supabase session...');
  let session;
  let sessionError;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[Middleware] Error getting session:', error);
      sessionError = error;
    }
    session = data.session;
    console.log('[Middleware] Supabase session retrieved:', session ? `User ID: ${session.user.id}` : 'No session');
  } catch (e) {
    console.error('[Middleware] Exception during getSession():', e);
    sessionError = e;
  }

  // Check protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session && !sessionError) {
    console.log('[Middleware] No session, redirecting to login for dashboard access.');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Check auth routes
  if (request.nextUrl.pathname.startsWith('/auth/') && session && !sessionError) {
    console.log('[Middleware] Session found, redirecting from auth page to dashboard.');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (sessionError) {
    console.log('[Middleware] Proceeding despite session error, as it might be a transient issue or handled by the page.');
    // Depending on the error, you might want to redirect to an error page or allow request to proceed
  }

  return response;
}

export const config = {
  matcher: ['/auth/:path*', '/dashboard/:path*']
};
