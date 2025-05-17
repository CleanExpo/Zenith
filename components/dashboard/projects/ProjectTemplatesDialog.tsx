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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { exportService } from '@/lib/services/exportService';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, File, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProjectTemplatesDialogProps {
  projectId?: string;
  projectTitle?: string;
}

export function ProjectTemplatesDialog({ projectId, projectTitle }: ProjectTemplatesDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('use');
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Save as template form state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();

  // Load templates when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates();
      
      // If we have a project, pre-fill the template form
      if (projectId && projectTitle) {
        setTemplateDescription('');
        setTemplateName(`${projectTitle} Template`);
      }
    }
  }, [open, projectId, projectTitle]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const templates = await exportService.getProjectTemplates();
      setTemplates(templates);
    } catch (error: any) {
      toast({
        title: 'Failed to load templates',
        description: error.message || 'An error occurred while loading templates.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'No template selected',
        description: 'Please select a template to continue.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const projectId = await exportService.createProjectFromTemplate(selectedTemplate);
      
      toast({
        title: 'Project created',
        description: 'New project has been created from the template.',
      });
      
      setOpen(false);
      
      // Navigate to the new project
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error: any) {
      toast({
        title: 'Failed to create project',
        description: error.message || 'An error occurred while creating the project.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!projectId) {
      toast({
        title: 'No project selected',
        description: 'Cannot save as template without a project.',
        variant: 'destructive',
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: 'Template name required',
        description: 'Please provide a name for your template.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      await exportService.saveProjectAsTemplate(
        projectId,
        templateName,
        templateDescription,
        isPublic
      );
      
      toast({
        title: 'Template saved',
        description: 'Your project has been saved as a template.',
      });
      
      // Reset form and reload templates
      setTemplateName('');
      setTemplateDescription('');
      setIsPublic(false);
      
      // Switch to use tab and reload templates
      setActiveTab('use');
      await loadTemplates();
    } catch (error: any) {
      toast({
        title: 'Failed to save template',
        description: error.message || 'An error occurred while saving the template.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LayoutTemplate className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Project Templates</DialogTitle>
          <DialogDescription>
            Create new projects from templates or save your current project as a template.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="use">Use Template</TabsTrigger>
            <TabsTrigger value="save" disabled={!projectId}>Save as Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="use" className="py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Available Templates</h4>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <p>Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <File className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No templates available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save a project as a template to get started.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-1 gap-4">
                    {templates.map((template) => (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          selectedTemplate === template.id 
                            ? 'border-primary' 
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(template.created_at).toLocaleDateString()}
                            {template.is_public && ' • Public'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm">
                            {template.description || 'No description'}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0 text-xs text-muted-foreground">
                          <div className="flex space-x-4">
                            <span>{template.tasks?.length || 0} tasks</span>
                            <span>{template.notes?.length || 0} notes</span>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="save" className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description (optional)</Label>
                <Textarea
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="isPublic">Make template available to all users</Label>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>This will save the current project structure, tasks, and notes as a template.</p>
                <p>Project files and comments will not be included in the template.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          
          {activeTab === 'use' ? (
            <Button 
              onClick={handleCreateFromTemplate} 
              disabled={!selectedTemplate || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          ) : (
            <Button 
              onClick={handleSaveAsTemplate} 
              disabled={!templateName.trim() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
