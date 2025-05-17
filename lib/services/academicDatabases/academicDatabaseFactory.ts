/**
 * Academic Database Factory
 * 
 * This factory provides a centralized way to create and manage academic database service instances.
 * It ensures that only one instance of each service is created (singleton pattern) and provides
 * a simple interface for accessing the different services.
 */

import { BaseAcademicDatabaseService } from './baseAcademicDatabaseService';
import { PubMedService } from './pubmedService';
import { logger } from '@/lib/logger';

/**
 * Available academic database types
 */
export type AcademicDatabaseType = 'pubmed' | 'scopus' | 'ieee';

/**
 * Academic database configuration
 */
export interface AcademicDatabaseConfig {
  // API key for the database
  apiKey?: string;
  
  // Additional configuration options specific to the database
  options?: Record<string, any>;
}

/**
 * Academic database factory for creating and managing academic database service instances
 */
export class AcademicDatabaseFactory {
  // Singleton instance of the factory
  private static instance: AcademicDatabaseFactory;
  
  // Map of database type to service instance
  private services: Map<AcademicDatabaseType, BaseAcademicDatabaseService> = new Map();
  
  // Configuration for each database type
  private configs: Map<AcademicDatabaseType, AcademicDatabaseConfig> = new Map();
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize with default configurations
    this.configs.set('pubmed', {});
    this.configs.set('scopus', {});
    this.configs.set('ieee', {});
  }
  
  /**
   * Get the singleton instance of the factory
   * @returns The factory instance
   */
  public static getInstance(): AcademicDatabaseFactory {
    if (!AcademicDatabaseFactory.instance) {
      AcademicDatabaseFactory.instance = new AcademicDatabaseFactory();
    }
    
    return AcademicDatabaseFactory.instance;
  }
  
  /**
   * Configure a database service
   * @param type The database type
   * @param config The configuration
   */
  public configure(type: AcademicDatabaseType, config: AcademicDatabaseConfig): void {
    this.configs.set(type, config);
    
    // If the service already exists, recreate it with the new configuration
    if (this.services.has(type)) {
      this.services.delete(type);
      this.getService(type);
    }
  }
  
  /**
   * Get a database service instance
   * @param type The database type
   * @returns The database service instance
   */
  public getService(type: AcademicDatabaseType): BaseAcademicDatabaseService {
    // Check if the service already exists
    if (this.services.has(type)) {
      return this.services.get(type)!;
    }
    
    // Get the configuration for the database
    const config = this.configs.get(type) || {};
    
    // Create a new service instance based on the type
    let service: BaseAcademicDatabaseService;
    
    switch (type) {
      case 'pubmed':
        service = new PubMedService(config.apiKey);
        break;
      case 'scopus':
        // TODO: Implement Scopus service
        throw new Error('Scopus service not implemented yet');
      case 'ieee':
        // TODO: Implement IEEE service
        throw new Error('IEEE service not implemented yet');
      default:
        throw new Error(`Unknown academic database type: ${type}`);
    }
    
    // Store the service instance
    this.services.set(type, service);
    
    logger.info('Created academic database service', { type });
    
    return service;
  }
  
  /**
   * Get all available database types
   * @returns Array of available database types
   */
  public getAvailableDatabaseTypes(): AcademicDatabaseType[] {
    return Array.from(this.configs.keys());
  }
  
  /**
   * Get all configured database services
   * @returns Map of database type to service instance
   */
  public getAllServices(): Map<AcademicDatabaseType, BaseAcademicDatabaseService> {
    // Create services for any configured databases that don't have a service yet
    this.configs.forEach((_, type) => {
      if (!this.services.has(type)) {
        try {
          this.getService(type);
        } catch (error) {
          // Ignore errors for services that aren't implemented yet
          logger.warn('Failed to create academic database service', {
            type,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    });
    
    return this.services;
  }
}

/**
 * Get the academic database factory instance
 * @returns The factory instance
 */
export function getAcademicDatabaseFactory(): AcademicDatabaseFactory {
  return AcademicDatabaseFactory.getInstance();
}

/**
 * Get an academic database service
 * @param type The database type
 * @returns The database service
 */
export function getAcademicDatabaseService(type: AcademicDatabaseType): BaseAcademicDatabaseService {
  return getAcademicDatabaseFactory().getService(type);
}
