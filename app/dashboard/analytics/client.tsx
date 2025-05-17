'use client';

import { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyticsService } from '@/lib/services/analyticsService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText, 
  FileUp, 
  Calendar, 
  Activity 
} from 'lucide-react';
import { useEffect } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { 
  LazyCrossDomainMetrics,
  LazyUserProductivityPrediction,
  LazyProjectCompletionPrediction
} from '@/components/dashboard/analytics/lazy';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface User {
  id: string;
  email: string;
}

interface Project {
  id: string;
  title: string;
  description?: string | null;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

interface DashboardAnalyticsClientProps {
  user: User;
  projects: Project[];
}

export default function DashboardAnalyticsClient({ user, projects }: DashboardAnalyticsClientProps) {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | '365'>('30');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    total_projects: number;
    active_projects: number;
    tasks_created: number;
    tasks_completed: number;
    completion_rate: number;
    notes_created: number;
    files_uploaded: number;
    total_file_size: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch user productivity metrics
      const metricsData = await analyticsService.getUserProductivityMetrics(
        user.id,
        parseInt(timeRange)
      );
      setMetrics(metricsData);

      logger.info('Fetched user analytics', { userId: user.id });
    } catch (error: any) {
      logger.error('Error fetching user analytics', { error: error.message, userId: user.id });
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for project distribution chart
  const projectDistributionData = {
    labels: ['Active Projects', 'Inactive Projects'],
    datasets: [
      {
        data: [
          metrics?.active_projects || 0,
          (metrics?.total_projects || 0) - (metrics?.active_projects || 0),
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(201, 203, 207, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(201, 203, 207, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for task completion chart
  const taskCompletionData = {
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [
          metrics?.tasks_completed || 0,
          (metrics?.tasks_created || 0) - (metrics?.tasks_completed || 0),
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for content distribution chart
  const contentDistributionData = {
    labels: ['Tasks Created', 'Notes Created', 'Files Uploaded'],
    datasets: [
      {
        data: [
          metrics?.tasks_created || 0,
          metrics?.notes_created || 0,
          metrics?.files_uploaded || 0,
        ],
        backgroundColor: [
          'rgba(53, 162, 235, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(53, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-60 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Tabs 
          defaultValue={timeRange} 
          onValueChange={(value) => setTimeRange(value as '7' | '30' | '90' | '365')}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="7">7 Days</TabsTrigger>
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
            <TabsTrigger value="365">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
              <Calendar className="mr-1 h-4 w-4 text-blue-500" />
              Total Projects
            </div>
            <div className="text-2xl font-bold">
              {metrics?.total_projects || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
              <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
              Completion Rate
            </div>
            <div className="text-2xl font-bold">
              {metrics?.completion_rate || 0}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
              <Activity className="mr-1 h-4 w-4 text-amber-500" />
              Active Projects
            </div>
            <div className="text-2xl font-bold">
              {metrics?.active_projects || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
              <FileUp className="mr-1 h-4 w-4 text-purple-500" />
              Total Storage
            </div>
            <div className="text-2xl font-bold">
              {formatFileSize(metrics?.total_file_size || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChart className="mr-2 h-5 w-5" />
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 flex items-center justify-center">
              <Doughnut data={projectDistributionData} options={doughnutChartOptions} />
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {metrics?.active_projects || 0} of {metrics?.total_projects || 0} projects active in the last {timeRange} days
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 flex items-center justify-center">
              <Doughnut data={taskCompletionData} options={doughnutChartOptions} />
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {metrics?.tasks_completed || 0} of {metrics?.tasks_created || 0} tasks completed in the last {timeRange} days
            </div>
          </CardContent>
        </Card>

        {/* Content Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2 h-5 w-5" />
              Content Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 flex items-center justify-center">
              <Bar 
                data={contentDistributionData} 
                options={{
                  ...doughnutChartOptions,
                  indexAxis: 'y' as const,
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Recent Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first project to start tracking your research.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                  <h3 className="font-medium">{project.title}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Advanced Analytics Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        
        {/* Project Activity */}
        <Suspense fallback={<LoadingSkeleton className="h-80" />}>
          <div className="grid grid-cols-1 gap-6">
            <LazyProjectCompletionPrediction projectId={projects.length > 0 ? projects[0].id : ''} />
          </div>
        </Suspense>
        
        {/* User Productivity */}
        <Suspense fallback={<LoadingSkeleton className="h-80" />}>
          <div className="grid grid-cols-1 gap-6">
            <LazyUserProductivityPrediction userId={user.id} />
          </div>
        </Suspense>
        
        {/* Cross-Domain Metrics */}
        <Suspense fallback={<LoadingSkeleton className="h-80" />}>
          <div className="grid grid-cols-1 gap-6">
            <LazyCrossDomainMetrics projectId={projects.length > 0 ? projects[0].id : ''} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
