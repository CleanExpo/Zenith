'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyticsService, ProjectProgress, ProjectActivity } from '@/lib/services/analyticsService';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, parseISO, subDays } from 'date-fns';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  FileText, 
  FileUp, 
  BarChart3, 
  PieChart, 
  TrendingUp 
} from 'lucide-react';

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

interface ProjectAnalyticsProps {
  projectId: string;
}

export default function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [activity, setActivity] = useState<ProjectActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | '90'>('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [projectId, timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch project progress
      const progressData = await analyticsService.getProjectProgress(projectId);
      setProgress(progressData);

      // Fetch project activity
      const activityData = await analyticsService.getProjectActivity(projectId, parseInt(timeRange));
      setActivity(activityData);

      logger.info('Fetched project analytics', { projectId });
    } catch (error: any) {
      logger.error('Error fetching project analytics', { error: error.message, projectId });
      toast({
        title: 'Error',
        description: 'Failed to load project analytics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for activity chart
  const activityChartData = {
    labels: activity.map(item => format(new Date(item.activity_date), 'MMM dd')),
    datasets: [
      {
        label: 'Tasks Created',
        data: activity.map(item => item.tasks_created),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Tasks Completed',
        data: activity.map(item => item.tasks_completed),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Notes Created',
        data: activity.map(item => item.notes_created),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      },
      {
        label: 'Files Uploaded',
        data: activity.map(item => item.files_uploaded),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      },
    ],
  };

  // Prepare data for task completion chart
  const taskCompletionData = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [
          progress?.completed_tasks || 0,
          (progress?.total_tasks || 0) - (progress?.completed_tasks || 0),
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
    labels: ['Tasks', 'Notes', 'Files'],
    datasets: [
      {
        data: [
          progress?.total_tasks || 0,
          progress?.total_notes || 0,
          progress?.total_files || 0,
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
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Project Activity Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-60 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
              <div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Project Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                Completion Rate
              </div>
              <div className="text-2xl font-bold">
                {progress?.completion_percentage || 0}%
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                <Clock className="mr-1 h-4 w-4 text-red-500" />
                Overdue Tasks
              </div>
              <div className="text-2xl font-bold">
                {progress?.overdue_tasks || 0}
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                <FileText className="mr-1 h-4 w-4 text-blue-500" />
                Total Notes
              </div>
              <div className="text-2xl font-bold">
                {progress?.total_notes || 0}
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                <FileUp className="mr-1 h-4 w-4 text-purple-500" />
                Total Files
              </div>
              <div className="text-2xl font-bold">
                {progress?.total_files || 0}
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex justify-end">
            <Tabs 
              defaultValue={timeRange} 
              onValueChange={(value) => setTimeRange(value as '7' | '14' | '30' | '90')}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="7">7 Days</TabsTrigger>
                <TabsTrigger value="14">14 Days</TabsTrigger>
                <TabsTrigger value="30">30 Days</TabsTrigger>
                <TabsTrigger value="90">90 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Activity Chart */}
          <div className="bg-card border rounded-md p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Activity Timeline
            </h3>
            <div className="h-60">
              <Line data={activityChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Completion Chart */}
            <div className="bg-card border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Task Completion
              </h3>
              <div className="h-60 flex items-center justify-center">
                <Doughnut data={taskCompletionData} options={doughnutChartOptions} />
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {progress?.completed_tasks || 0} of {progress?.total_tasks || 0} tasks completed
              </div>
            </div>

            {/* Content Distribution Chart */}
            <div className="bg-card border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Content Distribution
              </h3>
              <div className="h-60 flex items-center justify-center">
                <Bar 
                  data={contentDistributionData} 
                  options={{
                    ...doughnutChartOptions,
                    indexAxis: 'y' as const,
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
