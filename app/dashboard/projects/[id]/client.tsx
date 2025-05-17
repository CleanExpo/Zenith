'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Calendar, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectNotes from '@/components/dashboard/projects/ProjectNotes';
import ProjectTasks from '@/components/dashboard/projects/ProjectTasks';
import ProjectFiles from '@/components/dashboard/projects/ProjectFiles';
import ProjectAnalytics from '@/components/dashboard/projects/ProjectAnalytics';
import ProjectActivityFeed from '@/components/dashboard/projects/ProjectActivityFeed';
import { ExportProjectDialog } from '@/components/dashboard/projects/ExportProjectDialog';
import { ProjectTemplatesDialog } from '@/components/dashboard/projects/ProjectTemplatesDialog';
import { ProjectSharingDialog } from '@/components/dashboard/projects/ProjectSharingDialog';
import EnhancedEditProjectForm from '@/components/dashboard/projects/EnhancedEditProjectForm';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { ResearchProject } from '@/lib/database.types';

interface ProjectClientProps {
  project: ResearchProject;
}

export default function ProjectClient({ project }: ProjectClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleDelete = async () => {
    try {
      // Use the API endpoint to delete the project
      const response = await fetch(`/api/research-projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      toast({
        title: 'Project deleted',
        description: 'Your project has been deleted successfully.',
      });

      logger.info('Project deleted', { projectId: project.id });

      // Redirect to the dashboard
      router.push('/dashboard');
    } catch (error: any) {
      logger.error('Error deleting project', { error: error.message, projectId: project.id });
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isEditing) {
    return (
      <EnhancedEditProjectForm 
        project={project} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex space-x-2">
          <ExportProjectDialog projectId={project.id} projectTitle={project.title} />
          <ProjectTemplatesDialog projectId={project.id} projectTitle={project.title} />
          <ProjectSharingDialog projectId={project.id} projectTitle={project.title} />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{project.title}</CardTitle>
          {project.description && (
            <CardDescription className="text-base">{project.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Created: {new Date(project.created_at).toLocaleString()}</span>
              </div>
              {project.updated_at && project.updated_at !== project.created_at && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Last Updated: {new Date(project.updated_at).toLocaleString()}</span>
                </div>
              )}
              {project.due_date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4 text-orange-500" />
                  <span>Due: {new Date(project.due_date).toLocaleString()}</span>
                </div>
              )}
              {project.priority && (
                <div className="flex items-center text-sm">
                  <span className={`mr-2 h-2 w-2 rounded-full ${
                    project.priority === 'high' ? 'bg-red-500' : 
                    project.priority === 'medium' ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`} />
                  <span className="text-muted-foreground">
                    Priority: {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-2">Project Details</h3>
              <p className="text-muted-foreground">
                {project.description 
                  ? project.description 
                  : "No additional details provided for this project."}
              </p>
              
              {project.tags && project.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks projectId={project.id} />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <ProjectNotes projectId={project.id} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <ProjectFiles projectId={project.id} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <ProjectAnalytics projectId={project.id} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ProjectActivityFeed projectId={project.id} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated notes and tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
