'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, FileText, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cachedAdvancedAnalyticsService } from '@/lib/services/cachedAdvancedAnalyticsService';
import { CustomReport } from '@/lib/services/advancedAnalyticsService';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { MultiSelect } from '@/components/ui/multi-select';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  reportType: z.enum(['project_progress', 'user_productivity', 'project_comparison']),
  projectId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  projectIds: z.array(z.string()).optional(),
  schedule: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Project {
  id: string;
  title: string;
}

interface CustomReportFormProps {
  projects: Project[];
  onSuccess?: (report: CustomReport) => void;
  onCancel?: () => void;
  initialData?: CustomReport;
}

export default function CustomReportForm({ 
  projects, 
  onSuccess, 
  onCancel,
  initialData 
}: CustomReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Parse initial data if provided
  const defaultValues: Partial<FormValues> = initialData ? {
    title: initialData.title,
    description: initialData.description || '',
    reportType: initialData.report_type,
    projectId: initialData.report_type === 'project_progress' ? initialData.parameters.project_id : undefined,
    startDate: initialData.report_type === 'user_productivity' ? new Date(initialData.parameters.start_date) : undefined,
    endDate: initialData.report_type === 'user_productivity' ? new Date(initialData.parameters.end_date) : undefined,
    projectIds: initialData.report_type === 'project_comparison' ? initialData.parameters.project_ids : undefined,
    schedule: initialData.schedule,
  } : {
    title: '',
    description: '',
    reportType: 'project_progress',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const reportType = form.watch('reportType');

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Prepare parameters based on report type
      let parameters: any = {};
      
      if (values.reportType === 'project_progress') {
        if (!values.projectId) {
          form.setError('projectId', { message: 'Project is required for this report type' });
          return;
        }
        parameters = { project_id: values.projectId };
      } else if (values.reportType === 'user_productivity') {
        if (!values.startDate || !values.endDate) {
          if (!values.startDate) form.setError('startDate', { message: 'Start date is required' });
          if (!values.endDate) form.setError('endDate', { message: 'End date is required' });
          return;
        }
        parameters = {
          start_date: values.startDate.toISOString(),
          end_date: values.endDate.toISOString(),
        };
      } else if (values.reportType === 'project_comparison') {
        if (!values.projectIds || values.projectIds.length < 2) {
          form.setError('projectIds', { message: 'Select at least 2 projects to compare' });
          return;
        }
        parameters = { project_ids: values.projectIds };
      }
      
      let result: CustomReport | null;
      
      if (initialData) {
        // Update existing report
        result = await cachedAdvancedAnalyticsService.updateCustomReport(initialData.id, {
          title: values.title,
          description: values.description,
          parameters,
          schedule: values.schedule,
        });
        
        if (result) {
          toast({
            title: 'Report updated',
            description: 'Your custom report has been updated successfully.',
          });
        }
      } else {
        // Create new report
        result = await cachedAdvancedAnalyticsService.createCustomReport(
          values.title,
          values.reportType,
          parameters,
          values.description,
          values.schedule
        );
        
        if (result) {
          toast({
            title: 'Report created',
            description: 'Your custom report has been created successfully.',
          });
        }
      }
      
      if (result && onSuccess) {
        onSuccess(result);
      }
      
      logger.info(initialData ? 'Updated custom report' : 'Created custom report', { reportId: result?.id });
    } catch (error: any) {
      logger.error('Error saving custom report', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to save report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter report title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter a description for this report" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="reportType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!initialData} // Disable changing report type for existing reports
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="project_progress">
                    <div className="flex items-center">
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>Project Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user_productivity">
                    <div className="flex items-center">
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>User Productivity</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="project_comparison">
                    <div className="flex items-center">
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>Project Comparison</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {reportType === 'project_progress' && 'Detailed analysis of a single project\'s progress and metrics'}
                {reportType === 'user_productivity' && 'Analysis of your productivity across all projects'}
                {reportType === 'project_comparison' && 'Compare metrics across multiple projects'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Project selection for project_progress report type */}
        {reportType === 'project_progress' && (
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{project.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Date range for user_productivity report type */}
        {reportType === 'user_productivity' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || (form.getValues('endDate') ? date > form.getValues('endDate') : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || (form.getValues('startDate') ? date < form.getValues('startDate') : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        {/* Multiple project selection for project_comparison report type */}
        {reportType === 'project_comparison' && (
          <FormField
            control={form.control}
            name="projectIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projects to Compare</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={projects.map(project => ({
                      label: project.title,
                      value: project.id
                    }))}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select projects to compare"
                  />
                </FormControl>
                <FormDescription>
                  Select at least 2 projects to compare their metrics
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initialData ? 'Update Report' : 'Create Report'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
