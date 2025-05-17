'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Clock, AlertTriangle, CheckCircle, BarChart, RefreshCw, Info } from 'lucide-react';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { cachedAdvancedAnalyticsService } from '@/lib/services/cachedAdvancedAnalyticsService';
import { ProjectCompletionPrediction as PredictionType } from '@/lib/services/advancedAnalyticsService';
import { logger } from '@/lib/logger';

interface ProjectCompletionPredictionProps {
  projectId: string;
}

export default function ProjectCompletionPrediction({ projectId }: ProjectCompletionPredictionProps) {
  const [prediction, setPrediction] = useState<PredictionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPrediction = async () => {
    try {
      setIsLoading(true);
      const data = await cachedAdvancedAnalyticsService.getProjectCompletionPrediction(projectId);
      setPrediction(data);
      logger.info('Loaded project completion prediction', { projectId });
    } catch (error: any) {
      logger.error('Error loading project completion prediction', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadPrediction();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, [projectId]);

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusInfo = () => {
    if (!prediction?.predicted_completion_date) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        label: 'Insufficient Data',
        description: 'Add more tasks to improve prediction accuracy',
        color: 'text-amber-500'
      };
    }

    const predictionDate = new Date(prediction.predicted_completion_date);
    const now = new Date();
    const twoWeeksFromNow = addDays(now, 14);

    if (isBefore(predictionDate, now)) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        label: 'Overdue',
        description: `Predicted completion was ${formatDistanceToNow(predictionDate, { addSuffix: true })}`,
        color: 'text-red-500'
      };
    }

    if (isBefore(predictionDate, twoWeeksFromNow)) {
      return {
        icon: <Clock className="h-5 w-5 text-amber-500" />,
        label: 'Approaching',
        description: `Predicted to complete ${formatDistanceToNow(predictionDate, { addSuffix: true })}`,
        color: 'text-amber-500'
      };
    }

    return {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      label: 'On Track',
      description: `Predicted to complete ${formatDistanceToNow(predictionDate, { addSuffix: true })}`,
      color: 'text-green-500'
    };
  };

  const statusInfo = prediction ? getStatusInfo() : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <div className="flex items-center">
            <BarChart className="mr-2 h-5 w-5" />
            Completion Prediction
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !prediction ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No prediction available yet.</p>
            <p className="text-sm mt-2">Add tasks to your project to generate a prediction.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {statusInfo?.icon}
                <span className={`ml-2 font-medium ${statusInfo?.color}`}>{statusInfo?.label}</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      <span className="text-sm mr-2">Confidence:</span>
                      <Badge variant="outline" className={`${getConfidenceColor(prediction.confidence_score)} text-white`}>
                        {getConfidenceLabel(prediction.confidence_score)}
                      </Badge>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Confidence score: {Math.round(prediction.confidence_score * 100)}%</p>
                    <p className="text-xs mt-1">Based on task completion patterns and project history</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">{statusInfo?.description}</p>
              
              {prediction.predicted_completion_date && (
                <div className="mt-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(prediction.predicted_completion_date), 'PPP')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Task Completion</span>
                <span>{prediction.factors.completed_tasks} of {prediction.factors.total_tasks} tasks</span>
              </div>
              <Progress 
                value={prediction.factors.total_tasks > 0 
                  ? (prediction.factors.completed_tasks / prediction.factors.total_tasks) * 100 
                  : 0
                } 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground block">Avg. Task Time</span>
                <span className="font-medium">
                  {prediction.factors.avg_completion_time_days.toFixed(1)} days
                </span>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground block">Completion Rate</span>
                <span className="font-medium">
                  {Math.round(prediction.factors.completion_rate * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
