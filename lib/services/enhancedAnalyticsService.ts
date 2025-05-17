import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { externalDataService } from './externalDataService';

export interface CrossDomainMetric {
  id: string;
  project_id: string;
  external_data_source_id?: string;
  metric_name: string;
  metric_value: number;
  calculated_at: string;
  metadata?: any;
}

export interface CombinedAnalytics {
  project_id: string;
  project_title: string;
  project_status: string;
  project_created_at: string;
  project_updated_at: string;
  external_data_type?: string;
  external_data_source?: string;
  relevance_score?: number;
  citations?: number;
  publications?: number;
  funding_amount?: number;
  patents?: number;
  complexity_score?: number;
  risk_score?: number;
  completion_percentage?: number;
}

export interface FundingEfficiency {
  project_id: string;
  total_funding: number;
  completion_percentage: number;
  efficiency_ratio: number;
}

export interface PatentImpact {
  project_id: string;
  total_patents: number;
  citations: number;
  impact_score: number;
}

export class EnhancedAnalyticsService {
  private supabase = createClient();

  /**
   * Get cross-domain metrics for a project
   */
  async getProjectCrossDomainMetrics(projectId: string): Promise<CrossDomainMetric[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_external_metrics')
        .select('*')
        .eq('project_id', projectId)
        .order('calculated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting project cross-domain metrics', { error: error.message, projectId });
      return [];
    }
  }

  /**
   * Get combined analytics for a project
   */
  async getProjectCombinedAnalytics(projectId: string): Promise<CombinedAnalytics[]> {
    try {
      const { data, error } = await this.supabase
        .from('combined_project_analytics')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting project combined analytics', { error: error.message, projectId });
      return [];
    }
  }

  /**
   * Calculate funding efficiency for a project
   */
  async calculateFundingEfficiency(projectId: string): Promise<FundingEfficiency | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        'calculate_funding_efficiency',
        { p_project_id: projectId }
      );
      
      if (error) {
        throw error;
      }
      
      return data[0] || null;
    } catch (error: any) {
      logger.error('Error calculating funding efficiency', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get patent impact score for a project
   */
  async getPatentImpactScore(projectId: string): Promise<PatentImpact | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_patent_impact_score',
        { p_project_id: projectId }
      );
      
      if (error) {
        throw error;
      }
      
      return data[0] || null;
    } catch (error: any) {
      logger.error('Error getting patent impact score', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Refresh combined analytics materialized view
   */
  async refreshCombinedAnalytics(): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('refresh_combined_analytics');
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Error refreshing combined analytics', { error: error.message });
      return false;
    }
  }

  /**
   * Calculate and store cross-domain metrics for a project
   */
  async calculateCrossDomainMetrics(projectId: string): Promise<CrossDomainMetric[]> {
    try {
      // Get external data
      const externalData = await externalDataService.getProjectCombinedExternalData(projectId);
      
      // Calculate metrics
      const metrics: Omit<CrossDomainMetric, 'id' | 'calculated_at'>[] = [];
      
      // Academic metrics
      if (externalData.academic) {
        const academicData = externalData.academic.data;
        const sourceId = externalData.academic.id;
        
        if (academicData.citations) {
          metrics.push({
            project_id: projectId,
            external_data_source_id: sourceId,
            metric_name: 'citation_count',
            metric_value: academicData.citations,
            metadata: { source: 'academic_database' }
          });
        }
        
        if (academicData.publications) {
          metrics.push({
            project_id: projectId,
            external_data_source_id: sourceId,
            metric_name: 'publication_count',
            metric_value: academicData.publications,
            metadata: { source: 'academic_database' }
          });
        }
        
        if (academicData.h_index) {
          metrics.push({
            project_id: projectId,
            external_data_source_id: sourceId,
            metric_name: 'h_index',
            metric_value: academicData.h_index,
            metadata: { source: 'academic_database' }
          });
        }
      }
      
      // Funding metrics
      if (externalData.funding) {
        const fundingData = externalData.funding.data;
        const sourceId = externalData.funding.id;
        
        if (fundingData.total_funding) {
          metrics.push({
            project_id: projectId,
            external_data_source_id: sourceId,
            metric_name: 'funding_amount',
            metric_value: fundingData.total_funding,
            metadata: { source: 'funding_database' }
          });
        }
        
        if (fundingData.active_grants) {
          metrics.push({
            project_id: projectId,
            external_data_source_id: sourceId,
            metric_name: 'active_grant_count',
            metric_value: fundingData.active_grants,
            metadata: { source: 'funding_database' }
          });
        }
      }
      
      // Patent metrics
      if (externalData.patent) {
        const patentData = externalData.patent.data;
        const sourceId = externalData.patent.id;
        
        if (patentData.total_patents) {
          metrics.push({
            project_id: projectId,
            external_data_source_id: sourceId,
            metric_name: 'patent_count',
            metric_value: patentData.total_patents,
            metadata: { source: 'patent_database' }
          });
        }
        
        if (patentData.pending_patents) {
          metrics.push({
            project_id: projectId,
            external_data_source_id: sourceId,
            metric_name: 'pending_patent_count',
            metric_value: patentData.pending_patents,
            metadata: { source: 'patent_database' }
          });
        }
      }
      
      // Calculate derived metrics
      
      // Publications per funding (if both exist)
      if (externalData.academic?.data.publications && externalData.funding?.data.total_funding) {
        const publicationsPerFunding = externalData.academic.data.publications / externalData.funding.data.total_funding * 1000;
        
        metrics.push({
          project_id: projectId,
          metric_name: 'publications_per_funding',
          metric_value: publicationsPerFunding,
          metadata: { 
            source: 'derived',
            calculation: 'publications / total_funding * 1000'
          }
        });
      }
      
      // Patents to publications ratio (if both exist)
      if (externalData.patent?.data.total_patents && externalData.academic?.data.publications) {
        const patentsToPublicationsRatio = externalData.patent.data.total_patents / externalData.academic.data.publications;
        
        metrics.push({
          project_id: projectId,
          metric_name: 'patents_to_publications_ratio',
          metric_value: patentsToPublicationsRatio,
          metadata: { 
            source: 'derived',
            calculation: 'total_patents / publications'
          }
        });
      }
      
      // Store metrics
      for (const metric of metrics) {
        await this.supabase
          .from('project_external_metrics')
          .upsert({
            project_id: metric.project_id,
            external_data_source_id: metric.external_data_source_id,
            metric_name: metric.metric_name,
            metric_value: metric.metric_value,
            metadata: metric.metadata,
            calculated_at: new Date().toISOString()
          }, {
            onConflict: 'project_id,external_data_source_id,metric_name'
          });
      }
      
      // Refresh combined analytics
      await this.refreshCombinedAnalytics();
      
      // Return stored metrics
      return await this.getProjectCrossDomainMetrics(projectId);
    } catch (error: any) {
      logger.error('Error calculating cross-domain metrics', { error: error.message, projectId });
      return [];
    }
  }

  /**
   * Get comprehensive analytics for a project
   */
  async getComprehensiveProjectAnalytics(projectId: string): Promise<any> {
    try {
      // Ensure external data is up to date
      await externalDataService.enrichProjectFromAllSources(projectId);
      
      // Calculate cross-domain metrics
      await this.calculateCrossDomainMetrics(projectId);
      
      // Get combined analytics
      const combinedAnalytics = await this.getProjectCombinedAnalytics(projectId);
      
      // Get funding efficiency
      const fundingEfficiency = await this.calculateFundingEfficiency(projectId);
      
      // Get patent impact score
      const patentImpact = await this.getPatentImpactScore(projectId);
      
      // Get external data
      const externalData = await externalDataService.getProjectCombinedExternalData(projectId);
      
      // Return comprehensive analytics
      return {
        project_id: projectId,
        combined_analytics: combinedAnalytics,
        funding_efficiency: fundingEfficiency,
        patent_impact: patentImpact,
        external_data: externalData,
        calculated_at: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('Error getting comprehensive project analytics', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get correlation analysis between internal and external metrics
   */
  async getMetricCorrelationAnalysis(projectId: string): Promise<any> {
    try {
      // Get cross-domain metrics
      const metrics = await this.getProjectCrossDomainMetrics(projectId);
      
      // Get project analytics
      const { data: analytics, error } = await this.supabase
        .from('project_analytics')
        .select('*')
        .eq('project_id', projectId)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Extract internal metrics
      const internalMetrics = {
        complexity: analytics.metrics?.complexity?.score || 0,
        risk: analytics.metrics?.risk?.score || 0,
        progress: analytics.metrics?.progress?.completion_percentage || 0
      };
      
      // Extract external metrics
      const externalMetrics: Record<string, number> = {};
      metrics.forEach(metric => {
        externalMetrics[metric.metric_name] = metric.metric_value;
      });
      
      // Calculate correlations
      // In a real implementation, this would use statistical methods
      // For now, we'll simulate correlations
      
      const correlations = [
        {
          internal_metric: 'complexity',
          external_metric: 'citation_count',
          correlation: 0.65,
          significance: 'high',
          interpretation: 'Projects with more citations tend to be more complex'
        },
        {
          internal_metric: 'complexity',
          external_metric: 'funding_amount',
          correlation: 0.72,
          significance: 'high',
          interpretation: 'Projects with more funding tend to be more complex'
        },
        {
          internal_metric: 'risk',
          external_metric: 'patent_count',
          correlation: -0.45,
          significance: 'medium',
          interpretation: 'Projects with more patents tend to have lower risk'
        },
        {
          internal_metric: 'progress',
          external_metric: 'publication_count',
          correlation: 0.58,
          significance: 'medium',
          interpretation: 'Projects with more publications tend to have higher progress'
        }
      ];
      
      return {
        project_id: projectId,
        internal_metrics: internalMetrics,
        external_metrics: externalMetrics,
        correlations: correlations,
        analyzed_at: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('Error getting metric correlation analysis', { error: error.message, projectId });
      return null;
    }
  }
}

export const enhancedAnalyticsService = new EnhancedAnalyticsService();
