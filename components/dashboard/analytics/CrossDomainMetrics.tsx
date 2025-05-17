'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
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
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Award, 
  BookOpen, 
  FileText, 
  BarChart2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cachedEnhancedAnalyticsService } from '@/lib/services/cachedEnhancedAnalyticsService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';

interface CrossDomainMetricsProps {
  projectId: string;
}

export default function CrossDomainMetrics({ projectId }: CrossDomainMetricsProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [fundingEfficiency, setFundingEfficiency] = useState<any>(null);
  const [patentImpact, setPatentImpact] = useState<any>(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Get cross-domain metrics
      const metricsData = await cachedEnhancedAnalyticsService.getProjectCrossDomainMetrics(projectId);
      setMetrics(metricsData);
      
      // Get funding efficiency
      const efficiencyData = await cachedEnhancedAnalyticsService.calculateFundingEfficiency(projectId);
      setFundingEfficiency(efficiencyData);
      
      // Get patent impact
      const impactData = await cachedEnhancedAnalyticsService.getPatentImpactScore(projectId);
      setPatentImpact(impactData);
      
      // Get correlation analysis
      const correlationData = await cachedEnhancedAnalyticsService.getMetricCorrelationAnalysis(projectId);
      setCorrelationAnalysis(correlationData);
      
      logger.info('Loaded cross-domain metrics', { projectId });
    } catch (error: any) {
      logger.error('Error loading cross-domain metrics', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to load cross-domain metrics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Calculate cross-domain metrics
      await cachedEnhancedAnalyticsService.calculateCrossDomainMetrics(projectId);
      
      // Reload metrics
      await loadMetrics();
      
      toast({
        title: 'Metrics refreshed',
        description: 'Cross-domain metrics have been refreshed successfully.',
      });
    } catch (error: any) {
      logger.error('Error refreshing cross-domain metrics', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to refresh cross-domain metrics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [projectId]);

  const renderMetricsTab = () => {
    if (metrics.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No cross-domain metrics available.</p>
        </div>
      );
    }

    // Group metrics by source
    const groupedMetrics: Record<string, any[]> = {};
    metrics.forEach(metric => {
      const source = metric.metadata?.source || 'unknown';
      if (!groupedMetrics[source]) {
        groupedMetrics[source] = [];
      }
      groupedMetrics[source].push(metric);
    });

    // Prepare chart data
    const chartData = metrics
      .filter(metric => !metric.metric_name.includes('_ratio') && !metric.metric_name.includes('_per_'))
      .map(metric => ({
        name: metric.metric_name.replace(/_/g, ' '),
        value: metric.metric_value
      }));

    return (
      <div className="space-y-6">
        {/* Metrics Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics by Source */}
        {Object.entries(groupedMetrics).map(([source, sourceMetrics]) => (
          <div key={source} className="space-y-3">
            <h3 className="text-sm font-medium capitalize">{source.replace(/_/g, ' ')} Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sourceMetrics.map(metric => (
                <div key={metric.id} className="bg-muted/50 p-4 rounded-md">
                  <div className="flex items-center text-sm text-muted-foreground mb-1 capitalize">
                    {source === 'academic' ? (
                      <BookOpen className="h-4 w-4 mr-1" />
                    ) : source === 'funding' ? (
                      <DollarSign className="h-4 w-4 mr-1" />
                    ) : source === 'patent' ? (
                      <Award className="h-4 w-4 mr-1" />
                    ) : (
                      <FileText className="h-4 w-4 mr-1" />
                    )}
                    <span>{metric.metric_name.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-2xl font-medium">
                    {metric.metric_name.includes('funding') || metric.metric_name.includes('amount') ? (
                      `$${new Intl.NumberFormat().format(metric.metric_value)}`
                    ) : metric.metric_name.includes('ratio') || metric.metric_name.includes('rate') ? (
                      `${(metric.metric_value * 100).toFixed(1)}%`
                    ) : (
                      metric.metric_value.toFixed(metric.metric_value % 1 === 0 ? 0 : 2)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEfficiencyTab = () => {
    if (!fundingEfficiency) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No funding efficiency data available.</p>
        </div>
      );
    }

    // Prepare chart data
    const efficiencyData = [
      { name: 'Funding', value: fundingEfficiency.total_funding },
      { name: 'Completion', value: fundingEfficiency.completion_percentage }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Total Funding</span>
            </div>
            <div className="text-2xl font-medium">
              ${new Intl.NumberFormat().format(fundingEfficiency.total_funding)}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Completion Percentage</span>
            </div>
            <div className="text-2xl font-medium">
              {fundingEfficiency.completion_percentage.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <BarChart2 className="h-4 w-4 mr-1" />
              <span>Efficiency Ratio</span>
            </div>
            <div className="text-2xl font-medium">
              {(fundingEfficiency.efficiency_ratio * 100).toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={efficiencyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {efficiencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => new Intl.NumberFormat().format(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-md">
          <div className="flex items-center text-sm font-medium mb-2">
            <Info className="h-4 w-4 mr-1" />
            <span>Efficiency Analysis</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The efficiency ratio measures how effectively funding is being converted into project progress.
            {fundingEfficiency.efficiency_ratio > 0.0001 ? (
              ' This project is showing good efficiency in utilizing its funding.'
            ) : (
              ' This project may need to improve how funding is being utilized to drive progress.'
            )}
          </p>
        </div>
      </div>
    );
  };

  const renderPatentTab = () => {
    if (!patentImpact) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No patent impact data available.</p>
        </div>
      );
    }

    // Prepare chart data
    const patentData = [
      { name: 'Patents', value: patentImpact.total_patents },
      { name: 'Citations', value: patentImpact.citations }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Award className="h-4 w-4 mr-1" />
              <span>Total Patents</span>
            </div>
            <div className="text-2xl font-medium">
              {patentImpact.total_patents}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4 mr-1" />
              <span>Citations</span>
            </div>
            <div className="text-2xl font-medium">
              {patentImpact.citations}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Impact Score</span>
            </div>
            <div className="text-2xl font-medium">
              {patentImpact.impact_score.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={patentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-md">
          <div className="flex items-center text-sm font-medium mb-2">
            <Info className="h-4 w-4 mr-1" />
            <span>Patent Impact Analysis</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The patent impact score measures the influence of patents associated with this project.
            {patentImpact.impact_score > 1 ? (
              ' This project has high-impact patents with significant citation counts.'
            ) : patentImpact.impact_score > 0 ? (
              ' This project has patents with moderate impact in the field.'
            ) : (
              ' This project has patents but they have not yet accumulated significant citations.'
            )}
          </p>
        </div>
      </div>
    );
  };

  const renderCorrelationTab = () => {
    if (!correlationAnalysis || !correlationAnalysis.correlations) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No correlation analysis available.</p>
        </div>
      );
    }

    // Prepare chart data
    const correlationData = correlationAnalysis.correlations.map((corr: any) => ({
      name: `${corr.internal_metric} / ${corr.external_metric}`,
      value: corr.correlation
    }));

    return (
      <div className="space-y-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={correlationData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[-1, 1]} />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip formatter={(value) => (value as number).toFixed(2)} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Correlation" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Correlation Insights</h3>
          <div className="space-y-2">
            {correlationAnalysis.correlations.map((corr: any, index: number) => (
              <div key={index} className="bg-muted/30 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {corr.internal_metric} / {corr.external_metric}
                  </div>
                  <Badge variant={
                    corr.significance === 'high' ? 'default' : 
                    corr.significance === 'medium' ? 'secondary' : 
                    'outline'
                  }>
                    {corr.significance}
                  </Badge>
                </div>
                <div className="text-sm mt-1">
                  Correlation: {corr.correlation.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {corr.interpretation}
                </div>
              </div>
            ))}
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
              <BarChart2 className="mr-2 h-5 w-5" />
              Cross-Domain Metrics
            </CardTitle>
            <CardDescription>
              Advanced analytics combining internal and external data
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
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : (
          <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="metrics" className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="efficiency" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Funding Efficiency
              </TabsTrigger>
              <TabsTrigger value="patent" className="flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Patent Impact
              </TabsTrigger>
              <TabsTrigger value="correlation" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Correlations
              </TabsTrigger>
            </TabsList>
            <TabsContent value="metrics">
              {renderMetricsTab()}
            </TabsContent>
            <TabsContent value="efficiency">
              {renderEfficiencyTab()}
            </TabsContent>
            <TabsContent value="patent">
              {renderPatentTab()}
            </TabsContent>
            <TabsContent value="correlation">
              {renderCorrelationTab()}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
