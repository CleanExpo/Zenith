'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { acceptTeamInvitation } from '@/lib/auth/teams';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if the invitation is valid on component mount
  useEffect(() => {
    // We don't actually validate the token here, we just set loading to false
    // The actual validation happens when the user accepts the invitation
    setLoading(false);
  }, [token]);

  // Handle accept invitation
  const handleAcceptInvitation = async () => {
    setAccepting(true);
    try {
      const result = await acceptTeamInvitation(token);
      
      if (result) {
        setSuccess(true);
        toast({
          title: 'Success',
          description: 'You have successfully joined the team',
        });
      } else {
        setSuccess(false);
        setError('Failed to accept invitation. The invitation may have expired or been revoked.');
        toast({
          title: 'Error',
          description: 'Failed to accept invitation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setSuccess(false);
      setError('An error occurred while accepting the invitation.');
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You have been invited to join a team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success === null ? (
            <p>
              Click the button below to accept the invitation and join the team.
            </p>
          ) : success ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p>You have successfully joined the team!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild variant="outline">
            <Link href="/dashboard/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {success ? 'Go to Teams' : 'Cancel'}
            </Link>
          </Button>
          
          {success === null && (
            <Button onClick={handleAcceptInvitation} disabled={accepting}>
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept Invitation
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
