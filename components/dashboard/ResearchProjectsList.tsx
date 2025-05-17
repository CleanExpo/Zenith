// Zenith/components/dashboard/ResearchProjectsList.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, AlertCircle, FileText, Pencil, Trash2, Eye, Calendar, RefreshCw, Tag } from 'lucide-react';
import Link from 'next/link';
import { PaginatedResult } from '@/lib/services/researchProjectService';

// Extended interface to handle both count and total properties
interface EnhancedPaginatedResult<T> extends PaginatedResult<T> {
  total?: number;
}
import { EnhancedCachedResearchProjectService } from '@/lib/services/enhancedCachedResearchProjectService';
import { FilterParams, enhancedResearchProjectService } from '@/lib/services/enhancedResearchProjectService';
import ProjectSearchFilters, { SearchFilters } from '@/components/dashboard/projects/ProjectSearchFilters';
import { useToast } from '@/components/ui/use-toast';
import { ResearchProject } from '@/lib/database.types';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface ResearchProjectsListProps {
  initialProjects?: ResearchProject[];
  initialPaginatedResult?: EnhancedPaginatedResult<ResearchProject>;
  isLoading?: boolean;
  error?: string | null;
}

const ResearchProjectsList = ({ 
  initialProjects = [], 
  initialPaginatedResult,
  isLoading: initialLoading = true,
  error: initialError = null
}: ResearchProjectsListProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ResearchProject[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);
  const [totalItems, setTotalItems] = useState<number>(initialPaginatedResult?.count || 0);
  const [user, setUser] = useState<{ id: string } | null>(null);
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Fetch user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        logger.error('Error fetching user', { error: error.message });
        return;
      }
      if (data?.user) {
        setUser(data.user);
      }
    };
    
    fetchUser();
  }, []);
  
  // Initialize pagination
  const pagination = usePagination({
    initialPage: initialPaginatedResult?.currentPage || 1,
    initialPageSize: 10,
    totalItems: totalItems
  });
  
  const [filters, setFilters] = useState<FilterParams>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // Fetch projects with pagination and filtering using enhanced cached service
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await EnhancedCachedResearchProjectService.getProjects(
        user.id,
        pagination.page,
        pagination.pageSize,
        filters
      ) as { data: ResearchProject[]; total: number };
      
      setProjects(result.data);
      setTotalItems(result.total);
      setError(null);
      logger.info('Successfully fetched filtered paginated projects from cache', { 
        page: pagination.page, 
        pageSize: pagination.pageSize,
        totalItems: result.total,
        filters
      });
    } catch (error: any) {
      logger.error('Error fetching filtered paginated projects', { error: error.message, filters });
      setError(error.message);
      toast({
        title: 'Error',
        description: `Failed to load projects: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters, toast]);
  
  // Fetch all available tags
  const fetchTags = useCallback(async () => {
    try {
      const tags = await enhancedResearchProjectService.getAllTags();
      setAvailableTags(tags);
      logger.info('Successfully fetched project tags', { count: tags.length });
    } catch (error: any) {
      logger.error('Error fetching project tags', { error: error.message });
    }
  }, []);
  
  // Fetch all available categories
  const fetchCategories = useCallback(async () => {
    try {
      const categories = await enhancedResearchProjectService.getAllCategories();
      setAvailableCategories(categories);
      logger.info('Successfully fetched project categories', { count: categories.length });
    } catch (error: any) {
      logger.error('Error fetching project categories', { error: error.message });
    }
  }, []);
  
  // Fetch projects when pagination or filters change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  // Fetch tags and categories on component mount
  useEffect(() => {
    fetchTags();
    fetchCategories();
  }, [fetchTags, fetchCategories]);
  
  // Update state when props change (for SSR)
  useEffect(() => {
    if (initialPaginatedResult) {
      setProjects(initialPaginatedResult.data);
      setTotalItems(initialPaginatedResult.count || initialPaginatedResult.total || 0);
      setIsLoading(initialLoading);
      setError(initialError);
    } else if (initialProjects.length > 0) {
      setProjects(initialProjects);
      setTotalItems(initialProjects.length);
      setIsLoading(initialLoading);
      setError(initialError);
    }
  }, [initialProjects, initialPaginatedResult, initialLoading, initialError]);

  // Handle search and filter changes
  const handleFilterChange = (searchFilters: SearchFilters) => {
    const newFilters: FilterParams = {
      searchTerm: searchFilters.searchTerm,
      priority: searchFilters.priority,
      tags: searchFilters.tags,
      status: searchFilters.status,
      category: searchFilters.category,
      dueDateFrom: searchFilters.dueDateFrom,
      dueDateTo: searchFilters.dueDateTo,
      startDateFrom: searchFilters.startDateFrom,
      startDateTo: searchFilters.startDateTo,
      completionDateFrom: searchFilters.completionDateFrom,
      completionDateTo: searchFilters.completionDateTo,
    };
    
    setFilters(newFilters);
    
    // Reset to first page when filters change
    if (pagination.page !== 1) {
      pagination.setPage(1);
    }
    
    logger.info('Applied filters to research projects list', { filters: newFilters });
  };

  // Handler functions
  const handleEditProject = (project: ResearchProject) => {
    // Navigate to edit page using Next.js router for client-side navigation
    router.push(`/dashboard/projects/${project.id}/edit`);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await enhancedResearchProjectService.delete(projectId);
        // Refresh the projects list
        fetchProjects();
        // Refresh tags as they might have changed
        fetchTags();
        
        logger.info('Project deleted successfully', { projectId });
        
        // Show success toast
        toast({
          title: 'Project deleted',
          description: 'Your project has been deleted successfully.',
        });
      } catch (err: any) {
        logger.error('Error deleting project', { error: err.message, projectId });
        toast({
          title: 'Error',
          description: `Failed to delete project: ${err.message}`,
          variant: 'destructive',
        });
      }
    }
  };

  // Skeleton loader for projects
  const ProjectSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-28" />
      </CardFooter>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ProjectSkeleton />
        <ProjectSkeleton />
        <ProjectSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load research projects: {error}
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={() => router.refresh()}>
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  const EmptyState = () => (
    <div className="text-center py-8 space-y-4">
      <div className="flex justify-center">
        <FileText className="h-16 w-16 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No Research Projects Yet</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        You haven't created any research projects yet. Start by creating your first project.
      </p>
      <Button asChild className="mt-2">
        <Link href="/dashboard/projects/new">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Project
        </Link>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Component */}
      <ProjectSearchFilters 
        onFilterChange={handleFilterChange}
        availableTags={availableTags}
        availableCategories={availableCategories}
      />
      {isLoading ? (
        <div className="space-y-4">
          <ProjectSkeleton />
          <ProjectSkeleton />
          <ProjectSkeleton />
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load research projects: {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={fetchProjects}>
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{project.title}</span>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        title="Edit Project"
                        onClick={() => handleEditProject(project)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive/90" 
                        title="Delete Project"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      {project.updated_at && project.updated_at !== project.created_at && (
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {project.due_date && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                          <span>Due: {new Date(project.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {project.priority && (
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            project.priority === 'high' ? 'bg-red-500' : 
                            project.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <span className="capitalize">{project.priority} Priority</span>
                        </div>
                      )}
                      {project.status && (
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            project.status === 'completed' ? 'bg-green-500' : 
                            project.status === 'in_progress' ? 'bg-blue-500' : 
                            project.status === 'on_hold' ? 'bg-yellow-500' :
                            project.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                          <span className="capitalize">{project.status.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {project.category && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground">Category: </span>
                          <span className="ml-1">{project.category}</span>
                        </div>
                      )}
                    </div>
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.tags.map((tag, index) => (
                          <div key={index} className="flex items-center bg-muted px-2 py-1 rounded-md text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Pagination Controls */}
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageItems={pagination.pageItems}
            canPrevPage={pagination.canPrevPage}
            canNextPage={pagination.canNextPage}
            onPageChange={pagination.setPage}
            onPrevPage={pagination.prevPage}
            onNextPage={pagination.nextPage}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
            totalItems={totalItems}
            className="mt-6"
          />
          
          <div className="mt-6 text-center">
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Project
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ResearchProjectsList;
