'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  FileText, 
  Plus, 
  Trash2, 
  GripVertical, 
  BookOpen, 
  DollarSign, 
  Award, 
  BarChart2, 
  FileBarChart, 
  PieChart, 
  AlertTriangle,
  Info,
  Check,
  X
} from 'lucide-react';
import { cachedCustomReportService } from '@/lib/services/cachedCustomReportService';
import { externalDataService } from '@/lib/services/externalDataService';
import { enhancedAnalyticsService } from '@/lib/services/enhancedAnalyticsService';
import { enhancedMlPredictionService } from '@/lib/services/enhancedMlPredictionService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters.',
  }),
  description: z.string().optional(),
  template_id: z.string().optional(),
  project_id: z.string(),
  is_public: z.boolean().default(false),
});

interface EnhancedCustomReportFormProps {
  projectId: string;
}

export default function EnhancedCustomReportForm({ projectId }: EnhancedCustomReportFormProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [externalDataSources, setExternalDataSources] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      template_id: undefined,
      project_id: projectId,
      is_public: false,
    },
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get report templates
      const templatesData = await cachedCustomReportService.getReportTemplates();
      setTemplates(templatesData);
      
      // Get external data sources
      const sourcesData = await externalDataService.getExternalDataSources();
      setExternalDataSources(sourcesData);
      
      // Initialize sections
      setSections([
        {
          id: 'section-1',
          section_type: 'project_summary',
          title: 'Project Summary',
          content: null,
          external_data_source_id: null,
          display_order: 0
        }
      ]);
      
      logger.info('Loaded report form data');
    } catch (error: any) {
      logger.error('Error loading report form data', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to load report form data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleTemplateChange = async (templateId: string) => {
    try {
      if (!templateId) {
        return;
      }
      
      // Get template
      const template = await cachedCustomReportService.getReportTemplateById(templateId);
      
      if (!template) {
        return;
      }
      
      // Update form values
      form.setValue('template_id', templateId);
      form.setValue('description', template.description || '');
      
      // Update sections
      const templateSections = template.sections.map((section: any, index: number) => ({
        id: `section-${index + 1}`,
        section_type: section.type,
        title: section.title,
        content: null,
        external_data_source_id: null,
        display_order: index
      }));
      
      setSections(templateSections);
    } catch (error: any) {
      logger.error('Error applying template', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to apply template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        id: `section-${sections.length + 1}`,
        section_type: 'custom',
        title: 'New Section',
        content: null,
        external_data_source_id: null,
        display_order: sections.length
      }
    ]);
  };

  const handleRemoveSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    
    // Update display order
    newSections.forEach((section, i) => {
      section.display_order = i;
    });
    
    setSections(newSections);
  };

  const handleSectionTypeChange = (index: number, type: string) => {
    const newSections = [...sections];
    newSections[index].section_type = type;
    
    // Set default title based on type
    if (type === 'project_summary') {
      newSections[index].title = 'Project Summary';
    } else if (type === 'project_analytics') {
      newSections[index].title = 'Project Analytics';
    } else if (type === 'external_academic') {
      newSections[index].title = 'Academic Research Data';
    } else if (type === 'external_funding') {
      newSections[index].title = 'Funding Information';
    } else if (type === 'external_patent') {
      newSections[index].title = 'Patent Information';
    } else if (type === 'ml_predictions') {
      newSections[index].title = 'Predictions & Forecasts';
    }
    
    setSections(newSections);
  };

  const handleSectionTitleChange = (index: number, title: string) => {
    const newSections = [...sections];
    newSections[index].title = title;
    setSections(newSections);
  };

  const handleExternalDataSourceChange = (index: number, sourceId: string) => {
    const newSections = [...sections];
    newSections[index].external_data_source_id = sourceId;
    setSections(newSections);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update display order
    items.forEach((item, index) => {
      item.display_order = index;
    });
    
    setSections(items);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Create report
      const report = await cachedCustomReportService.createReport({
        title: values.title,
        description: values.description || '',
        template_id: values.template_id || null,
        project_id: values.project_id,
        user_id: '', // Will be set by RLS
        config: {
          sections: sections.map(section => ({
            type: section.section_type,
            title: section.title
          }))
        },
        is_public: values.is_public
      });
      
      if (!report) {
        throw new Error('Failed to create report');
      }
      
      // Create sections
      for (const section of sections) {
        await cachedCustomReportService.createReportSection({
          report_id: report.id,
          section_type: section.section_type,
          title: section.title,
          content: section.content,
          external_data_source_id: section.external_data_source_id,
          display_order: section.display_order
        });
      }
      
      // Generate report
      await cachedCustomReportService.generateReport(report.id);
      
      toast({
        title: 'Report created',
        description: 'Your report has been created successfully.',
      });
      
      // Redirect to report view
      router.push(`/dashboard/reports/${report.id}`);
    } catch (error: any) {
      logger.error('Error creating report', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to create report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionTypeIcon = (type: string) => {
    switch (type) {
      case 'project_summary':
        return <FileText className="h-4 w-4" />;
      case 'project_analytics':
        return <BarChart2 className="h-4 w-4" />;
      case 'external_academic':
        return <BookOpen className="h-4 w-4" />;
      case 'external_funding':
        return <DollarSign className="h-4 w-4" />;
      case 'external_patent':
        return <Award className="h-4 w-4" />;
      case 'ml_predictions':
        return <PieChart className="h-4 w-4" />;
      case 'custom':
        return <FileBarChart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderSectionTypeLabel = (type: string) => {
    switch (type) {
      case 'project_summary':
        return 'Project Summary';
      case 'project_analytics':
        return 'Project Analytics';
      case 'external_academic':
        return 'Academic Research Data';
      case 'external_funding':
        return 'Funding Information';
      case 'external_patent':
        return 'Patent Information';
      case 'ml_predictions':
        return 'Predictions & Forecasts';
      case 'custom':
        return 'Custom Section';
      default:
        return 'Unknown Section Type';
    }
  };

  const renderExternalDataBadge = (type: string) => {
    if (type.startsWith('external_') || type === 'ml_predictions') {
      return <Badge variant="outline" className="ml-2">External Data</Badge>;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Enhanced Report</CardTitle>
        <CardDescription>
          Create a custom report with external data sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="sections">Report Sections</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter report description"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select onValueChange={handleTemplateChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a template to pre-populate report sections
                    </FormDescription>
                  </FormItem>
                  
                  <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make report public</FormLabel>
                          <FormDescription>
                            Public reports can be viewed by all team members
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setActiveTab('sections')}>
                      Next: Configure Sections
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="sections" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Report Sections</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>External Data Integration</AlertTitle>
                    <AlertDescription>
                      Add sections with external data sources to enhance your report with academic, funding, and patent information.
                    </AlertDescription>
                  </Alert>
                  
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {sections.map((section, index) => (
                            <Draggable
                              key={section.id}
                              draggableId={section.id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="border rounded-md p-4"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mr-2 cursor-move"
                                      >
                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                      <h4 className="font-medium">Section {index + 1}</h4>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveSection(index)}
                                      disabled={sections.length === 1}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <FormLabel>Section Type</FormLabel>
                                        <Select
                                          value={section.section_type}
                                          onValueChange={(value) => handleSectionTypeChange(index, value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="project_summary">
                                              <div className="flex items-center">
                                                <FileText className="h-4 w-4 mr-2" />
                                                <span>Project Summary</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="project_analytics">
                                              <div className="flex items-center">
                                                <BarChart2 className="h-4 w-4 mr-2" />
                                                <span>Project Analytics</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="external_academic">
                                              <div className="flex items-center">
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                <span>Academic Research Data</span>
                                                <Badge variant="outline" className="ml-2">External</Badge>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="external_funding">
                                              <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 mr-2" />
                                                <span>Funding Information</span>
                                                <Badge variant="outline" className="ml-2">External</Badge>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="external_patent">
                                              <div className="flex items-center">
                                                <Award className="h-4 w-4 mr-2" />
                                                <span>Patent Information</span>
                                                <Badge variant="outline" className="ml-2">External</Badge>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="ml_predictions">
                                              <div className="flex items-center">
                                                <PieChart className="h-4 w-4 mr-2" />
                                                <span>Predictions & Forecasts</span>
                                                <Badge variant="outline" className="ml-2">ML</Badge>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="custom">
                                              <div className="flex items-center">
                                                <FileBarChart className="h-4 w-4 mr-2" />
                                                <span>Custom Section</span>
                                              </div>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      
                                      <div>
                                        <FormLabel>Section Title</FormLabel>
                                        <Input
                                          value={section.title}
                                          onChange={(e) => handleSectionTitleChange(index, e.target.value)}
                                          placeholder="Enter section title"
                                        />
                                      </div>
                                    </div>
                                    
                                    {(section.section_type.startsWith('external_')) && (
                                      <div>
                                        <FormLabel>External Data Source</FormLabel>
                                        <Select
                                          value={section.external_data_source_id || ''}
                                          onValueChange={(value) => handleExternalDataSourceChange(index, value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a data source" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="">Auto-select best source</SelectItem>
                                            {externalDataSources
                                              .filter(source => {
                                                if (section.section_type === 'external_academic') {
                                                  return source.source_type === 'academic_database';
                                                } else if (section.section_type === 'external_funding') {
                                                  return source.source_type === 'funding_database';
                                                } else if (section.section_type === 'external_patent') {
                                                  return source.source_type === 'patent_database';
                                                }
                                                return true;
                                              })
                                              .map((source) => (
                                                <SelectItem key={source.id} value={source.id}>
                                                  {source.name}
                                                </SelectItem>
                                              ))
                                            }
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('basic')}>
                      Back: Basic Information
                    </Button>
                    <Button type="button" onClick={() => setActiveTab('preview')}>
                      Next: Preview
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-2">{form.getValues('title') || 'Untitled Report'}</h3>
                    <p className="text-muted-foreground mb-4">{form.getValues('description') || 'No description'}</p>
                    
                    <Separator className="my-4" />
                    
                    <h4 className="font-medium mb-2">Sections</h4>
                    <div className="space-y-2">
                      {sections.map((section, index) => (
                        <div key={section.id} className="flex items-center p-2 border rounded-md">
                          <div className="mr-2">
                            {renderSectionTypeIcon(section.section_type)}
                          </div>
                          <div>
                            <div className="font-medium">{section.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              {renderSectionTypeLabel(section.section_type)}
                              {renderExternalDataBadge(section.section_type)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <div className="flex items-center mr-4">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Total Sections: {sections.length}</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span>External Data Sections: {sections.filter(s => s.section_type.startsWith('external_') || s.section_type === 'ml_predictions').length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Report Generation</AlertTitle>
                    <AlertDescription>
                      When you create this report, the system will automatically gather data from all selected sources, including external data, and generate the report content.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('sections')}>
                      Back: Configure Sections
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating Report...' : 'Create Report'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
