import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Only import cookies if running in the app directory (dynamic import avoids early error)
let getCookies: (() => any) | undefined;
try {
  // @ts-ignore
  getCookies = require('next/headers').cookies;
} catch {
  // Not available in /pages or outside App Router
}

export function createClient() {
  // If cookies are available, use them (App Router)
  if (getCookies) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: getCookies(),
        } as CookieOptions,
      }
    );
  }

  // Otherwise, use classic method or throw a helpful error
  throw new Error(
    "createClient can only be used in a Server Component or Route Handler (App Router) where 'next/headers' is available."
  );
}
