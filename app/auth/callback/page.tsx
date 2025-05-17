'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error during auth callback:', error);
        toast.error('Authentication failed. Please try again.');
        router.push('/auth/login');
        return;
      }

      // Successfully authenticated
      toast.success('Successfully authenticated!');
      
      // Check if there's a next parameter in the URL
      const next = searchParams.get('next');
      router.push(next || '/dashboard');
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 p-2">
            <svg
              className="h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Authenticating...</h2>
          <p className="text-center text-gray-600">
            Please wait while we complete your authentication.
          </p>
          <div className="mt-4 flex items-center justify-center">
            <div className="h-4 w-4 animate-bounce rounded-full bg-blue-600"></div>
            <div className="mx-1 h-4 w-4 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-4 w-4 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
