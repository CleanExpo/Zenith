'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsService, ProjectActivity } from '@/lib/services/analyticsService';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity,
  Calendar
} from 'lucide-react';
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
import { Line } from 'react-chartjs-2';

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

interface AdvancedAnalyticsProps {
  userId: string;
}

export default function AdvancedAnalytics({ userId }: AdvancedAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | '365'>('30');
  const [isLoading, setIsLoading] = useState(true);
  const [activityData, setActivityData] = useState<ProjectActivity[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivityData();
  }, [timeRange, userId]);

  const fetchActivityData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Get all projects for the user
      const { data: projects } = await supabase
        .from('research_projects')
        .select('id')
        .eq('user_id', userId);
      
      if (!projects || projects.length === 0) {
        setActivityData([]);
        return;
      }
      
      // Fetch activity data for the first project (as an example)
      // In a real implementation, you might aggregate data from all projects
      const projectId = projects[0].id;
      const data = await analyticsService.getProjectActivity(
        projectId,
        parseInt(timeRange)
      );
      
      setActivityData(data);
      logger.info('Fetched project activity data', { userId, projectId });
    } catch (error: any) {
      logger.error('Error fetching project activity data', { error: error.message, userId });
      toast({
        title: 'Error',
        description: 'Failed to load activity data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for activity chart
  const activityChartData = {
    labels: activityData.map(item => {
      const date = new Date(item.activity_date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Tasks Created',
        data: activityData.map(item => item.tasks_created),
        borderColor: 'rgba(53, 162, 235, 1)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Tasks Completed',
        data: activityData.map(item => item.tasks_completed),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Notes Created',
        data: activityData.map(item => item.notes_created),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Files Uploaded',
        data: activityData.map(item => item.files_uploaded),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
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
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="mr-2 h-5 w-5" />
            Project Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="mr-2 h-5 w-5" />
          Project Activity
        </CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Line data={activityChartData} options={lineChartOptions} />
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Project activity over the last {timeRange} days
        </div>
      </CardContent>
    </Card>
  );
}
