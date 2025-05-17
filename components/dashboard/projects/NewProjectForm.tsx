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
      // Redirect to the dashboard or the new project's page
      router.push('/dashboard'); // Or `/dashboard/projects/${result.id}`
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating Project...' : 'Create Project'}
      </Button>
    </form>
  );
}
