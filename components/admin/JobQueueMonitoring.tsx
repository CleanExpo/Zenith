'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, Clock, Play, RefreshCw, XCircle } from 'lucide-react';
import { JobStatus, JobPriority } from '@/lib/utils/jobQueue';
import { formatDistanceToNow } from 'date-fns';

interface Job {
  id: string;
  type: string;
  data: any;
  status: JobStatus;
  priority: JobPriority;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
}

interface JobQueueStats {
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalJobs: number;
}

export default function JobQueueMonitoring() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<JobQueueStats | null>(null);
  const [jobs, setJobs] = useState<{
    pending: Job[];
    processing: Job[];
    completed: Job[];
    failed: Job[];
  } | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/jobs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      setStats(data.stats);
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch job queue information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = async () => {
    try {
      setRefreshing(true);
      await fetchJobs();
      toast({
        title: 'Success',
        description: 'Job queue information refreshed',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/jobs?id=${jobId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }
      
      toast({
        title: 'Success',
        description: 'Job cancelled successfully',
      });
      
      // Refresh jobs after cancellation
      await fetchJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel job',
        variant: 'destructive',
      });
    }
  };

  const viewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const closeJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJob(null);
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case JobStatus.PROCESSING:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Processing</Badge>;
      case JobStatus.COMPLETED:
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
      case JobStatus.FAILED:
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: JobPriority) => {
    switch (priority) {
      case JobPriority.HIGH:
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">High</Badge>;
      case JobPriority.MEDIUM:
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Medium</Badge>;
      case JobPriority.LOW:
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
  };

  if (loading) {
    return <LoadingSkeleton className="h-[600px]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Job Queue Status</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshJobs} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                Pending Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingJobs}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Play className="h-4 w-4 mr-2 text-blue-500" />
                Processing Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processingJobs}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Completed Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedJobs}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Failed Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedJobs}</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {jobs && (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending ({jobs.pending.length})
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center">
              <Play className="h-4 w-4 mr-2" />
              Processing ({jobs.processing.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed ({jobs.completed.length})
            </TabsTrigger>
            <TabsTrigger value="failed" className="flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Failed ({jobs.failed.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <JobTable 
              jobs={jobs.pending} 
              onViewDetails={viewJobDetails} 
              onCancelJob={cancelJob} 
              showCancelButton={true}
            />
          </TabsContent>
          
          <TabsContent value="processing">
            <JobTable 
              jobs={jobs.processing} 
              onViewDetails={viewJobDetails} 
              onCancelJob={cancelJob} 
              showCancelButton={true}
            />
          </TabsContent>
          
          <TabsContent value="completed">
            <JobTable 
              jobs={jobs.completed} 
              onViewDetails={viewJobDetails} 
              onCancelJob={cancelJob} 
              showCancelButton={false}
            />
          </TabsContent>
          
          <TabsContent value="failed">
            <JobTable 
              jobs={jobs.failed} 
              onViewDetails={viewJobDetails} 
              onCancelJob={cancelJob} 
              showCancelButton={false}
            />
          </TabsContent>
        </Tabs>
      )}
      
      {showJobDetails && selectedJob && (
        <JobDetailsModal job={selectedJob} onClose={closeJobDetails} />
      )}
    </div>
  );
}

interface JobTableProps {
  jobs: Job[];
  onViewDetails: (job: Job) => void;
  onCancelJob: (jobId: string) => void;
  showCancelButton: boolean;
}

function JobTable({ jobs, onViewDetails, onCancelJob, showCancelButton }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No jobs found</p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-xs">{job.id.substring(0, 8)}...</TableCell>
              <TableCell>{job.type}</TableCell>
              <TableCell>{getStatusBadge(job.status)}</TableCell>
              <TableCell>{getPriorityBadge(job.priority)}</TableCell>
              <TableCell className="text-sm">
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                {job.attempts} / {job.maxAttempts}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewDetails(job)}
                  >
                    Details
                  </Button>
                  
                  {showCancelButton && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => onCancelJob(job.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getStatusBadge(status: JobStatus) {
  switch (status) {
    case JobStatus.PENDING:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
    case JobStatus.PROCESSING:
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Processing</Badge>;
    case JobStatus.COMPLETED:
      return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
    case JobStatus.FAILED:
      return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Failed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function getPriorityBadge(priority: JobPriority) {
  switch (priority) {
    case JobPriority.HIGH:
      return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">High</Badge>;
    case JobPriority.MEDIUM:
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Medium</Badge>;
    case JobPriority.LOW:
      return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Low</Badge>;
    default:
      return <Badge variant="outline">Normal</Badge>;
  }
}

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
}

function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Job Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
              <p className="font-mono">{job.id}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
              <p>{job.type}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div>{getStatusBadge(job.status)}</div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
              <div>{getPriorityBadge(job.priority)}</div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
              <p>{formatDate(job.createdAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Updated At</h3>
              <p>{formatDate(job.updatedAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Started At</h3>
              <p>{formatDate(job.startedAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Completed At</h3>
              <p>{formatDate(job.completedAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Attempts</h3>
              <p>{job.attempts} / {job.maxAttempts}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Data</h3>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
              {JSON.stringify(job.data, null, 2)}
            </pre>
          </div>
          
          {job.error && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Error</h3>
              <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md overflow-x-auto text-xs text-red-800 dark:text-red-300">
                {job.error}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
