'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

export default function DeleteAccountPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Error fetching user:', error);
          toast.error('You must be logged in to delete your account');
          router.push('/auth/login');
          return;
        }
        
        if (user.email) {
          setUserEmail(user.email);
        } else {
          toast.error('Unable to verify your account');
          router.push('/dashboard/profile');
        }
      } catch (error) {
        console.error('Unexpected error fetching user:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserEmail();
  }, [router, supabase.auth]);
  
  const [confirmations, setConfirmations] = useState({
    deleteData: false,
    loseAccess: false,
    permanent: false,
  });
  
  const allConfirmed = Object.values(confirmations).every(Boolean);
  
  const handleConfirmationChange = (key: keyof typeof confirmations) => {
    setConfirmations(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allConfirmed) {
      setError('Please confirm all statements before proceeding');
      return;
    }
    
    if (!password) {
      setError('Please enter your password to confirm');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // First, verify the password by signing in
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });
      
      if (signInError) {
        setError('Incorrect password. Please try again.');
        setIsDeleting(false);
        return;
      }
      
      // Then delete the user account
      // Note: In a real implementation, you would need to handle data deletion as well
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (deleteError) {
        toast.error(deleteError.message);
        console.error('Account deletion error:', deleteError);
        setIsDeleting(false);
        return;
      }
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Show success message and redirect to home page
      toast.success('Your account has been deleted successfully');
      router.push('/');
    } catch (error) {
      console.error('Unexpected error during account deletion:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-red-600"></div>
          <p className="text-gray-600">Verifying your account...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-red-600">Delete Account</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/profile')}
        >
          Back to Profile
        </Button>
      </div>
      
      <Alert variant="destructive" className="mb-8">
        <AlertTitle>Warning: This action cannot be undone</AlertTitle>
        <AlertDescription>
          Deleting your account will permanently remove all your data from our systems. This action is irreversible.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Delete Your Account</CardTitle>
          <CardDescription>
            Please read the following information carefully before proceeding
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="rounded-md bg-gray-50 p-4">
              <h3 className="mb-2 font-medium">What happens when you delete your account:</h3>
              <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
                <li>Your account will be permanently deleted from our system</li>
                <li>All your personal information will be removed</li>
                <li>Your projects and research data will be deleted</li>
                <li>You will lose access to all your content</li>
                <li>You will need to create a new account if you want to use our services again</li>
              </ul>
            </div>
            
            <form onSubmit={handleDeleteAccount} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="deleteData" 
                    checked={confirmations.deleteData}
                    onCheckedChange={() => handleConfirmationChange('deleteData')}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="deleteData" 
                    className="cursor-pointer font-normal"
                  >
                    I understand that all my data will be permanently deleted
                  </Label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="loseAccess" 
                    checked={confirmations.loseAccess}
                    onCheckedChange={() => handleConfirmationChange('loseAccess')}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="loseAccess" 
                    className="cursor-pointer font-normal"
                  >
                    I understand that I will lose access to all my projects and content
                  </Label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="permanent" 
                    checked={confirmations.permanent}
                    onCheckedChange={() => handleConfirmationChange('permanent')}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="permanent" 
                    className="cursor-pointer font-normal"
                  >
                    I understand that this action is permanent and cannot be undone
                  </Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Enter your password to confirm</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    type="button"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={!allConfirmed || !password || isDeleting}
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
              </Button>
            </form>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col items-start border-t px-6 py-4">
          <p className="text-sm text-gray-600">
            If you're experiencing issues with our service, please consider <a href="/contact" className="text-blue-600 hover:underline">contacting support</a> before deleting your account.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
