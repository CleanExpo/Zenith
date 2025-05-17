'use client';

import { useState, useEffect } from 'react';
import { TeamResource } from '@/lib/services/teamResourceService';
import { teamResourceService } from '@/lib/services/teamResourceService';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Loader2, Trash2, ExternalLink, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TeamPermissionGuard from '@/components/auth/TeamPermissionGuard';
import { UserRole, Permission } from '@/lib/auth/types';

interface TeamResourcesProps {
  teamId: string;
}

export default function TeamResources({ teamId }: TeamResourcesProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<TeamResource[] | null>(null);
  const [reports, setReports] = useState<TeamResource[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [resourceToRemove, setResourceToRemove] = useState<TeamResource | null>(null);
  const [removingResource, setRemovingResource] = useState<boolean>(false);

  // Fetch team resources on component mount
  useEffect(() => {
    fetchTeamResources();
  }, [teamId]);

  // Fetch team resources
  const fetchTeamResources = async () => {
    setLoading(true);
    try {
      // Fetch team projects
      const projectsData = await teamResourceService.getTeamProjects(teamId);
      setProjects(projectsData);
      
      // Fetch team reports
      const reportsData = await teamResourceService.getTeamReports(teamId);
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching team resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team resources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle remove resource
  const handleRemoveResource = async () => {
    if (!resourceToRemove) return;
    
    setRemovingResource(true);
    try {
      const success = await teamResourceService.removeResourceFromTeam(
        teamId,
        resourceToRemove.resource_type as any,
        resourceToRemove.resource_id
      );
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Resource removed from team successfully',
        });
        
        // Update local state
        if (resourceToRemove.resource_type === 'project') {
          setProjects(projects?.filter(p => p.id !== resourceToRemove.id) || null);
        } else if (resourceToRemove.resource_type === 'report') {
          setReports(reports?.filter(r => r.id !== resourceToRemove.id) || null);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove resource from team',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing resource from team:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove resource from team',
        variant: 'destructive',
      });
    } finally {
      setRemovingResource(false);
      setResourceToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Resources</CardTitle>
        <CardDescription>
          Manage projects and reports associated with this team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
            {projects && projects.length > 0 ? (
              <Table>
                <TableCaption>A list of projects associated with this team.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.resource_name}</TableCell>
                      <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                          >
                            <Link href={`/dashboard/projects/${project.resource_id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          <TeamPermissionGuard
                            teamId={teamId}
                            role={UserRole.ADMIN}
                          >
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => setResourceToRemove(project)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the project from the team. The project itself will not be deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setResourceToRemove(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction onClick={handleRemoveResource} disabled={removingResource}>
                                    {removingResource && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TeamPermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No projects found.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reports">
            {reports && reports.length > 0 ? (
              <Table>
                <TableCaption>A list of reports associated with this team.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.resource_name}</TableCell>
                      <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                          >
                            <Link href={`/dashboard/reports/${report.resource_id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          <TeamPermissionGuard
                            teamId={teamId}
                            role={UserRole.ADMIN}
                          >
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => setResourceToRemove(report)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the report from the team. The report itself will not be deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setResourceToRemove(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction onClick={handleRemoveResource} disabled={removingResource}>
                                    {removingResource && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TeamPermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No reports found.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <TeamPermissionGuard
          teamId={teamId}
          anyRole={[UserRole.ADMIN, UserRole.MANAGER]}
        >
          <div className="flex space-x-2">
            <Button
              onClick={() => router.push(`/dashboard/projects/new?teamId=${teamId}`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/reports/new?teamId=${teamId}`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </div>
        </TeamPermissionGuard>
      </CardFooter>
    </Card>
  );
}
