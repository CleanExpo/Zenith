// Zenith/components/dashboard/ResearchProjectsList.tsx
"use client";

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
// Assuming a type for ResearchProject, ideally from a shared types file or database.types.ts
// For now, defining a local one.
interface ResearchProject {
  id: string;
  title: string;
  description?: string | null;
  created_at: string; // Assuming ISO string date
}

interface ResearchProjectsListProps {
  // If projects are fetched server-side and passed as props:
  // initialProjects?: ResearchProject[]; 
}

const ResearchProjectsList = (props: ResearchProjectsListProps) => {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // API call to fetch projects
        const response = await fetch('/api/research-projects');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch projects: ${response.statusText}`);
        }
        const data: ResearchProject[] = await response.json();
        setProjects(data);
        logger.info('Fetched research projects for dashboard list', { count: data.length });
      } catch (err: any) {
        logger.error('Error fetching research projects in component', { error: err.message });
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return <p>Loading research projects...</p>; // Replace with Skeleton loader later
  }

  if (error) {
    return <p className="text-destructive">Error loading projects: {error}</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4 text-muted-foreground">You haven't created any research projects yet.</p>
        <Button asChild>
          <Link href="/dashboard/projects/new">Create New Project</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <CardTitle>{project.title}</CardTitle>
            {project.description && (
              <CardDescription>{project.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(project.created_at).toLocaleDateString()}
            </p>
            {/* Add more project details or actions here */}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/projects/${project.id}`}>View Details</Link>
            </Button>
            {/* Add other actions like Edit, Delete */}
          </CardFooter>
        </Card>
      ))}
       <div className="mt-6 text-center">
         <Button asChild>
           <Link href="/dashboard/projects/new">Create New Project</Link>
         </Button>
       </div>
    </div>
  );
};

export default ResearchProjectsList;
