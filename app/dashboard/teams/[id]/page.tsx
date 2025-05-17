'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Team, 
  TeamMember, 
  TeamInvitation,
  getTeam, 
  getTeamMembers, 
  updateTeam, 
  removeTeamMember,
  updateTeamMemberRole,
  getTeamInvitations,
  createTeamInvitation,
  deleteTeamInvitation
} from '@/lib/auth/teams';
import TeamResources from '@/components/dashboard/teams/TeamResources';
import TeamSettings from '@/components/dashboard/teams/TeamSettings';
import TeamAnalytics from '@/components/dashboard/teams/TeamAnalytics';
import { UserRole } from '@/lib/auth/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, UserPlus, Trash2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [teamName, setTeamName] = useState<string>('');
  const [teamDescription, setTeamDescription] = useState<string>('');
  const [updatingTeam, setUpdatingTeam] = useState<boolean>(false);
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.VIEWER);
  const [sendingInvite, setSendingInvite] = useState<boolean>(false);
  
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<boolean>(false);
  
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null);
  const [deletingInvitation, setDeletingInvitation] = useState<boolean>(false);

  // Fetch team data on component mount
  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  // Fetch team data
  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Fetch team details
      const teamData = await getTeam(teamId);
      if (!teamData) {
        toast({
          title: 'Error',
          description: 'Team not found',
          variant: 'destructive',
        });
        router.push('/dashboard/teams');
        return;
      }
      
      setTeam(teamData);
      setTeamName(teamData.name);
      setTeamDescription(teamData.description || '');
      
      // Fetch team members
      const membersData = await getTeamMembers(teamId);
      setMembers(membersData);
      
      // Fetch team invitations
      const invitationsData = await getTeamInvitations(teamId);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle update team
  const handleUpdateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingTeam(true);
    try {
      const updatedTeam = await updateTeam(teamId, {
        name: teamName,
        description: teamDescription,
      });
      
      if (updatedTeam) {
        toast({
          title: 'Success',
          description: 'Team updated successfully',
        });
        
        // Update local state
        setTeam(updatedTeam);
        setEditDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update team',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to update team',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTeam(false);
    }
  };

  // Handle send invitation
  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    setSendingInvite(true);
    try {
      const invitation = await createTeamInvitation(teamId, inviteEmail, inviteRole);
      
      if (invitation) {
        toast({
          title: 'Success',
          description: 'Invitation sent successfully',
        });
        
        // Update local state
        setInvitations([...invitations, invitation]);
        
        // Reset form
        setInviteEmail('');
        setInviteRole(UserRole.VIEWER);
        setInviteDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send invitation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setSendingInvite(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    setRemovingMember(true);
    try {
      const success = await removeTeamMember(teamId, memberToRemove);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Member removed successfully',
        });
        
        // Update local state
        setMembers(members.filter(member => member.user_id !== memberToRemove));
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove member',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    } finally {
      setRemovingMember(false);
      setMemberToRemove(null);
    }
  };

  // Handle delete invitation
  const handleDeleteInvitation = async () => {
    if (!invitationToDelete) return;
    
    setDeletingInvitation(true);
    try {
      const success = await deleteTeamInvitation(invitationToDelete);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Invitation deleted successfully',
        });
        
        // Update local state
        setInvitations(invitations.filter(invitation => invitation.id !== invitationToDelete));
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete invitation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invitation',
        variant: 'destructive',
      });
    } finally {
      setDeletingInvitation(false);
      setInvitationToDelete(null);
    }
  };

  // Handle update member role
  const handleUpdateMemberRole = async (userId: string, role: UserRole) => {
    try {
      const updatedMember = await updateTeamMemberRole(teamId, userId, role);
      
      if (updatedMember) {
        toast({
          title: 'Success',
          description: 'Member role updated successfully',
        });
        
        // Update local state
        setMembers(members.map(member => 
          member.user_id === userId ? { ...member, role } : member
        ));
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update member role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Team Not Found</h1>
        <p className="mb-6">The team you are looking for does not exist or you do not have access to it.</p>
        <Button asChild>
          <Link href="/dashboard/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button asChild variant="outline" className="mr-4">
          <Link href="/dashboard/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{team.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
            <CardDescription>
              {team.description || 'No description'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">Created On</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(team.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(team.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button>Edit Team</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit team</DialogTitle>
                  <DialogDescription>
                    Update your team details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      placeholder="Enter team description"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTeam} disabled={updatingTeam}>
                    {updatingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite a new member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value) => setInviteRole(value as UserRole)}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                          <SelectItem value={UserRole.EDITOR}>Editor</SelectItem>
                          <SelectItem value={UserRole.VIEWER}>Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendInvitation} disabled={sendingInvite}>
                      {sendingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No members found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.user_email || '-'}</TableCell>
                        <TableCell>{member.user_name || '-'}</TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateMemberRole(member.user_id, value as UserRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                              <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                              <SelectItem value={UserRole.EDITOR}>Editor</SelectItem>
                              <SelectItem value={UserRole.VIEWER}>Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => setMemberToRemove(member.user_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the member from the team. They will no longer have access to team resources.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setMemberToRemove(null)}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={handleRemoveMember} disabled={removingMember}>
                                  {removingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Manage your team invitations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No pending invitations.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>{invitation.role}</TableCell>
                        <TableCell>
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                // Copy invitation link to clipboard
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/dashboard/teams/invite/${invitation.token}`
                                );
                                toast({
                                  title: 'Success',
                                  description: 'Invitation link copied to clipboard',
                                });
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => setInvitationToDelete(invitation.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete the invitation. The user will no longer be able to join the team with this invitation.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setInvitationToDelete(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteInvitation} disabled={deletingInvitation}>
                                    {deletingInvitation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Send New Invitation
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 space-y-6">
        <TeamResources teamId={teamId} />
        <TeamSettings teamId={teamId} />
        <TeamAnalytics teamId={teamId} />
      </div>
    </div>
  );
}
