'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SignupButtons from '@/components/auth/SignupButtons';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const handleSignup = async () => {
    // This function will be called by the SignupButtons component
    // when the user successfully signs up
    router.push('/dashboard');
    router.refresh();
  };
  
  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-4">
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="mt-2 text-gray-600">Sign up to get started with Zenith</p>
        </div>
        
        <SocialLoginButtons mode="signup" />
        
        <SignupButtons 
          onSignup={handleSignup}
          onLogin={handleLogin}
        />
      </div>
    </div>
  );
}
