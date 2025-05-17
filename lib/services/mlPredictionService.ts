import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface MLModel {
  id: string;
  name: string;
  description: string;
  model_type: string;
  parameters: any;
  training_metrics: any;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MLPrediction {
  id: string;
  model_id: string;
  entity_type: string;
  entity_id: string;
  prediction_type: string;
  prediction_value: any;
  confidence_score: number;
  explanation: any;
  features_used: any;
  created_at: string;
  updated_at: string;
}

export interface ProjectMLCompletionPrediction {
  prediction_id: string;
  project_id: string;
  predicted_completion_date: string;
  confidence_score: number;
  explanation: any;
  features_used: any;
  created_at: string;
  updated_at: string;
  model_name: string;
  model_type: string;
  model_version: string;
}

export interface UserMLProductivityPrediction {
  prediction_id: string;
  user_id: string;
  productivity_score: string;
  estimated_tasks_per_week: string;
  confidence_score: number;
  explanation: any;
  features_used: any;
  created_at: string;
  updated_at: string;
  model_name: string;
  model_type: string;
  model_version: string;
}

export interface MLPredictionResult {
  success: boolean;
  message?: string;
  prediction?: any;
  confidence_score?: number;
  explanation?: any;
}

export class MLPredictionService {
  private supabase = createClient();

  /**
   * Get all ML models
   */
  async getModels(modelType?: string): Promise<MLModel[]> {
    try {
      let query = this.supabase
        .from('ml_models')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (modelType) {
        query = query.eq('model_type', modelType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting ML models', { error: error.message, modelType });
      return [];
    }
  }

  /**
   * Get active ML model by type
   */
  async getActiveModel(modelType: string): Promise<MLModel | null> {
    try {
      const { data, error } = await this.supabase
        .from('ml_models')
        .select('*')
        .eq('model_type', modelType)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting active ML model', { error: error.message, modelType });
      return null;
    }
  }

  /**
   * Generate ML-based project completion prediction
   */
  async generateProjectCompletionPrediction(projectId: string): Promise<MLPredictionResult> {
    try {
      const { data, error } = await this.supabase.rpc(
        'generate_ml_project_completion_prediction',
        { p_project_id: projectId }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error generating ML project completion prediction', { error: error.message, projectId });
      return { success: false, message: error.message };
    }
  }

  /**
   * Get latest ML-based project completion prediction
   */
  async getLatestProjectCompletionPrediction(projectId: string): Promise<ProjectMLCompletionPrediction | null> {
    try {
      const { data, error } = await this.supabase
        .from('project_ml_completion_predictions')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting latest ML project completion prediction', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Generate ML-based user productivity prediction
   */
  async generateUserProductivityPrediction(): Promise<MLPredictionResult> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await this.supabase.rpc(
        'generate_ml_user_productivity_prediction',
        { p_user_id: user.user.id }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error generating ML user productivity prediction', { error: error.message });
      return { success: false, message: error.message };
    }
  }

  /**
   * Get latest ML-based user productivity prediction
   */
  async getLatestUserProductivityPrediction(): Promise<UserMLProductivityPrediction | null> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await this.supabase
        .from('user_ml_productivity_predictions')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting latest ML user productivity prediction', { error: error.message });
      return null;
    }
  }

  /**
   * Get ML prediction history for a project
   */
  async getProjectPredictionHistory(projectId: string, limit: number = 10): Promise<ProjectMLCompletionPrediction[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_ml_completion_predictions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting project prediction history', { error: error.message, projectId });
      return [];
    }
  }

  /**
   * Get ML prediction history for the current user
   */
  async getUserPredictionHistory(limit: number = 10): Promise<UserMLProductivityPrediction[]> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await this.supabase
        .from('user_ml_productivity_predictions')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting user prediction history', { error: error.message });
      return [];
    }
  }

  /**
   * Compare ML predictions with actual outcomes for a project
   * This is useful for evaluating the accuracy of the ML models
   */
  async compareProjectPredictionsWithActual(projectId: string): Promise<any> {
    try {
      // Get prediction history
      const predictions = await this.getProjectPredictionHistory(projectId);
      
      // Get actual project data
      const { data: project, error: projectError } = await this.supabase
        .from('research_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        throw projectError;
      }
      
      // Get task completion data
      const { data: tasks, error: tasksError } = await this.supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId);
      
      if (tasksError) {
        throw tasksError;
      }
      
      // Calculate actual metrics
      const completedTasks = tasks?.filter(task => task.completed) || [];
      const totalTasks = tasks?.length || 0;
      const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
      
      // Calculate average task completion time
      let avgCompletionTime = 0;
      if (completedTasks.length > 0) {
        const completionTimes = completedTasks.map(task => {
          const createdAt = new Date(task.created_at);
          const updatedAt = new Date(task.updated_at);
          return (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24); // days
        });
        avgCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completedTasks.length;
      }
      
      // Compare predictions with actual data
      const comparisonResults = predictions.map(prediction => {
        const predictedDate = new Date(prediction.predicted_completion_date);
        const now = new Date();
        
        // If project is completed, compare with actual completion date
        // Otherwise, compare with current progress
        const comparison = {
          prediction_id: prediction.prediction_id,
          predicted_completion_date: prediction.predicted_completion_date,
          confidence_score: prediction.confidence_score,
          created_at: prediction.created_at,
          actual_completion_rate: completionRate,
          actual_avg_completion_time: avgCompletionTime,
          is_accurate: null as boolean | null,
          difference_days: null as number | null
        };
        
        // If all tasks are completed, we can determine accuracy
        if (completionRate === 1) {
          const lastTaskCompletionDate = new Date(Math.max(...completedTasks.map(t => new Date(t.updated_at).getTime())));
          comparison.is_accurate = Math.abs(predictedDate.getTime() - lastTaskCompletionDate.getTime()) < (7 * 24 * 60 * 60 * 1000); // within 7 days
          comparison.difference_days = Math.round((predictedDate.getTime() - lastTaskCompletionDate.getTime()) / (24 * 60 * 60 * 1000));
        }
        
        return comparison;
      });
      
      return {
        project_id: projectId,
        project_title: project.title,
        total_tasks: totalTasks,
        completed_tasks: completedTasks.length,
        completion_rate: completionRate,
        avg_completion_time: avgCompletionTime,
        predictions: comparisonResults
      };
    } catch (error: any) {
      logger.error('Error comparing project predictions with actual', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get ML model performance metrics
   * This aggregates the accuracy of predictions across all projects
   */
  async getModelPerformanceMetrics(modelType: string): Promise<any> {
    try {
      // Get the active model
      const activeModel = await this.getActiveModel(modelType);
      
      if (!activeModel) {
        throw new Error(`No active model found for type: ${modelType}`);
      }
      
      // For project completion predictions
      if (modelType === 'project_completion') {
        // Get all predictions made by this model
        const { data: predictions, error: predictionsError } = await this.supabase
          .from('ml_predictions')
          .select('*')
          .eq('model_id', activeModel.id)
          .eq('entity_type', 'project')
          .eq('prediction_type', 'completion_date');
        
        if (predictionsError) {
          throw predictionsError;
        }
        
        // Group predictions by project
        const projectPredictions: Record<string, any[]> = {};
        predictions?.forEach(prediction => {
          if (!projectPredictions[prediction.entity_id]) {
            projectPredictions[prediction.entity_id] = [];
          }
          projectPredictions[prediction.entity_id].push(prediction);
        });
        
        // Analyze accuracy for each project
        const projectResults = await Promise.all(
          Object.keys(projectPredictions).map(async projectId => {
            return await this.compareProjectPredictionsWithActual(projectId);
          })
        );
        
        // Calculate overall metrics
        const accurateCount = projectResults.reduce((count, result) => {
          if (!result) return count;
          const accuratePredictions = result.predictions.filter((p: any) => p.is_accurate === true);
          return count + accuratePredictions.length;
        }, 0);
        
        const totalEvaluatedCount = projectResults.reduce((count, result) => {
          if (!result) return count;
          const evaluatedPredictions = result.predictions.filter((p: any) => p.is_accurate !== null);
          return count + evaluatedPredictions.length;
        }, 0);
        
        const accuracy = totalEvaluatedCount > 0 ? accurateCount / totalEvaluatedCount : 0;
        
        return {
          model_id: activeModel.id,
          model_name: activeModel.name,
          model_version: activeModel.version,
          model_type: activeModel.model_type,
          total_predictions: predictions?.length || 0,
          evaluated_predictions: totalEvaluatedCount,
          accurate_predictions: accurateCount,
          accuracy: accuracy,
          projects_analyzed: projectResults.filter(r => r !== null).length
        };
      }
      
      // For user productivity predictions
      // Similar implementation would go here
      
      return null;
    } catch (error: any) {
      logger.error('Error getting model performance metrics', { error: error.message, modelType });
      return null;
    }
  }
}

export const mlPredictionService = new MLPredictionService();
