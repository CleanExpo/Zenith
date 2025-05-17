/**
 * Citation Service Factory
 * 
 * This factory provides a way to get citation management services for different tools.
 * It manages the creation and caching of service instances.
 */

import { logger } from '@/lib/logger';
import { BaseCitationService } from './baseCitationService';
import { ZoteroService } from './zoteroService';

/**
 * Citation management tool types
 */
export type CitationToolType = 'zotero' | 'mendeley' | 'endnote';

/**
 * Citation service factory
 */
export class CitationServiceFactory {
  // Cache of service instances
  private static serviceInstances: Map<string, BaseCitationService> = new Map();
  
  /**
   * Get a citation service for a specific tool
   * @param toolType The citation tool type
   * @param apiKey The API key for the tool
   * @param userId The user ID for the tool
   * @returns The citation service
   */
  public static getCitationService(
    toolType: CitationToolType,
    apiKey: string,
    userId: string
  ): BaseCitationService {
    // Create a cache key
    const cacheKey = `${toolType}:${userId}`;
    
    // Check if the service is already cached
    if (this.serviceInstances.has(cacheKey)) {
      return this.serviceInstances.get(cacheKey)!;
    }
    
    // Create a new service instance
    let service: BaseCitationService;
    
    switch (toolType) {
      case 'zotero':
        service = new ZoteroService(apiKey, userId);
        break;
      
      case 'mendeley':
        // TODO: Implement Mendeley service
        throw new Error('Mendeley service not implemented yet');
      
      case 'endnote':
        // TODO: Implement EndNote service
        throw new Error('EndNote service not implemented yet');
      
      default:
        throw new Error(`Unknown citation tool type: ${toolType}`);
    }
    
    // Cache the service instance
    this.serviceInstances.set(cacheKey, service);
    
    return service;
  }
  
  /**
   * Get the available citation tool types
   * @returns The available tool types
   */
  public static getAvailableToolTypes(): CitationToolType[] {
    return ['zotero', 'mendeley', 'endnote'];
  }
  
  /**
   * Clear the service cache
   */
  public static clearCache(): void {
    this.serviceInstances.clear();
  }
}

/**
 * Get a citation service for a specific tool
 * @param toolType The citation tool type
 * @param apiKey The API key for the tool
 * @param userId The user ID for the tool
 * @returns The citation service
 */
export function getCitationService(
  toolType: CitationToolType,
  apiKey: string,
  userId: string
): BaseCitationService {
  try {
    return CitationServiceFactory.getCitationService(toolType, apiKey, userId);
  } catch (error) {
    logger.error('Error getting citation service', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      toolType
    });
    
    throw error;
  }
}

/**
 * Get the available citation tool types
 * @returns The available tool types
 */
export function getAvailableCitationToolTypes(): CitationToolType[] {
  return CitationServiceFactory.getAvailableToolTypes();
}
