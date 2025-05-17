'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoginButtons from '@/components/auth/LoginButtons';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const handleLogin = async () => {
    // This function will be called by the LoginButtons component
    // when the user successfully logs in
    router.push('/dashboard');
    router.refresh();
  };
  
  const handleSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <div className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-4">
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to your account to continue</p>
        </div>
        
        <SocialLoginButtons mode="login" />
        
        <LoginButtons 
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      </div>
    </div>
  );
}
