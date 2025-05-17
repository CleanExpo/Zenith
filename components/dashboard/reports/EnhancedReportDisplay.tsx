'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Share2, 
  Printer, 
  BookOpen, 
  DollarSign, 
  Award, 
  BarChart2, 
  FileBarChart, 
  PieChart, 
  Calendar,
  RefreshCw,
  Info,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { cachedCustomReportService } from '@/lib/services/cachedCustomReportService';
import { externalDataService } from '@/lib/services/externalDataService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';

interface EnhancedReportDisplayProps {
  reportId: string;
}

export default function EnhancedReportDisplay({ reportId }: EnhancedReportDisplayProps) {
  const [report, setReport] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('report');
  const [copiedLink, setCopiedLink] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const loadReport = async () => {
    try {
      setIsLoading(true);
      
      // Get report
      const reportData = await cachedCustomReportService.getReportById(reportId);
      setReport(reportData);
      
      // Get report sections
      const sectionsData = await cachedCustomReportService.getReportSections(reportId);
      setSections(sectionsData);
      
      logger.info('Loaded report data', { reportId });
    } catch (error: any) {
      logger.error('Error loading report data', { error: error.message, reportId });
      toast({
        title: 'Error',
        description: 'Failed to load report data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Regenerate report
      await cachedCustomReportService.generateReport(reportId);
      
      // Reload report data
      await loadReport();
      
      toast({
        title: 'Report refreshed',
        description: 'The report has been refreshed with the latest data.',
      });
    } catch (error: any) {
      logger.error('Error refreshing report', { error: error.message, reportId });
      toast({
        title: 'Error',
        description: 'Failed to refresh report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const url = await cachedCustomReportService.exportReport(reportId, format);
      
      if (url) {
        // Open the URL in a new tab
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to generate export URL');
      }
    } catch (error: any) {
      logger.error('Error exporting report', { error: error.message, reportId, format });
      toast({
        title: 'Error',
        description: `Failed to export report as ${format.toUpperCase()}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      // Get shareable link
      const shareUrl = window.location.origin + `/dashboard/reports/${reportId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      
      toast({
        title: 'Link copied',
        description: 'Report link has been copied to clipboard.',
      });
    } catch (error: any) {
      logger.error('Error sharing report', { error: error.message, reportId });
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const renderSectionIcon = (type: string) => {
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

  const renderExternalDataBadge = (type: string) => {
    if (type.startsWith('external_') || type === 'ml_predictions') {
      return <Badge variant="outline" className="ml-2">External Data</Badge>;
    }
    return null;
  };

  const renderSectionContent = (section: any) => {
    if (!section.content) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No content available for this section.</p>
        </div>
      );
    }

    // For sections with external data, render with special formatting
    if (section.section_type.startsWith('external_') || section.section_type === 'ml_predictions') {
      return (
        <div className="space-y-4">
          {section.content.source_info && (
            <div className="bg-muted/30 p-3 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Data from {section.content.source_info.name}
                </span>
              </div>
              {section.content.source_info.url && (
                <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                  <a href={section.content.source_info.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    <span className="text-xs">Source</span>
                  </a>
                </Button>
              )}
            </div>
          )}
          
          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: section.content.html || section.content }} />
          
          {section.content.last_updated && (
            <div className="text-xs text-muted-foreground mt-2">
              Last updated: {format(parseISO(section.content.last_updated), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      );
    }

    // For regular sections, just render the content
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: section.content }} />
    );
  };

  const renderReportTab = () => {
    if (!report || !sections.length) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No report data available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8 print:space-y-6">
        {/* Report Header */}
        <div className="print:hidden">
          <h1 className="text-2xl font-bold">{report.title}</h1>
          {report.description && (
            <p className="text-muted-foreground mt-2">{report.description}</p>
          )}
          <div className="flex items-center text-sm text-muted-foreground mt-4">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Generated on {format(parseISO(report.updated_at), 'MMMM d, yyyy')}</span>
          </div>
        </div>
        
        {/* Print-only header */}
        <div className="hidden print:block">
          <h1 className="text-2xl font-bold">{report.title}</h1>
          {report.description && (
            <p className="text-gray-600 mt-2">{report.description}</p>
          )}
          <div className="flex items-center text-sm text-gray-500 mt-4">
            <span>Generated on {format(parseISO(report.updated_at), 'MMMM d, yyyy')}</span>
          </div>
        </div>
        
        <Separator className="print:hidden" />
        
        {/* Report Sections */}
        <div className="space-y-8 print:space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-4 print:break-inside-avoid">
              <div className="flex items-center">
                <div className="mr-2 print:text-black">
                  {renderSectionIcon(section.section_type)}
                </div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <div className="print:hidden">
                  {renderExternalDataBadge(section.section_type)}
                </div>
              </div>
              
              <div className="pl-6">
                {renderSectionContent(section)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMetadataTab = () => {
    if (!report) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No report metadata available.</p>
        </div>
      );
    }

    // Count external data sections
    const externalDataSections = sections.filter(
      section => section.section_type.startsWith('external_') || section.section_type === 'ml_predictions'
    ).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Report Details</h3>
            <div className="bg-muted/50 p-4 rounded-md space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Title</div>
                <div>{report.title}</div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Description</div>
                <div>{report.description || 'No description'}</div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div>{format(parseISO(report.created_at), 'MMMM d, yyyy')}</div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Last Updated</div>
                <div>{format(parseISO(report.updated_at), 'MMMM d, yyyy')}</div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Visibility</div>
                <div className="flex items-center">
                  {report.is_public ? (
                    <Badge variant="outline" className="mr-2">Public</Badge>
                  ) : (
                    <Badge variant="outline" className="mr-2">Private</Badge>
                  )}
                  {report.is_public ? 'Visible to all team members' : 'Only visible to you'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Content Summary</h3>
            <div className="bg-muted/50 p-4 rounded-md space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Total Sections</div>
                <div>{sections.length}</div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">External Data Sections</div>
                <div>{externalDataSections}</div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Section Types</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Array.from(new Set(sections.map(s => s.section_type))).map(type => (
                    <Badge key={type as string} variant="outline" className="flex items-center">
                      {renderSectionIcon(type as string)}
                      <span className="ml-1 capitalize">{(type as string).replace(/_/g, ' ').replace('external ', '')}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">External Data Sources</div>
                <div>
                  {sections.some(s => s.section_type.startsWith('external_') || s.section_type === 'ml_predictions') ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {sections
                        .filter(s => s.section_type.startsWith('external_') || s.section_type === 'ml_predictions')
                        .filter(s => s.content && s.content.source_info)
                        .map((s, index) => (
                          <Badge key={index} variant="outline">
                            {s.content.source_info.name}
                          </Badge>
                        ))}
                    </div>
                  ) : (
                    'No external data sources'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Section Details</h3>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div key={section.id} className="bg-muted/30 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {renderSectionIcon(section.section_type)}
                    </div>
                    <div className="font-medium">{section.title}</div>
                    {renderExternalDataBadge(section.section_type)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Section {index + 1}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  Type: <span className="capitalize">{section.section_type.replace(/_/g, ' ')}</span>
                </div>
                
                {section.external_data_source_id && (
                  <div className="text-xs text-muted-foreground mt-1">
                    External Data Source ID: {section.external_data_source_id}
                  </div>
                )}
                
                {section.content && section.content.source_info && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Source: {section.content.source_info.name}
                    {section.content.source_info.url && (
                      <a 
                        href={section.content.source_info.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-primary hover:underline"
                      >
                        View Source
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">
                {isLoading ? <Skeleton className="h-6 w-48" /> : report?.title || 'Report'}
              </CardTitle>
              <CardDescription>
                {isLoading ? <Skeleton className="h-4 w-64 mt-1" /> : report?.description || 'Enhanced report with external data'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 print:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isLoading || isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare} 
                disabled={isLoading}
                className="h-8 px-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    <span className="text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Share</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleExport('pdf')} 
                disabled={isLoading}
                className="h-8 px-2"
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="text-xs">PDF</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrint} 
                disabled={isLoading}
                className="h-8 px-2"
              >
                <Printer className="h-4 w-4 mr-1" />
                <span className="text-xs">Print</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="report" value={activeTab} onValueChange={setActiveTab} className="print:hidden">
              <TabsList className="mb-4">
                <TabsTrigger value="report">Report</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
              <TabsContent value="report">
                {renderReportTab()}
              </TabsContent>
              <TabsContent value="metadata">
                {renderMetadataTab()}
              </TabsContent>
            </Tabs>
          )}
          
          {/* Print-only content */}
          <div className="hidden print:block">
            {renderReportTab()}
          </div>
        </CardContent>
        <CardFooter className="pt-1 print:hidden">
          <div className="text-xs text-muted-foreground">
            {report && (
              <>
                Created by {report.user_id} • Last updated: {format(parseISO(report.updated_at), 'MMM d, yyyy')}
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
