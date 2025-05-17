/**
 * Machine Learning Service Factory
 * 
 * This factory creates instances of machine learning services.
 */

import { logger } from '@/lib/logger';
import { SupervisedLearningService } from './supervisedLearningService';
import { UnsupervisedLearningService } from './unsupervisedLearningService';

/**
 * Machine learning service type
 */
export enum MachineLearningServiceType {
  SUPERVISED = 'supervised',
  UNSUPERVISED = 'unsupervised'
}

/**
 * Machine learning service factory
 */
export class MachineLearningServiceFactory {
  private static supervisedServices: Map<string, SupervisedLearningService> = new Map();
  private static unsupervisedServices: Map<string, UnsupervisedLearningService> = new Map();
  
  /**
   * Get a supervised learning service
   * @param userId The user ID
   * @returns The supervised learning service
   */
  public static getSupervisedLearningService(userId: string): SupervisedLearningService {
    // Check if the service already exists
    if (this.supervisedServices.has(userId)) {
      return this.supervisedServices.get(userId)!;
    }
    
    // Create a new service
    const service = new SupervisedLearningService(userId);
    
    // Cache the service
    this.supervisedServices.set(userId, service);
    
    logger.info('Created supervised learning service', {
      userId
    });
    
    return service;
  }
  
  /**
   * Get an unsupervised learning service
   * @param userId The user ID
   * @returns The unsupervised learning service
   */
  public static getUnsupervisedLearningService(userId: string): UnsupervisedLearningService {
    // Check if the service already exists
    if (this.unsupervisedServices.has(userId)) {
      return this.unsupervisedServices.get(userId)!;
    }
    
    // Create a new service
    const service = new UnsupervisedLearningService(userId);
    
    // Cache the service
    this.unsupervisedServices.set(userId, service);
    
    logger.info('Created unsupervised learning service', {
      userId
    });
    
    return service;
  }
  
  /**
   * Get a machine learning service
   * @param type The service type
   * @param userId The user ID
   * @returns The machine learning service
   */
  public static getService(
    type: MachineLearningServiceType,
    userId: string
  ): SupervisedLearningService | UnsupervisedLearningService {
    switch (type) {
      case MachineLearningServiceType.SUPERVISED:
        return this.getSupervisedLearningService(userId);
      case MachineLearningServiceType.UNSUPERVISED:
        return this.getUnsupervisedLearningService(userId);
      default:
        throw new Error(`Unknown machine learning service type: ${type}`);
    }
  }
  
  /**
   * Clear the service cache
   */
  public static clearCache(): void {
    this.supervisedServices.clear();
    this.unsupervisedServices.clear();
    
    logger.info('Cleared machine learning service cache');
  }
}
