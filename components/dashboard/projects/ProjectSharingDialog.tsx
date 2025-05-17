'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Share2, UserPlus, Users, Trash2, Edit } from 'lucide-react';
import { collaborationService, Collaborator } from '@/lib/services/collaborationService';
import { logger } from '@/lib/logger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const inviteFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['editor', 'viewer'], {
    required_error: 'Please select a role',
  }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface ProjectSharingDialogProps {
  projectId: string;
  projectTitle: string;
}

export function ProjectSharingDialog({ projectId, projectTitle }: ProjectSharingDialogProps) {
  const [open, setOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
    },
  });

  const loadCollaborators = async () => {
    try {
      setIsLoading(true);
      const data = await collaborationService.getProjectCollaborators(projectId);
      setCollaborators(data);
      logger.info('Loaded project collaborators', { count: data.length });
    } catch (error: any) {
      logger.error('Error loading collaborators', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to load collaborators. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCollaborators();
    }
  }, [open, projectId]);

  const onSubmit = async (values: InviteFormValues) => {
    try {
      setIsLoading(true);
      await collaborationService.inviteUserToProject(projectId, values.email, values.role);
      
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${values.email}`,
      });
      
      form.reset();
      loadCollaborators();
    } catch (error: any) {
      logger.error('Error inviting user', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      setIsLoading(true);
      await collaborationService.removeProjectCollaborator(projectId, userId);
      
      toast({
        title: 'Collaborator removed',
        description: 'The collaborator has been removed from the project',
      });
      
      loadCollaborators();
    } catch (error: any) {
      logger.error('Error removing collaborator', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to remove collaborator. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'editor' | 'viewer') => {
    try {
      setIsLoading(true);
      await collaborationService.updateCollaboratorRole(projectId, userId, newRole);
      
      toast({
        title: 'Role updated',
        description: `The collaborator's role has been updated to ${newRole}`,
      });
      
      loadCollaborators();
    } catch (error: any) {
      logger.error('Error updating role', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'editor':
        return 'bg-green-500 hover:bg-green-600';
      case 'viewer':
        return 'bg-amber-500 hover:bg-amber-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Invite others to collaborate on "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex space-x-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </form>
          </Form>

          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Collaborators
            </h3>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No collaborators yet. Invite someone to get started.
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {collaborators.map((collaborator) => (
                  <Card key={collaborator.id} className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={collaborator.user?.avatar_url} 
                              alt={collaborator.user?.display_name || collaborator.user?.email || 'User'} 
                            />
                            <AvatarFallback>
                              {(collaborator.user?.display_name || collaborator.user?.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {collaborator.user?.display_name || collaborator.user?.email || collaborator.invitation_email}
                            </p>
                            <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(collaborator.role)}`}>
                              {collaborator.role}
                            </Badge>
                            {collaborator.invitation_status === 'pending' && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {collaborator.role !== 'owner' && (
                          <div className="flex space-x-1">
                            <Select
                              defaultValue={collaborator.role}
                              onValueChange={(value) => handleUpdateRole(collaborator.user_id, value as 'editor' | 'viewer')}
                              disabled={isLoading}
                            >
                              <SelectTrigger className="h-7 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
