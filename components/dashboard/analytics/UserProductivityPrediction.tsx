'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, 
  RefreshCw, 
  Info, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart
} from 'lucide-react';
import { mlPredictionService, UserMLProductivityPrediction } from '@/lib/services/mlPredictionService';
import { logger } from '@/lib/logger';

export default function UserProductivityPrediction() {
  const [prediction, setPrediction] = useState<UserMLProductivityPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState<UserMLProductivityPrediction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadPrediction = async () => {
    try {
      setIsLoading(true);
      const data = await mlPredictionService.getLatestUserProductivityPrediction();
      setPrediction(data);
      logger.info('Loaded ML user productivity prediction');
    } catch (error: any) {
      logger.error('Error loading ML user productivity prediction', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPredictionHistory = async () => {
    try {
      const data = await mlPredictionService.getUserPredictionHistory(5);
      setPredictionHistory(data);
      logger.info('Loaded ML user productivity prediction history');
    } catch (error: any) {
      logger.error('Error loading ML user productivity prediction history', { error: error.message });
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const result = await mlPredictionService.generateUserProductivityPrediction();
      
      if (result.success) {
        await loadPrediction();
        await loadPredictionHistory();
      }
    } catch (error: any) {
      logger.error('Error refreshing ML user productivity prediction', { error: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrediction();
    loadPredictionHistory();
  }, []);

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500' };
    if (score >= 60) return { label: 'Good', color: 'text-emerald-500' };
    if (score >= 40) return { label: 'Average', color: 'text-amber-500' };
    if (score >= 20) return { label: 'Below Average', color: 'text-orange-500' };
    return { label: 'Low', color: 'text-red-500' };
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
                <span className="font-medium">{factors.avg_task_completion_time?.toFixed(1) || 'N/A'} days</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Weight: {Math.round(weights.avg_task_completion_time * 100)}%
              </div>
            </div>
          )}
          
          {factors.activity_level !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span>Activity Level</span>
                <span className="font-medium">{factors.activity_level} actions</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Weight: {Math.round(weights.activity_level * 100)}%
              </div>
            </div>
          )}
          
          {factors.project_engagement !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span>Project Engagement</span>
                <span className="font-medium">{factors.project_engagement} projects</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Weight: {Math.round(weights.project_engagement * 100)}%
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>This prediction is based on machine learning analysis of your task completion patterns, activity levels, and project engagement over the past 30 days.</p>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (!predictionHistory.length) return null;
    
    // Skip the first one since it's already displayed as the current prediction
    const history = predictionHistory.slice(1);
    
    if (!history.length) {
      return (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          No previous predictions available.
        </div>
      );
    }
    
    return (
      <div className="mt-4 space-y-3">
        <h4 className="font-medium text-sm">Previous Predictions</h4>
        
        <div className="space-y-2">
          {history.map((item) => {
            const date = new Date(item.created_at);
            const productivityScore = parseFloat(item.productivity_score);
            const tasksPerWeek = parseFloat(item.estimated_tasks_per_week);
            
            return (
              <div key={item.prediction_id} className="bg-muted/30 p-2 rounded-md text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge variant="outline">
                    {getProductivityLevel(productivityScore).label}
                  </Badge>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Productivity Score:</span>
                  <span className="font-medium">{Math.round(productivityScore)}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Tasks/Week:</span>
                  <span className="font-medium">{tasksPerWeek.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            ML Productivity Prediction
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
        <CardDescription>
          AI-powered analysis of your productivity patterns
        </CardDescription>
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
            <p className="text-sm mt-2">Generate a prediction to see ML-based productivity forecast.</p>
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
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-3xl font-bold">
                    {Math.round(parseFloat(prediction.productivity_score))}
                  </div>
                </div>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    strokeOpacity="0.1" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    strokeDasharray={`${2 * Math.PI * 45 * parseFloat(prediction.productivity_score) / 100} ${2 * Math.PI * 45}`} 
                    strokeDashoffset={2 * Math.PI * 45 * 0.25} 
                    className={getProductivityLevel(parseFloat(prediction.productivity_score)).color}
                  />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <Badge className={`${getProductivityLevel(parseFloat(prediction.productivity_score)).color} bg-opacity-10`}>
                  {getProductivityLevel(parseFloat(prediction.productivity_score)).label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Productivity Score</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Tasks per Week</span>
                </div>
                <div className="text-xl font-medium">
                  {parseFloat(prediction.estimated_tasks_per_week).toFixed(1)}
                </div>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <BarChart className="h-4 w-4 mr-1" />
                  <span>Confidence</span>
                </div>
                <div className="text-xl font-medium">
                  {Math.round(prediction.confidence_score * 100)}%
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Model: {prediction.model_name}</span>
              <span className="text-muted-foreground">v{prediction.model_version}</span>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex-1 text-sm justify-center"
              >
                <Info className="h-4 w-4 mr-2" />
                {showExplanation ? 'Hide factors' : 'Show factors'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="flex-1 text-sm justify-center"
              >
                <Clock className="h-4 w-4 mr-2" />
                {showHistory ? 'Hide history' : 'Show history'}
              </Button>
            </div>
            
            {showExplanation && renderExplanation()}
            {showHistory && renderHistory()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
