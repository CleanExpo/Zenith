// Zenith/components/dashboard/projects/NewProjectForm.tsx
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast'; // Assuming you have use-toast from shadcn/ui for sonner
import { logger } from '@/lib/logger';

export default function NewProjectForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      setIsLoading(false);
      toast({
        title: "Validation Error",
        description: "Project title cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/research-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('Failed to create project - API error', { status: response.status, error: result.error });
        throw new Error(result.error || `Failed to create project (status: ${response.status})`);
      }

      logger.info('Project created successfully', { projectId: result.id, title });
      toast({
        title: "Project Created!",
        description: `"${title}" has been successfully created.`,
      });
      
      // Redirect to the new project's detail page or dashboard
      if (result.id) {
        router.push(`/dashboard/projects/${result.id}`);
      } else {
        router.push('/dashboard');
      }
      router.refresh(); // Refresh server components
    } catch (err: any) {
      logger.error('Error submitting new project form', { error: err.message });
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to create project: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter project title"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Project Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a brief description of your project"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Project...
            </span>
          ) : (
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create Project
            </span>
          )}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/dashboard')} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
