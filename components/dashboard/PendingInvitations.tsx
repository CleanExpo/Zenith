'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { collaborationService } from '@/lib/services/collaborationService';
import { logger } from '@/lib/logger';

// Extended interface for pending invitations that includes project and inviter details
interface PendingInvitation {
  id: string;
  project_id: string;
  user_id?: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by?: string;
  invitation_status: 'pending' | 'accepted' | 'declined';
  invitation_email?: string;
  invitation_token?: string;
  invitation_expires_at?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
  };
  inviter?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const data = await collaborationService.getPendingInvitations();
      setInvitations(data);
      logger.info('Fetched pending invitations', { count: data.length });
    } catch (error: any) {
      logger.error('Error fetching pending invitations', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to load pending invitations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAcceptInvitation = async (invitationToken: string) => {
    setProcessingInvitation(invitationToken);
    try {
      const success = await collaborationService.acceptProjectInvitation(invitationToken);
      
      if (success) {
        toast({
          title: 'Invitation accepted',
          description: 'You have successfully joined the project',
        });
        
        // Remove the invitation from the list
        setInvitations(prev => prev.filter(inv => inv.invitation_token !== invitationToken));
        
        // Refresh the page to update the projects list
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to accept invitation. It may have expired.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      logger.error('Error accepting invitation', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to accept invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeclineInvitation = async (invitationToken: string) => {
    setProcessingInvitation(invitationToken);
    try {
      const success = await collaborationService.declineProjectInvitation(invitationToken);
      
      if (success) {
        toast({
          title: 'Invitation declined',
          description: 'You have declined the project invitation',
        });
        
        // Remove the invitation from the list
        setInvitations(prev => prev.filter(inv => inv.invitation_token !== invitationToken));
      } else {
        toast({
          title: 'Error',
          description: 'Failed to decline invitation. It may have expired.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      logger.error('Error declining invitation', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to decline invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingInvitation(null);
    }
  };

  // If there are no invitations and we're not loading, don't render anything
  if (invitations.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          Project invitations that require your attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : invitations.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No pending invitations
          </p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div 
                key={invitation.id} 
                className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {invitation.project?.title || 'Project Invitation'}
                    <Badge className="ml-2" variant="outline">
                      {invitation.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invited by {invitation.inviter?.display_name || invitation.inviter?.email || 'a team member'}
                  </p>
                </div>
                <div className="flex space-x-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeclineInvitation(invitation.invitation_token!)}
                    disabled={processingInvitation === invitation.invitation_token}
                  >
                    {processingInvitation === invitation.invitation_token ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvitation(invitation.invitation_token!)}
                    disabled={processingInvitation === invitation.invitation_token}
                  >
                    {processingInvitation === invitation.invitation_token ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
