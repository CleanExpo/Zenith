'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import ResearchProjectsList from '@/components/dashboard/ResearchProjectsList';
import { PendingInvitations } from '@/components/dashboard/PendingInvitations';
import { ImportProjectDialog } from '@/components/dashboard/projects/ImportProjectDialog';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { researchProjectService, PaginatedResult } from '@/lib/services/researchProjectService';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { ResearchProject } from '@/lib/database.types';

export default function DashboardClient() {
  const [paginatedResult, setPaginatedResult] = useState<PaginatedResult<ResearchProject> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get the current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getCurrentUser();
  }, [supabase]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the researchProjectService to fetch paginated projects
        const result = await researchProjectService.getPaginated({
          page: 1,
          pageSize: 10
        });
        
        setPaginatedResult(result);
        logger.info('Paginated projects fetched successfully', { 
          count: result.count,
          page: result.currentPage,
          totalPages: result.totalPages
        });
      } catch (err: any) {
        logger.error('Error fetching paginated projects', { error: err.message });
        console.error('Error fetching paginated projects:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
    
    // Subscribe to changes
    const channel = supabase
      .channel('research_projects_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'research_projects' 
        }, 
        () => {
          fetchProjects();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="space-y-6">
      {/* Subscription Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          {userId && <SubscriptionStatus userId={userId} />}
        </div>
        <div className="md:col-span-2">
          {/* Pending Invitations Section */}
          <PendingInvitations />
        </div>
      </div>
      
      {/* Research Projects Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Research Projects</h2>
        <div className="flex space-x-2">
          <ImportProjectDialog />
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Link>
          </Button>
        </div>
      </div>
      
      <ResearchProjectsList 
        initialProjects={paginatedResult?.data || []} 
        initialPaginatedResult={paginatedResult || undefined}
        isLoading={isLoading} 
        error={error} 
      />
    </div>
  );
}
