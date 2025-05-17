import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface ExternalDataSource {
  id: string;
  name: string;
  description: string;
  source_type: string;
  connection_config: any;
  is_active: boolean;
  refresh_interval_minutes: number;
  last_sync_at: string | null;
  sync_status: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ExternalDataMapping {
  id: string;
  source_id: string;
  entity_type: string;
  external_field: string;
  internal_field: string;
  transformation_rule: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExternalDataCache {
  id: string;
  source_id: string;
  entity_type: string;
  entity_id: string;
  external_id: string | null;
  data: any;
  fetched_at: string;
  expires_at: string | null;
  is_valid: boolean;
}

export interface EnrichedEntity {
  id: string;
  entity_type: string;
  entity_id: string;
  source_id: string;
  enriched_data: any;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface ExternalDataResult {
  success: boolean;
  message?: string;
  data?: any;
  cached?: boolean;
  fetched_at?: string;
}

export interface EnrichEntityResult {
  success: boolean;
  message?: string;
  enriched_data?: any;
  confidence_score?: number;
  source?: string;
  source_type?: string;
}

export interface EnrichedEntityData {
  entity_type: string;
  entity_id: string;
  sources: Array<{
    id: string;
    name: string;
    type: string;
    data: any;
    confidence_score: number;
    updated_at: string;
  }>;
}

export class ExternalDataService {
  private supabase = createClient();

  /**
   * Get all external data sources
   * @deprecated Use getExternalDataSources instead
   */
  async getDataSources(sourceType?: string): Promise<ExternalDataSource[]> {
    try {
      let query = this.supabase
        .from('external_data_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (sourceType) {
        query = query.eq('source_type', sourceType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting external data sources', { error: error.message, sourceType });
      return [];
    }
  }

  /**
   * Get all external data sources
   */
  async getExternalDataSources(sourceType?: string): Promise<ExternalDataSource[]> {
    try {
      let query = this.supabase
        .from('external_data_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (sourceType) {
        query = query.eq('source_type', sourceType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting external data sources', { error: error.message, sourceType });
      return [];
    }
  }

  /**
   * Get external data source by ID
   */
  async getDataSourceById(sourceId: string): Promise<ExternalDataSource | null> {
    try {
      const { data, error } = await this.supabase
        .from('external_data_sources')
        .select('*')
        .eq('id', sourceId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting external data source by ID', { error: error.message, sourceId });
      return null;
    }
  }

  /**
   * Create a new external data source
   */
  async createDataSource(source: Omit<ExternalDataSource, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<ExternalDataSource | null> {
    try {
      const { data, error } = await this.supabase
        .from('external_data_sources')
        .insert(source)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error creating external data source', { error: error.message });
      return null;
    }
  }

  /**
   * Update an external data source
   */
  async updateDataSource(sourceId: string, updates: Partial<ExternalDataSource>): Promise<ExternalDataSource | null> {
    try {
      const { data, error } = await this.supabase
        .from('external_data_sources')
        .update(updates)
        .eq('id', sourceId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error updating external data source', { error: error.message, sourceId });
      return null;
    }
  }

  /**
   * Delete an external data source
   */
  async deleteDataSource(sourceId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('external_data_sources')
        .delete()
        .eq('id', sourceId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Error deleting external data source', { error: error.message, sourceId });
      return false;
    }
  }

  /**
   * Get data mappings for a source
   */
  async getDataMappings(sourceId: string, entityType?: string): Promise<ExternalDataMapping[]> {
    try {
      let query = this.supabase
        .from('external_data_mappings')
        .select('*')
        .eq('source_id', sourceId);
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting external data mappings', { error: error.message, sourceId, entityType });
      return [];
    }
  }

  /**
   * Create a new data mapping
   */
  async createDataMapping(mapping: Omit<ExternalDataMapping, 'id' | 'created_at' | 'updated_at'>): Promise<ExternalDataMapping | null> {
    try {
      const { data, error } = await this.supabase
        .from('external_data_mappings')
        .insert(mapping)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error creating external data mapping', { error: error.message });
      return null;
    }
  }

  /**
   * Update a data mapping
   */
  async updateDataMapping(mappingId: string, updates: Partial<ExternalDataMapping>): Promise<ExternalDataMapping | null> {
    try {
      const { data, error } = await this.supabase
        .from('external_data_mappings')
        .update(updates)
        .eq('id', mappingId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error updating external data mapping', { error: error.message, mappingId });
      return null;
    }
  }

  /**
   * Delete a data mapping
   */
  async deleteDataMapping(mappingId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('external_data_mappings')
        .delete()
        .eq('id', mappingId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Error deleting external data mapping', { error: error.message, mappingId });
      return false;
    }
  }

  /**
   * Fetch external data for an entity
   */
  async fetchExternalData(sourceId: string, entityType: string, entityId: string): Promise<ExternalDataResult> {
    try {
      const { data, error } = await this.supabase.rpc(
        'fetch_external_data',
        {
          p_source_id: sourceId,
          p_entity_type: entityType,
          p_entity_id: entityId
        }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error fetching external data', { error: error.message, sourceId, entityType, entityId });
      return { success: false, message: error.message };
    }
  }

  /**
   * Enrich an entity with external data
   */
  async enrichEntityWithExternalData(entityType: string, entityId: string, sourceId: string): Promise<EnrichEntityResult> {
    try {
      const { data, error } = await this.supabase.rpc(
        'enrich_entity_with_external_data',
        {
          p_entity_type: entityType,
          p_entity_id: entityId,
          p_source_id: sourceId
        }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error enriching entity with external data', { error: error.message, entityType, entityId, sourceId });
      return { success: false, message: error.message };
    }
  }

  /**
   * Get enriched data for an entity
   */
  async getEnrichedEntityData(entityType: string, entityId: string, sourceId?: string): Promise<EnrichedEntityData | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_enriched_entity_data',
        {
          p_entity_type: entityType,
          p_entity_id: entityId,
          p_source_id: sourceId
        }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting enriched entity data', { error: error.message, entityType, entityId, sourceId });
      return null;
    }
  }

  /**
   * Enrich a project with data from all available sources
   */
  async enrichProjectFromAllSources(projectId: string): Promise<EnrichEntityResult[]> {
    try {
      // Get all active data sources
      const sources = await this.getDataSources();
      const activeSourceIds = sources
        .filter(source => source.is_active)
        .map(source => source.id);
      
      // Enrich the project with data from each source
      const results = await Promise.all(
        activeSourceIds.map(sourceId => 
          this.enrichEntityWithExternalData('project', projectId, sourceId)
        )
      );
      
      return results;
    } catch (error: any) {
      logger.error('Error enriching project from all sources', { error: error.message, projectId });
      return [{ success: false, message: error.message }];
    }
  }

  /**
   * Get all enriched data for a project
   */
  async getProjectEnrichedData(projectId: string): Promise<EnrichedEntityData | null> {
    try {
      return await this.getEnrichedEntityData('project', projectId);
    } catch (error: any) {
      logger.error('Error getting project enriched data', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get academic data for a project
   */
  async getProjectAcademicData(projectId: string): Promise<any | null> {
    try {
      const sources = await this.getDataSources('academic_database');
      
      if (!sources.length) {
        return null;
      }
      
      const academicSourceId = sources[0].id;
      const enrichedData = await this.getEnrichedEntityData('project', projectId, academicSourceId);
      
      if (!enrichedData || !enrichedData.sources.length) {
        // If no enriched data exists, try to enrich it
        await this.enrichEntityWithExternalData('project', projectId, academicSourceId);
        return await this.getEnrichedEntityData('project', projectId, academicSourceId);
      }
      
      return enrichedData;
    } catch (error: any) {
      logger.error('Error getting project academic data', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get funding data for a project
   */
  async getProjectFundingData(projectId: string): Promise<any | null> {
    try {
      const sources = await this.getDataSources('funding_database');
      
      if (!sources.length) {
        return null;
      }
      
      const fundingSourceId = sources[0].id;
      const enrichedData = await this.getEnrichedEntityData('project', projectId, fundingSourceId);
      
      if (!enrichedData || !enrichedData.sources.length) {
        // If no enriched data exists, try to enrich it
        await this.enrichEntityWithExternalData('project', projectId, fundingSourceId);
        return await this.getEnrichedEntityData('project', projectId, fundingSourceId);
      }
      
      return enrichedData;
    } catch (error: any) {
      logger.error('Error getting project funding data', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get patent data for a project
   */
  async getProjectPatentData(projectId: string): Promise<any | null> {
    try {
      const sources = await this.getDataSources('patent_database');
      
      if (!sources.length) {
        return null;
      }
      
      const patentSourceId = sources[0].id;
      const enrichedData = await this.getEnrichedEntityData('project', projectId, patentSourceId);
      
      if (!enrichedData || !enrichedData.sources.length) {
        // If no enriched data exists, try to enrich it
        await this.enrichEntityWithExternalData('project', projectId, patentSourceId);
        return await this.getEnrichedEntityData('project', projectId, patentSourceId);
      }
      
      return enrichedData;
    } catch (error: any) {
      logger.error('Error getting project patent data', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Get combined external data for a project
   */
  async getProjectCombinedExternalData(projectId: string): Promise<any> {
    try {
      // Enrich the project from all sources
      await this.enrichProjectFromAllSources(projectId);
      
      // Get all enriched data
      const enrichedData = await this.getProjectEnrichedData(projectId);
      
      if (!enrichedData) {
        return {
          academic: null,
          funding: null,
          patent: null,
          other: []
        };
      }
      
      // Organize data by source type
      const result = {
        academic: null as any,
        funding: null as any,
        patent: null as any,
        other: [] as any[]
      };
      
      enrichedData.sources.forEach(source => {
        if (source.type === 'academic_database') {
          result.academic = source;
        } else if (source.type === 'funding_database') {
          result.funding = source;
        } else if (source.type === 'patent_database') {
          result.patent = source;
        } else {
          result.other.push(source);
        }
      });
      
      return result;
    } catch (error: any) {
      logger.error('Error getting project combined external data', { error: error.message, projectId });
      return {
        academic: null,
        funding: null,
        patent: null,
        other: []
      };
    }
  }
}

export const externalDataService = new ExternalDataService();
