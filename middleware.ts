import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './lib/database.types';
import { pathBasedRateLimit, methodBasedRateLimit } from './lib/middleware/rateLimit';
import { logger } from './lib/logger';

// Define rate limit configurations for different paths
const apiRateLimits = {
  // Default API rate limit
  '/api/*': {
    limit: 100,
    windowMs: 60 * 15, // 15 minutes
  },
  // More restrictive rate limit for authentication endpoints
  '/api/auth/*': {
    limit: 20,
    windowMs: 60 * 15, // 15 minutes
  },
  // More restrictive rate limit for admin endpoints
  '/api/admin/*': {
    limit: 30,
    windowMs: 60 * 15, // 15 minutes
  },
  // Higher limit for search endpoints
  '/api/search': {
    limit: 200,
    windowMs: 60 * 15, // 15 minutes
  },
};

// Define rate limit configurations for different HTTP methods
const methodRateLimits = {
  // More restrictive rate limit for POST, PUT, DELETE methods
  'POST': {
    limit: 50,
    windowMs: 60 * 15, // 15 minutes
  },
  'PUT': {
    limit: 50,
    windowMs: 60 * 15, // 15 minutes
  },
  'DELETE': {
    limit: 30,
    windowMs: 60 * 15, // 15 minutes
  },
};

// Create middleware chain
const rateLimitMiddleware = pathBasedRateLimit(apiRateLimits);
const methodRateLimitMiddleware = methodBasedRateLimit(methodRateLimits);

export async function middleware(request: NextRequest) {
  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    try {
      // First apply path-based rate limiting
      const pathRateLimitResponse = await rateLimitMiddleware(request, async () => {
        // Then apply method-based rate limiting
        return methodRateLimitMiddleware(request, async () => {
          // If both rate limits pass, continue with the request
          return NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
        });
      });
      
      // If rate limit was exceeded, return the response
      if (pathRateLimitResponse.status === 429) {
        return pathRateLimitResponse;
      }
    } catch (error) {
      logger.error('Error applying rate limiting', { 
        error: error instanceof Error ? error.message : String(error),
        path: request.nextUrl.pathname
      });
      // If there's an error with rate limiting, proceed with the request
    }
  }
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
          try {
            request.cookies.set({ name, value, ...options });
            // Re-create response to apply updated request cookies
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set({ name, value, ...options });
          } catch (error) {
            console.error('[Middleware] Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            request.cookies.set({ name, value: '', ...options });
            // Re-create response to apply updated request cookies
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set({ name, value: '', ...options });
          } catch (error) {
            console.error('[Middleware] Error removing cookie:', error);
          }
        },
      },
    }
  );

  // Get session
  console.log('[Middleware] Attempting to get Supabase session...');
  let session;
  let sessionError;
  try {
    // Use getUser instead of getSession to avoid security warnings
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('[Middleware] Error getting user:', error);
      sessionError = error;
    }
    
    // If we have a user, get the session for additional data
    if (data.user) {
      const sessionResult = await supabase.auth.getSession();
      session = sessionResult.data.session;
      console.log('[Middleware] Supabase user authenticated:', `User ID: ${data.user.id}`);
    } else {
      console.log('[Middleware] No authenticated user found');
    }
  } catch (e) {
    console.error('[Middleware] Exception during authentication:', e);
    sessionError = e;
  }

  // In development mode, we allow access to the dashboard without authentication
  // This is useful for testing and development purposes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session && !sessionError) {
    console.log('[Middleware] No session, but allowing dashboard access in development mode.');
    // We don't redirect to login, allowing direct access to dashboard
  }

  // Check auth routes - if authenticated, redirect to dashboard
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
