'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  BarChart2, 
  PieChart as PieChartIcon,
  Award,
  BookOpen,
  DollarSign,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { enhancedMlPredictionService } from '@/lib/services/enhancedMlPredictionService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, differenceInDays } from 'date-fns';

interface MLProjectCompletionPredictionEnhancedProps {
  projectId: string;
}

export default function MLProjectCompletionPredictionEnhanced({ projectId }: MLProjectCompletionPredictionEnhancedProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('prediction');
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const loadPrediction = async () => {
    try {
      setIsLoading(true);
      
      // Get prediction with external data
      const predictionData = await enhancedMlPredictionService.predictProjectCompletionWithExternalData(projectId);
      setPrediction(predictionData);
      
      // Get comparison with standard prediction
      const comparisonData = await enhancedMlPredictionService.compareProjectCompletionPredictions(projectId);
      setComparison(comparisonData);
      
      // Get features
      const featuresData = await enhancedMlPredictionService.getProjectMlExternalFeatures(projectId);
      setFeatures(featuresData);
      
      // Get ML insights
      const insightsData = await enhancedMlPredictionService.getProjectMlInsights(projectId);
      setInsights(insightsData);
      
      logger.info('Loaded ML prediction with external data', { projectId });
    } catch (error: any) {
      logger.error('Error loading ML prediction with external data', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to load ML prediction with external data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Extract features from external data
      await enhancedMlPredictionService.extractMlFeaturesFromExternalData(projectId);
      
      // Reload prediction
      await loadPrediction();
      
      toast({
        title: 'Prediction refreshed',
        description: 'ML prediction with external data has been refreshed successfully.',
      });
    } catch (error: any) {
      logger.error('Error refreshing ML prediction with external data', { error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to refresh ML prediction with external data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, [projectId]);

  const renderPredictionTab = () => {
    if (!prediction) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No prediction available.</p>
        </div>
      );
    }

    const completionDate = parseISO(prediction.predicted_completion_date);
    const daysRemaining = prediction.predicted_completion_days;
    const confidencePercentage = prediction.confidence * 100;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Predicted Completion Date</span>
            </div>
            <div className="text-2xl font-medium">
              {format(completionDate, 'MMM d, yyyy')}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Days Remaining</span>
            </div>
            <div className="text-2xl font-medium">
              {daysRemaining}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <BarChart2 className="h-4 w-4 mr-1" />
              <span>Prediction Confidence</span>
            </div>
            <div className="text-2xl font-medium">
              {confidencePercentage.toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={Object.entries(prediction.feature_importance).map(([name, value]) => ({
              feature: name.replace(/_/g, ' '),
              importance: value
            }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="feature" />
              <PolarRadiusAxis angle={30} domain={[0, 1]} />
              <Radar name="Feature Importance" dataKey="importance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-md">
          <div className="flex items-center text-sm font-medium mb-2">
            <Info className="h-4 w-4 mr-1" />
            <span>Prediction Details</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This prediction is based on both internal project metrics and external data sources, including academic citations, funding information, and patent data. The model has a confidence level of {confidencePercentage.toFixed(1)}%, which indicates {confidencePercentage > 75 ? 'high' : confidencePercentage > 50 ? 'moderate' : 'low'} reliability.
          </p>
        </div>
      </div>
    );
  };

  const renderComparisonTab = () => {
    if (!comparison) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No comparison data available.</p>
        </div>
      );
    }

    const standardPrediction = comparison.standard_prediction;
    const enhancedPrediction = comparison.enhanced_prediction;
    
    if (!standardPrediction || !enhancedPrediction) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>Incomplete comparison data. Both standard and enhanced predictions are required.</p>
        </div>
      );
    }

    const standardDate = parseISO(standardPrediction.predicted_completion_date);
    const enhancedDate = parseISO(enhancedPrediction.predicted_completion_date);
    const dateDifference = differenceInDays(enhancedDate, standardDate);
    const improvementPercentage = comparison.improvement_percentage;

    // Prepare chart data
    const comparisonData = [
      { name: 'Standard Model', days: standardPrediction.predicted_completion_days },
      { name: 'Enhanced Model', days: enhancedPrediction.predicted_completion_days }
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center space-x-4 p-4 bg-muted/30 rounded-md">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Standard Prediction</div>
            <div className="text-xl font-medium">{format(standardDate, 'MMM d, yyyy')}</div>
            <div className="text-sm text-muted-foreground mt-1">{standardPrediction.predicted_completion_days} days</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`text-sm ${improvementPercentage > 0 ? 'text-green-500' : improvementPercentage < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {improvementPercentage > 0 ? (
                <CheckCircle className="h-8 w-8" />
              ) : improvementPercentage < 0 ? (
                <AlertTriangle className="h-8 w-8" />
              ) : (
                <Info className="h-8 w-8" />
              )}
            </div>
            <div className={`text-sm font-medium ${improvementPercentage > 0 ? 'text-green-500' : improvementPercentage < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {improvementPercentage > 0 ? (
                `${Math.abs(improvementPercentage).toFixed(1)}% faster`
              ) : improvementPercentage < 0 ? (
                `${Math.abs(improvementPercentage).toFixed(1)}% slower`
              ) : (
                'No change'
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.abs(dateDifference)} days {dateDifference > 0 ? 'later' : 'earlier'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Enhanced Prediction</div>
            <div className="text-xl font-medium">{format(enhancedDate, 'MMM d, yyyy')}</div>
            <div className="text-sm text-muted-foreground mt-1">{enhancedPrediction.predicted_completion_days} days</div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="days" fill="#8884d8" name="Predicted Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-md">
          <div className="flex items-center text-sm font-medium mb-2">
            <Info className="h-4 w-4 mr-1" />
            <span>Comparison Analysis</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {improvementPercentage > 10 ? (
              'The enhanced model with external data significantly improves prediction accuracy, suggesting a faster completion time. External factors like funding and academic citations are positively influencing the project timeline.'
            ) : improvementPercentage > 0 ? (
              'The enhanced model with external data shows a modest improvement in prediction accuracy. External factors are having a small positive effect on the project timeline.'
            ) : improvementPercentage < -10 ? (
              'The enhanced model with external data indicates a significantly longer completion time. This suggests that external factors like academic complexity or patent requirements are adding substantial complexity to the project.'
            ) : improvementPercentage < 0 ? (
              'The enhanced model with external data suggests a slightly longer completion time. External factors are adding some complexity to the project that wasn\'t captured in the standard model.'
            ) : (
              'The enhanced model with external data shows a similar completion time to the standard model. External factors don\'t appear to significantly impact the project timeline.'
            )}
          </p>
        </div>
      </div>
    );
  };

  const renderFeaturesTab = () => {
    if (features.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No feature data available.</p>
        </div>
      );
    }

    // Group features by source
    const groupedFeatures: Record<string, any[]> = {};
    features.forEach(feature => {
      if (!groupedFeatures[feature.feature_source]) {
        groupedFeatures[feature.feature_source] = [];
      }
      groupedFeatures[feature.feature_source].push(feature);
    });

    // Prepare chart data
    const featureData = features.map(feature => ({
      name: feature.feature_name.replace(/_/g, ' '),
      value: feature.feature_value,
      importance: feature.feature_importance || 0
    }));

    return (
      <div className="space-y-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={featureData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="Feature Value" />
              <Bar yAxisId="right" dataKey="importance" fill="#82ca9d" name="Importance" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Features by Source */}
        {Object.entries(groupedFeatures).map(([source, sourceFeatures]) => (
          <div key={source} className="space-y-3">
            <h3 className="text-sm font-medium capitalize">{source.replace(/_/g, ' ')} Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sourceFeatures.map(feature => (
                <div key={feature.id} className="bg-muted/50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
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
                      <span>{feature.feature_name.replace(/_/g, ' ')}</span>
                    </div>
                    {feature.feature_importance && (
                      <Badge variant="outline" className="ml-2">
                        {(feature.feature_importance * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-medium">
                    {feature.feature_name.includes('funding') || feature.feature_name.includes('amount') ? (
                      `$${new Intl.NumberFormat().format(feature.feature_value)}`
                    ) : feature.feature_name.includes('ratio') || feature.feature_name.includes('rate') ? (
                      `${(feature.feature_value * 100).toFixed(1)}%`
                    ) : (
                      feature.feature_value.toFixed(feature.feature_value % 1 === 0 ? 0 : 2)
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

  const renderInsightsTab = () => {
    if (!insights || !insights.insights) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No insights available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Top Features */}
        {insights.top_features && insights.top_features.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Top Influential Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.top_features.map((feature: any, index: number) => (
                <div key={index} className="bg-muted/50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{feature.name.replace(/_/g, ' ')}</div>
                    <Badge variant={index === 0 ? 'default' : 'outline'}>
                      {(feature.importance * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${feature.importance * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Insights */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">ML Insights</h3>
          <div className="space-y-4">
            {insights.insights.map((insight: any, index: number) => (
              <div key={index} className="bg-muted/30 p-4 rounded-md">
                <div className="flex items-center text-sm font-medium mb-2">
                  {insight.type === 'feature_importance' ? (
                    <BarChart2 className="h-4 w-4 mr-1" />
                  ) : insight.type === 'prediction_improvement' ? (
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  ) : insight.type === 'prediction_degradation' ? (
                    <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                  ) : insight.type === 'high_citations' ? (
                    <BookOpen className="h-4 w-4 mr-1" />
                  ) : insight.type === 'high_funding' ? (
                    <DollarSign className="h-4 w-4 mr-1" />
                  ) : insight.type === 'has_patents' ? (
                    <Award className="h-4 w-4 mr-1" />
                  ) : (
                    <Info className="h-4 w-4 mr-1" />
                  )}
                  <span>{insight.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
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
              <TrendingUp className="mr-2 h-5 w-5" />
              Enhanced ML Prediction
            </CardTitle>
            <CardDescription>
              Project completion prediction with external data
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
          <Tabs defaultValue="prediction" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="prediction" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Prediction
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Comparison
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center">
                <PieChartIcon className="h-4 w-4 mr-2" />
                Features
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
            </TabsList>
            <TabsContent value="prediction">
              {renderPredictionTab()}
            </TabsContent>
            <TabsContent value="comparison">
              {renderComparisonTab()}
            </TabsContent>
            <TabsContent value="features">
              {renderFeaturesTab()}
            </TabsContent>
            <TabsContent value="insights">
              {renderInsightsTab()}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="pt-1">
        <div className="text-xs text-muted-foreground">
          Model version: {prediction?.model_version || 'Unknown'} • Last updated: {prediction?.prediction_date ? format(parseISO(prediction.prediction_date), 'MMM d, yyyy') : 'Never'}
        </div>
      </CardFooter>
    </Card>
  );
}
