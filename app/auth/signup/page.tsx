'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // options: {
      //   emailRedirectTo: `${window.location.origin}/auth/callback`, // If email confirmation is enabled
      // },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.user && data.user.identities?.length === 0) {
      // This case handles if "Confirm email" is enabled in Supabase Auth settings,
      // and the user already exists but is not confirmed.
      setError(null);
      setMessage("User already exists but is not confirmed. Please check your email to confirm your account or try logging in.");
    }
     else if (data.user) {
      setMessage("Signup successful! Please check your email to confirm your account if required by your Supabase settings, then log in.");
      // router.push('/auth/login'); // Or redirect to a page explaining to check email
    } else {
      // Fallback, should ideally be covered by data.user or signUpError
      setError("An unexpected issue occurred during signup.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="p-8 border rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <a href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
