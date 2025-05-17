'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  RefreshCw, 
  BookOpen, 
  DollarSign, 
  Award, 
  ExternalLink, 
  Info, 
  FileText, 
  Calendar, 
  Users, 
  BarChart,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { externalDataService } from '@/lib/services/externalDataService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';

interface ProjectExternalDataProps {
  projectId: string;
}

export default function ProjectExternalData({ projectId }: ProjectExternalDataProps) {
  const [externalData, setExternalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('academic');
  const { toast } = useToast();

  const loadExternalData = async () => {
    try {
      setIsLoading(true);
      const data = await externalDataService.getProjectCombinedExternalData(projectId);
      setExternalData(data);
      logger.info('Loaded project external data', { projectId });
    } catch (error: any) {
      logger.error('Error loading project external data', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to load external data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await externalDataService.enrichProjectFromAllSources(projectId);
      await loadExternalData();
      
      toast({
        title: 'Data refreshed',
        description: 'External data has been refreshed successfully.',
      });
    } catch (error: any) {
      logger.error('Error refreshing project external data', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to refresh external data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadExternalData();
  }, [projectId]);

  const renderAcademicData = () => {
    if (!externalData?.academic) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No academic data available.</p>
        </div>
      );
    }

    const academicData = externalData.academic.data;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4 mr-1" />
              <span>Citations</span>
            </div>
            <div className="text-2xl font-medium">{academicData.citations || 0}</div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <BookOpen className="h-4 w-4 mr-1" />
              <span>Publications</span>
            </div>
            <div className="text-2xl font-medium">{academicData.publications || 0}</div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <BarChart className="h-4 w-4 mr-1" />
              <span>h-index</span>
            </div>
            <div className="text-2xl font-medium">{academicData.h_index || 0}</div>
          </div>
        </div>
        
        {academicData.research_areas && academicData.research_areas.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Research Areas</h3>
            <div className="flex flex-wrap gap-2">
              {academicData.research_areas.map((area: string, index: number) => (
                <Badge key={index} variant="secondary">{area}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {academicData.recent_publications && academicData.recent_publications.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Recent Publications</h3>
            <div className="space-y-3">
              {academicData.recent_publications.map((pub: any, index: number) => (
                <div key={index} className="bg-muted/30 p-3 rounded-md">
                  <div className="font-medium">{pub.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {pub.journal}, {pub.year}
                  </div>
                  {pub.authors && (
                    <div className="text-sm mt-1">
                      {pub.authors.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>Data sourced from Academic Research Database</span>
          </div>
          <div className="mt-1">
            Last updated: {format(new Date(externalData.academic.updated_at), 'PPP')}
          </div>
        </div>
      </div>
    );
  };

  const renderFundingData = () => {
    if (!externalData?.funding) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No funding data available.</p>
        </div>
      );
    }

    const fundingData = externalData.funding.data;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Total Funding</span>
            </div>
            <div className="text-2xl font-medium">
              ${new Intl.NumberFormat().format(fundingData.total_funding || 0)}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4 mr-1" />
              <span>Active Grants</span>
            </div>
            <div className="text-2xl font-medium">{fundingData.active_grants || 0}</div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <BarChart className="h-4 w-4 mr-1" />
              <span>Success Rate</span>
            </div>
            <div className="text-2xl font-medium">
              {fundingData.success_rate ? `${Math.round(fundingData.success_rate * 100)}%` : 'N/A'}
            </div>
          </div>
        </div>
        
        {fundingData.funding_sources && fundingData.funding_sources.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Funding Sources</h3>
            <div className="space-y-3">
              {fundingData.funding_sources.map((source: any, index: number) => (
                <div key={index} className="bg-muted/30 p-3 rounded-md">
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm mt-1">
                    ${new Intl.NumberFormat().format(source.amount || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {source.start_date} to {source.end_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>Data sourced from Research Funding Database</span>
          </div>
          <div className="mt-1">
            Last updated: {format(new Date(externalData.funding.updated_at), 'PPP')}
          </div>
        </div>
      </div>
    );
  };

  const renderPatentData = () => {
    if (!externalData?.patent) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No patent data available.</p>
        </div>
      );
    }

    const patentData = externalData.patent.data;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Award className="h-4 w-4 mr-1" />
              <span>Total Patents</span>
            </div>
            <div className="text-2xl font-medium">{patentData.total_patents || 0}</div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4 mr-1" />
              <span>Pending Patents</span>
            </div>
            <div className="text-2xl font-medium">{patentData.pending_patents || 0}</div>
          </div>
        </div>
        
        {patentData.patents && patentData.patents.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Patents</h3>
            <div className="space-y-3">
              {patentData.patents.map((patent: any, index: number) => (
                <div key={index} className="bg-muted/30 p-3 rounded-md">
                  <div className="font-medium">{patent.title}</div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-sm text-muted-foreground">
                      Filed: {patent.filing_date}
                    </div>
                    <Badge variant={patent.status === 'Granted' ? 'default' : 'outline'}>
                      {patent.status}
                    </Badge>
                  </div>
                  <div className="text-sm mt-1">
                    {patent.patent_number ? `Patent #: ${patent.patent_number}` : 
                     patent.application_number ? `Application #: ${patent.application_number}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>Data sourced from Patent Database</span>
          </div>
          <div className="mt-1">
            Last updated: {format(new Date(externalData.patent.updated_at), 'PPP')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center">
              <ExternalLink className="mr-2 h-5 w-5" />
              External Data
            </CardTitle>
            <CardDescription>
              Data from external research databases
            </CardDescription>
          </div>
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : !externalData ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load external data.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="academic" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="academic" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Academic
              </TabsTrigger>
              <TabsTrigger value="funding" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Funding
              </TabsTrigger>
              <TabsTrigger value="patent" className="flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Patents
              </TabsTrigger>
            </TabsList>
            <TabsContent value="academic">
              {renderAcademicData()}
            </TabsContent>
            <TabsContent value="funding">
              {renderFundingData()}
            </TabsContent>
            <TabsContent value="patent">
              {renderPatentData()}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
