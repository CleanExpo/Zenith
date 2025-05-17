import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { externalDataService } from './externalDataService';

export interface MlExternalFeature {
  id: string;
  project_id: string;
  feature_name: string;
  feature_value: number;
  feature_importance?: number;
  feature_source: string;
  created_at: string;
  updated_at: string;
}

export interface MlModelVersionExternal {
  id: string;
  model_name: string;
  version: string;
  training_date: string;
  accuracy: number;
  features: any;
  external_features_used: boolean;
  hyperparameters: any;
  metadata: any;
}

export interface ProjectCompletionPredictionWithExternalData {
  project_id: string;
  predicted_completion_days: number;
  predicted_completion_date: string;
  confidence: number;
  feature_importance: Record<string, number>;
  features_used: any;
  prediction_date: string;
  model_version: string;
}

export interface UserProductivityPredictionWithExternalData {
  user_id: string;
  productivity_score: number;
  confidence: number;
  external_data_summary: any;
  projects_analyzed: string[];
  prediction_date: string;
  model_version: string;
}

export class EnhancedMlPredictionService {
  private supabase = createClient();

  /**
   * Get ML external features for a project
   */
  async getProjectMlExternalFeatures(projectId: string): Promise<MlExternalFeature[]> {
    try {
      const { data, error } = await this.supabase
        .from('ml_external_features')
        .select('*')
        .eq('project_id', projectId)
        .order('feature_name');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting project ML external features', { error: error.message, projectId });
      return [];
    }
  }

  /**
   * Get ML model versions with external data
   */
  async getMlModelVersionsExternal(): Promise<MlModelVersionExternal[]> {
    try {
      const { data, error } = await this.supabase
        .from('ml_model_versions_external')
        .select('*')
        .order('training_date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting ML model versions with external data', { error: error.message });
      return [];
    }
  }

  /**
   * Extract ML features from external data
   */
  async extractMlFeaturesFromExternalData(projectId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc(
        'extract_ml_features_from_external_data',
        { p_project_id: projectId }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error extracting ML features from external data', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Predict project completion with external data
   */
  async predictProjectCompletionWithExternalData(projectId: string): Promise<ProjectCompletionPredictionWithExternalData | null> {
    try {
      // Ensure external data is up to date
      await externalDataService.enrichProjectFromAllSources(projectId);
      
      // Extract features from external data
      await this.extractMlFeaturesFromExternalData(projectId);
      
      // Make prediction
      const { data, error } = await this.supabase.rpc(
        'predict_completion_with_external_data',
        { p_project_id: projectId }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error predicting project completion with external data', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Predict user productivity with external data
   */
  async predictUserProductivityWithExternalData(userId: string): Promise<UserProductivityPredictionWithExternalData | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        'predict_user_productivity_with_external_data',
        { p_user_id: userId }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error predicting user productivity with external data', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Get feature importance for a project
   */
  async getProjectFeatureImportance(projectId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await this.supabase
        .from('ml_external_features')
        .select('feature_name, feature_importance')
        .eq('project_id', projectId)
        .not('feature_importance', 'is', null);
      
      if (error) {
        throw error;
      }
      
      const featureImportance: Record<string, number> = {};
      data.forEach(feature => {
        featureImportance[feature.feature_name] = feature.feature_importance || 0;
      });
      
      return featureImportance;
    } catch (error: any) {
      logger.error('Error getting project feature importance', { error: error.message, projectId });
      return {};
    }
  }

  /**
   * Compare project completion predictions with and without external data
   */
  async compareProjectCompletionPredictions(projectId: string): Promise<any> {
    try {
      // Get prediction with external data
      const predictionWithExternal = await this.predictProjectCompletionWithExternalData(projectId);
      
      // Get standard prediction (from existing ML prediction service)
      const { data: standardPredictions, error } = await this.supabase
        .from('ml_predictions')
        .select('*')
        .eq('project_id', projectId)
        .eq('prediction_type', 'completion_date')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      const standardPrediction = standardPredictions[0]?.prediction_data || null;
      
      // Calculate difference
      let difference = null;
      let improvementPercentage = null;
      
      if (predictionWithExternal && standardPrediction) {
        const daysWithExternal = predictionWithExternal.predicted_completion_days;
        const daysStandard = standardPrediction.predicted_completion_days;
        
        difference = daysWithExternal - daysStandard;
        improvementPercentage = ((daysStandard - daysWithExternal) / daysStandard) * 100;
      }
      
      // Get feature importance
      const featureImportance = await this.getProjectFeatureImportance(projectId);
      
      // Return comparison
      return {
        project_id: projectId,
        standard_prediction: standardPrediction,
        enhanced_prediction: predictionWithExternal,
        difference: difference,
        improvement_percentage: improvementPercentage,
        feature_importance: featureImportance,
        compared_at: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('Error comparing project completion predictions', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get ML insights for a project
   */
  async getProjectMlInsights(projectId: string): Promise<any> {
    try {
      // Get project features
      const features = await this.getProjectMlExternalFeatures(projectId);
      
      // Get feature importance
      const featureImportance = await this.getProjectFeatureImportance(projectId);
      
      // Get prediction comparison
      const predictionComparison = await this.compareProjectCompletionPredictions(projectId);
      
      // Get top features by importance
      const topFeatures = Object.entries(featureImportance)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, importance]) => ({ name, importance }));
      
      // Calculate insights
      const insights = [];
      
      // Add insights based on feature importance
      if (topFeatures.length > 0) {
        insights.push({
          type: 'feature_importance',
          title: `${topFeatures[0].name} is the most important external factor`,
          description: `This feature has the highest impact on project completion predictions with an importance score of ${(topFeatures[0].importance * 100).toFixed(1)}%.`,
          score: topFeatures[0].importance
        });
      }
      
      // Add insights based on prediction improvement
      if (predictionComparison?.improvement_percentage) {
        const improvementPercentage = predictionComparison.improvement_percentage;
        
        if (improvementPercentage > 0) {
          insights.push({
            type: 'prediction_improvement',
            title: `External data improves prediction accuracy by ${improvementPercentage.toFixed(1)}%`,
            description: 'Including external data sources leads to more accurate project completion predictions.',
            score: improvementPercentage / 100
          });
        } else if (improvementPercentage < 0) {
          insights.push({
            type: 'prediction_degradation',
            title: `External data suggests longer completion time by ${Math.abs(improvementPercentage).toFixed(1)}%`,
            description: 'External factors indicate additional complexity not captured in internal metrics.',
            score: Math.abs(improvementPercentage) / 100
          });
        }
      }
      
      // Add insights based on specific features
      const citationFeature = features.find(f => f.feature_name === 'citations');
      const fundingFeature = features.find(f => f.feature_name === 'funding_amount');
      const patentFeature = features.find(f => f.feature_name === 'patent_count');
      
      if (citationFeature && citationFeature.feature_value > 50) {
        insights.push({
          type: 'high_citations',
          title: 'High citation count detected',
          description: 'This project has a high number of citations, indicating significant academic impact.',
          score: 0.8
        });
      }
      
      if (fundingFeature && fundingFeature.feature_value > 500000) {
        insights.push({
          type: 'high_funding',
          title: 'Substantial funding secured',
          description: 'This project has secured significant funding, which may accelerate completion.',
          score: 0.9
        });
      }
      
      if (patentFeature && patentFeature.feature_value > 0) {
        insights.push({
          type: 'has_patents',
          title: 'Patent activity detected',
          description: 'This project has associated patents, indicating innovation potential.',
          score: 0.7
        });
      }
      
      // Return insights
      return {
        project_id: projectId,
        features: features,
        feature_importance: featureImportance,
        top_features: topFeatures,
        prediction_comparison: predictionComparison,
        insights: insights,
        generated_at: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('Error getting project ML insights', { error: error.message, projectId });
      return null;
    }
  }
}

export const enhancedMlPredictionService = new EnhancedMlPredictionService();
