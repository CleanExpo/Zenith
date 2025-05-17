'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          setIsLoading(false);
          return;
        }
        
        if (user) {
          setUserEmail(user.email);
          setIsVerified(user.email_confirmed_at !== null);
        } else {
          // Try to get email from URL
          const email = searchParams.get('email');
          if (email) {
            setUserEmail(email!);
          }
        }
      } catch (error) {
        console.error('Unexpected error checking verification status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkVerificationStatus();
  }, [supabase.auth, searchParams]);
  
  const handleSendVerificationEmail = async () => {
    if (!userEmail) return;
    
    setIsSending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      
      if (error) {
        toast.error(error.message);
        console.error('Error sending verification email:', error);
        return;
      }
      
      toast.success('Verification email sent successfully');
    } catch (error) {
      console.error('Unexpected error sending verification email:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSending(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {isVerified
              ? 'Your email has been verified successfully'
              : 'Please verify your email address to continue'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isVerified ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div>
                <h3 className="text-lg font-medium">Email Verified</h3>
                <p className="text-sm text-gray-500">
                  Your email address ({userEmail}) has been verified successfully.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertCircle className="h-16 w-16 text-amber-500" />
              <div>
                <h3 className="text-lg font-medium">Verification Required</h3>
                <p className="text-sm text-gray-500">
                  We've sent a verification email to <strong>{userEmail}</strong>.
                  Please check your inbox and click the verification link.
                </p>
              </div>
              
              <div className="w-full rounded-md bg-gray-50 p-4">
                <h4 className="mb-2 font-medium">Haven't received the email?</h4>
                <ul className="mb-4 list-inside list-disc text-sm text-gray-600">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email address</li>
                  <li>Wait a few minutes and check again</li>
                </ul>
                
                <Button 
                  onClick={handleSendVerificationEmail}
                  disabled={isSending}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isSending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {isVerified ? (
            <Button 
              className="w-full" 
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          ) : (
            <div className="w-full space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/auth/login')}
              >
                Back to Login
              </Button>
              
              <div className="text-center text-sm text-gray-500">
                Need help? <Link href="/contact" className="text-blue-600 hover:underline">Contact Support</Link>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
