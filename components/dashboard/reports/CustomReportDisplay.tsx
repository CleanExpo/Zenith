'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart as BarChartIcon, 
  RefreshCw, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Trash2,
  Edit
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cachedAdvancedAnalyticsService } from '@/lib/services/cachedAdvancedAnalyticsService';
import { CustomReport, ReportResult } from '@/lib/services/advancedAnalyticsService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface CustomReportDisplayProps {
  report: CustomReport;
  onEdit?: (report: CustomReport) => void;
  onDelete?: (reportId: string) => void;
}

export default function CustomReportDisplay({ 
  report, 
  onEdit, 
  onDelete 
}: CustomReportDisplayProps) {
  const [result, setResult] = useState<ReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('data');
  const { toast } = useToast();

  const loadReportResult = async () => {
    try {
      setIsLoading(true);
      const data = await cachedAdvancedAnalyticsService.getLatestReportResult(report.id);
      
      if (!data) {
        // If no result exists, run the report
        const newResult = await cachedAdvancedAnalyticsService.runCustomReport(report.id);
        // Fetch the result again
        const updatedData = await cachedAdvancedAnalyticsService.getLatestReportResult(report.id);
        setResult(updatedData);
      } else {
        setResult(data);
      }
      
      logger.info('Loaded report result', { reportId: report.id });
    } catch (error: any) {
      logger.error('Error loading report result', { error: error.message, reportId: report.id });
      toast({
        title: 'Error',
        description: 'Failed to load report result. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await cachedAdvancedAnalyticsService.runCustomReport(report.id);
      await loadReportResult();
      
      toast({
        title: 'Report refreshed',
        description: 'The report has been refreshed with the latest data.',
      });
    } catch (error: any) {
      logger.error('Error refreshing report', { error: error.message, reportId: report.id });
      toast({
        title: 'Error',
        description: 'Failed to refresh report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    try {
      const success = await cachedAdvancedAnalyticsService.deleteCustomReport(report.id);
      
      if (success) {
        toast({
          title: 'Report deleted',
          description: 'The report has been deleted successfully.',
        });
        
        if (onDelete) {
          onDelete(report.id);
        }
      }
    } catch (error: any) {
      logger.error('Error deleting report', { error: error.message, reportId: report.id });
      toast({
        title: 'Error',
        description: 'Failed to delete report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(report);
    }
  };

  const handleExport = () => {
    if (!result) return;
    
    try {
      // Create a JSON blob and download it
      const dataStr = JSON.stringify(result.result_data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Report exported',
        description: 'The report has been exported as JSON.',
      });
    } catch (error: any) {
      logger.error('Error exporting report', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadReportResult();
  }, [report.id]);

  // Render different visualizations based on report type
  const renderVisualization = () => {
    if (!result || !result.result_data) return null;
    
    if (report.report_type === 'project_progress') {
      const data = result.result_data;
      const taskStats = data.task_stats || { total: 0, completed: 0, pending: 0, overdue: 0 };
      const contentStats = data.content_stats || { notes: 0, files: 0 };
      
      // Task completion pie chart data
      const taskCompletionData = [
        { name: 'Completed', value: taskStats.completed, color: '#22c55e' },
        { name: 'Pending', value: taskStats.pending, color: '#f59e0b' },
        { name: 'Overdue', value: taskStats.overdue, color: '#ef4444' },
      ];
      
      // Content distribution bar chart data
      const contentDistributionData = [
        { name: 'Tasks', value: taskStats.total },
        { name: 'Notes', value: contentStats.notes },
        { name: 'Files', value: contentStats.files },
      ];
      
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Task Completion</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskCompletionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {taskCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Content Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {data.prediction && (
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2">Completion Prediction</h3>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {data.prediction.predicted_completion_date 
                    ? format(new Date(data.prediction.predicted_completion_date), 'PPP')
                    : 'Not available'}
                </span>
                <Badge className="ml-2" variant="outline">
                  {data.prediction.confidence_score 
                    ? `${Math.round(data.prediction.confidence_score * 100)}% confidence`
                    : 'Unknown confidence'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    if (report.report_type === 'user_productivity') {
      const data = result.result_data;
      const taskStats = data.task_stats || { created: 0, completed: 0, completion_rate: 0 };
      const contentStats = data.content_stats || { notes: 0, files: 0, comments: 0 };
      const activityStats = data.activity_stats || { total: 0, by_type: {} };
      
      // Activity by type chart data
      const activityByTypeData = Object.entries(activityStats.by_type || {}).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number,
      }));
      
      // Content creation chart data
      const contentCreationData = [
        { name: 'Tasks', value: taskStats.created },
        { name: 'Notes', value: contentStats.notes },
        { name: 'Files', value: contentStats.files },
        { name: 'Comments', value: contentStats.comments },
      ];
      
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Activity by Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityByTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {activityByTypeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'][index % 5]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} actions`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Content Creation</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentCreationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2">Task Completion Rate</h3>
              <div className="text-2xl font-bold">
                {taskStats.completion_rate 
                  ? `${Math.round(taskStats.completion_rate * 100)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {taskStats.completed} of {taskStats.created} tasks completed
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2">Total Activities</h3>
              <div className="text-2xl font-bold">
                {activityStats.total || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                During the selected time period
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (report.report_type === 'project_comparison') {
      const data = result.result_data;
      const projects = data.projects || [];
      
      // Task completion comparison data
      const taskCompletionData = projects.map((project: any) => ({
        name: project.title,
        completed: project.task_stats.completed,
        pending: project.task_stats.total - project.task_stats.completed,
      }));
      
      // Content comparison data
      const contentComparisonData = projects.map((project: any) => ({
        name: project.title,
        notes: project.content_stats.notes,
        files: project.content_stats.files,
        comments: project.content_stats.comments,
      }));
      
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Task Completion Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#22c55e" name="Completed Tasks" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Content Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="notes" fill="#3b82f6" name="Notes" />
                  <Bar dataKey="files" fill="#8b5cf6" name="Files" />
                  <Bar dataKey="comments" fill="#ec4899" name="Comments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No visualization available for this report type.</p>
      </div>
    );
  };

  // Render raw data
  const renderRawData = () => {
    if (!result || !result.result_data) return null;
    
    return (
      <div className="bg-muted/50 p-4 rounded-md overflow-auto max-h-[500px]">
        <pre className="text-xs">{JSON.stringify(result.result_data, null, 2)}</pre>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChartIcon className="mr-2 h-5 w-5" />
              {report.title}
            </CardTitle>
            {report.description && (
              <CardDescription>{report.description}</CardDescription>
            )}
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isLoading || isRefreshing}
              className="h-8 w-8 p-0"
              title="Refresh report"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExport} 
              disabled={isLoading || !result}
              className="h-8 w-8 p-0"
              title="Export as JSON"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleEdit} 
              className="h-8 w-8 p-0"
              title="Edit report"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)} 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Delete report"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Badge variant="outline" className="mr-2">
            {report.report_type === 'project_progress' ? 'Project Progress' : 
             report.report_type === 'user_productivity' ? 'User Productivity' : 
             'Project Comparison'}
          </Badge>
          {result && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last updated: {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !result ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>No report data available.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="mt-2"
            >
              Generate Report
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="visualization" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="data">Raw Data</TabsTrigger>
            </TabsList>
            <TabsContent value="visualization">
              {renderVisualization()}
            </TabsContent>
            <TabsContent value="data">
              {renderRawData()}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report
              and all its results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
