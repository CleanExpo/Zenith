'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Clock, AlertTriangle, CheckCircle, BarChart, RefreshCw, Info, Brain } from 'lucide-react';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { mlPredictionService, ProjectMLCompletionPrediction } from '@/lib/services/mlPredictionService';
import { logger } from '@/lib/logger';

interface MLProjectCompletionPredictionProps {
  projectId: string;
}

export default function MLProjectCompletionPrediction({ projectId }: MLProjectCompletionPredictionProps) {
  const [prediction, setPrediction] = useState<ProjectMLCompletionPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const loadPrediction = async () => {
    try {
      setIsLoading(true);
      const data = await mlPredictionService.getLatestProjectCompletionPrediction(projectId);
      setPrediction(data);
      logger.info('Loaded ML project completion prediction', { projectId });
    } catch (error: any) {
      logger.error('Error loading ML project completion prediction', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const result = await mlPredictionService.generateProjectCompletionPrediction(projectId);
      
      if (result.success) {
        await loadPrediction();
      }
    } catch (error: any) {
      logger.error('Error refreshing ML project completion prediction', { error: error.message });
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

  const renderExplanation = () => {
    if (!prediction?.explanation) return null;
    
    const factors = prediction.explanation.factors || {};
    const weights = prediction.explanation.importance_weights || {};
    
    return (
      <div className="mt-4 space-y-3 bg-muted/50 p-3 rounded-md text-sm">
        <h4 className="font-medium">Prediction Factors</h4>
        
        <div className="space-y-2">
          {factors.task_completion_rate !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span>Task Completion Rate</span>
                <span className="font-medium">{Math.round(factors.task_completion_rate * 100)}%</span>
              </div>
              <Progress value={factors.task_completion_rate * 100} className="h-1" />
              <div className="text-xs text-muted-foreground mt-1">
                Weight: {Math.round(weights.task_completion_rate * 100)}%
              </div>
            </div>
          )}
          
          {factors.avg_task_completion_time !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span>Avg. Task Completion Time</span>
                <span className="font-medium">{factors.avg_task_completion_time.toFixed(1)} days</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Weight: {Math.round(weights.avg_task_completion_time * 100)}%
              </div>
            </div>
          )}
          
          {factors.project_complexity && (
            <div>
              <div className="flex justify-between mb-1">
                <span>Project Complexity</span>
                <span className="font-medium">
                  {factors.project_complexity.task_count} tasks, {factors.project_complexity.collaborator_count} collaborators
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Weight: {Math.round(weights.project_complexity * 100)}%
              </div>
            </div>
          )}
          
          {factors.activity_level !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span>Activity Level</span>
                <span className="font-medium">{factors.activity_level.toFixed(1)} actions/day</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Weight: {Math.round(weights.activity_level * 100)}%
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>This prediction is based on machine learning analysis of your project's task completion patterns, complexity, and activity levels.</p>
        </div>
      </div>
    );
  };

  const statusInfo = prediction ? getStatusInfo() : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            ML Completion Prediction
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
            <p>No ML prediction available yet.</p>
            <p className="text-sm mt-2">Generate a prediction to see ML-based completion forecast.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="mt-4"
            >
              Generate Prediction
            </Button>
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
                      <span className="text-sm mr-2">ML Confidence:</span>
                      <Badge variant="outline" className={`${getConfidenceColor(prediction.confidence_score)} text-white`}>
                        {getConfidenceLabel(prediction.confidence_score)}
                      </Badge>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ML confidence score: {Math.round(prediction.confidence_score * 100)}%</p>
                    <p className="text-xs mt-1">Based on machine learning analysis of project data</p>
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
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Model: {prediction.model_name}</span>
              <span className="text-sm text-muted-foreground">v{prediction.model_version}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full text-sm justify-start px-0"
            >
              <Info className="h-4 w-4 mr-2" />
              {showExplanation ? 'Hide explanation' : 'Show explanation'}
            </Button>
            
            {showExplanation && renderExplanation()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
