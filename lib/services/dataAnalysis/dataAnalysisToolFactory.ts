/**
 * Data Analysis Tool Factory
 * 
 * This factory creates data analysis tool instances based on the tool name.
 */

import { BaseDataAnalysisService, DataAnalysisToolCredentials } from './baseDataAnalysisService';
import { PythonDataAnalysisService } from './pythonDataAnalysisService';
import { RDataAnalysisService } from './rDataAnalysisService';
import { logger } from '@/lib/logger';

/**
 * Data analysis tool factory
 */
export class DataAnalysisToolFactory {
  /**
   * Create a data analysis tool instance
   * @param toolName The name of the tool
   * @param credentials The credentials for the tool
   * @returns The data analysis tool instance
   */
  public static createTool(
    toolName: string,
    credentials: DataAnalysisToolCredentials
  ): BaseDataAnalysisService {
    logger.info('Creating data analysis tool', {
      toolName,
      userId: credentials.userId
    });
    
    switch (toolName.toLowerCase()) {
      case 'python':
        return new PythonDataAnalysisService(credentials);
      case 'r':
        return new RDataAnalysisService(credentials);
      default:
        throw new Error(`Unsupported data analysis tool: ${toolName}`);
    }
  }
  
  /**
   * Get the list of supported tools
   * @returns The list of supported tools
   */
  public static getSupportedTools(): string[] {
    return ['Python', 'R'];
  }
}
