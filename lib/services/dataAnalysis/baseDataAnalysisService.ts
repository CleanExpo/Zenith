/**
 * Base Data Analysis Service
 * 
 * This service provides a common interface for integrating with various data analysis tools
 * such as SPSS, R, Python, etc. It defines the common methods and types
 * that all data analysis tool integrations should implement.
 */

import { logger } from '@/lib/logger';
import { redisClient } from '@/lib/utils/redis';

/**
 * Data types supported by the data analysis tools
 */
export type DataType = 'numeric' | 'categorical' | 'ordinal' | 'datetime' | 'text';

/**
 * Data column definition
 */
export interface DataColumn {
  // The name of the column
  name: string;
  
  // The data type of the column
  type: DataType;
  
  // Optional description of the column
  description?: string;
  
  // Whether the column is required
  required?: boolean;
  
  // For categorical data, the possible values
  categories?: string[];
  
  // For numeric data, the minimum value
  min?: number;
  
  // For numeric data, the maximum value
  max?: number;
  
  // For datetime data, the format
  format?: string;
}

/**
 * Dataset definition
 */
export interface Dataset {
  // The unique identifier for the dataset
  id: string;
  
  // The name of the dataset
  name: string;
  
  // The description of the dataset
  description?: string;
  
  // The columns in the dataset
  columns: DataColumn[];
  
  // The number of rows in the dataset
  rowCount: number;
  
  // The date the dataset was created
  createdAt: string;
  
  // The date the dataset was last updated
  updatedAt: string;
  
  // The owner of the dataset
  ownerId: string;
  
  // Whether the dataset is shared
  isShared: boolean;
  
  // The source of the dataset (e.g., 'upload', 'api', 'database')
  source: string;
  
  // The format of the dataset (e.g., 'csv', 'json', 'excel')
  format: string;
  
  // The size of the dataset in bytes
  size: number;
  
  // The URL to download the dataset
  downloadUrl?: string;
}

/**
 * Analysis type
 */
export type AnalysisType = 
  // Descriptive statistics
  'descriptive' | 
  // Correlation analysis
  'correlation' | 
  // Regression analysis
  'regression' | 
  // ANOVA
  'anova' | 
  // T-test
  'ttest' | 
  // Chi-square test
  'chisquare' | 
  // Factor analysis
  'factor' | 
  // Cluster analysis
  'cluster' | 
  // Time series analysis
  'timeseries' | 
  // Custom analysis
  'custom';

/**
 * Analysis parameters
 */
export interface AnalysisParams {
  // The type of analysis to perform
  type: AnalysisType;
  
  // The dataset ID to analyze
  datasetId: string;
  
  // The columns to include in the analysis
  columns?: string[];
  
  // The dependent variable for regression, ANOVA, etc.
  dependentVariable?: string;
  
  // The independent variables for regression, ANOVA, etc.
  independentVariables?: string[];
  
  // The grouping variable for t-test, ANOVA, etc.
  groupingVariable?: string;
  
  // The number of clusters for cluster analysis
  numClusters?: number;
  
  // The significance level for hypothesis tests
  alpha?: number;
  
  // Whether to use bootstrapping
  bootstrap?: boolean;
  
  // The number of bootstrap samples
  bootstrapSamples?: number;
  
  // Custom parameters for specific analyses
  customParams?: Record<string, any>;
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  // The unique identifier for the analysis
  id: string;
  
  // The type of analysis performed
  type: AnalysisType;
  
  // The dataset ID that was analyzed
  datasetId: string;
  
  // The parameters used for the analysis
  params: AnalysisParams;
  
  // The date the analysis was created
  createdAt: string;
  
  // The owner of the analysis
  ownerId: string;
  
  // The status of the analysis
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  // The results of the analysis
  results?: any;
  
  // The error message if the analysis failed
  error?: string;
  
  // The execution time in milliseconds
  executionTime?: number;
  
  // The URL to download the results
  downloadUrl?: string;
  
  // The visualization options for the results
  visualizationOptions?: Record<string, any>;
}

/**
 * Data transformation type
 */
export type TransformationType = 
  // Filter rows
  'filter' | 
  // Select columns
  'select' | 
  // Create new columns
  'mutate' | 
  // Group by columns
  'group' | 
  // Sort rows
  'sort' | 
  // Join datasets
  'join' | 
  // Pivot data
  'pivot' | 
  // Unpivot data
  'unpivot' | 
  // Aggregate data
  'aggregate' | 
  // Sample data
  'sample' | 
  // Custom transformation
  'custom';

/**
 * Data transformation parameters
 */
export interface TransformationParams {
  // The type of transformation to perform
  type: TransformationType;
  
  // The dataset ID to transform
  datasetId: string;
  
  // The filter expression for 'filter' transformation
  filter?: string;
  
  // The columns to select for 'select' transformation
  columns?: string[];
  
  // The new columns to create for 'mutate' transformation
  newColumns?: Record<string, string>;
  
  // The columns to group by for 'group' transformation
  groupBy?: string[];
  
  // The columns to sort by for 'sort' transformation
  sortBy?: Record<string, 'asc' | 'desc'>;
  
  // The dataset ID to join with for 'join' transformation
  joinDatasetId?: string;
  
  // The type of join for 'join' transformation
  joinType?: 'inner' | 'left' | 'right' | 'full';
  
  // The columns to join on for 'join' transformation
  joinOn?: Record<string, string>;
  
  // The columns to pivot for 'pivot' transformation
  pivotColumns?: string[];
  
  // The column to use as values for 'pivot' transformation
  pivotValues?: string;
  
  // The columns to use as IDs for 'unpivot' transformation
  unpivotIds?: string[];
  
  // The columns to unpivot for 'unpivot' transformation
  unpivotColumns?: string[];
  
  // The name of the variable column for 'unpivot' transformation
  unpivotVariableName?: string;
  
  // The name of the value column for 'unpivot' transformation
  unpivotValueName?: string;
  
  // The aggregation functions for 'aggregate' transformation
  aggregations?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>;
  
  // The number of rows to sample for 'sample' transformation
  sampleSize?: number;
  
  // Whether to sample with replacement for 'sample' transformation
  sampleWithReplacement?: boolean;
  
  // The random seed for 'sample' transformation
  sampleSeed?: number;
  
  // Custom parameters for specific transformations
  customParams?: Record<string, any>;
}

/**
 * Data transformation result
 */
export interface TransformationResult {
  // The unique identifier for the transformation
  id: string;
  
  // The type of transformation performed
  type: TransformationType;
  
  // The dataset ID that was transformed
  datasetId: string;
  
  // The parameters used for the transformation
  params: TransformationParams;
  
  // The date the transformation was created
  createdAt: string;
  
  // The owner of the transformation
  ownerId: string;
  
  // The status of the transformation
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  // The resulting dataset ID
  resultDatasetId?: string;
  
  // The error message if the transformation failed
  error?: string;
  
  // The execution time in milliseconds
  executionTime?: number;
}

/**
 * Visualization type
 */
export type VisualizationType = 
  // Bar chart
  'bar' | 
  // Line chart
  'line' | 
  // Scatter plot
  'scatter' | 
  // Histogram
  'histogram' | 
  // Box plot
  'boxplot' | 
  // Pie chart
  'pie' | 
  // Heatmap
  'heatmap' | 
  // Map
  'map' | 
  // Network
  'network' | 
  // Custom visualization
  'custom';

/**
 * Visualization parameters
 */
export interface VisualizationParams {
  // The type of visualization to create
  type: VisualizationType;
  
  // The dataset ID to visualize
  datasetId: string;
  
  // The analysis ID to visualize (optional)
  analysisId?: string;
  
  // The title of the visualization
  title?: string;
  
  // The subtitle of the visualization
  subtitle?: string;
  
  // The x-axis column for 'bar', 'line', 'scatter' visualizations
  xAxis?: string;
  
  // The y-axis column for 'bar', 'line', 'scatter' visualizations
  yAxis?: string;
  
  // The color column for 'bar', 'line', 'scatter', 'pie' visualizations
  colorBy?: string;
  
  // The size column for 'scatter' visualization
  sizeBy?: string;
  
  // The column for 'histogram', 'boxplot' visualizations
  column?: string;
  
  // The number of bins for 'histogram' visualization
  bins?: number;
  
  // The columns for 'heatmap' visualization
  heatmapColumns?: string[];
  
  // The latitude column for 'map' visualization
  latitude?: string;
  
  // The longitude column for 'map' visualization
  longitude?: string;
  
  // The source column for 'network' visualization
  source?: string;
  
  // The target column for 'network' visualization
  target?: string;
  
  // The weight column for 'network' visualization
  weight?: string;
  
  // The width of the visualization
  width?: number;
  
  // The height of the visualization
  height?: number;
  
  // The color scheme for the visualization
  colorScheme?: string;
  
  // Whether to show a legend
  showLegend?: boolean;
  
  // Whether to show axis labels
  showAxisLabels?: boolean;
  
  // Whether to show grid lines
  showGridLines?: boolean;
  
  // Whether to show data labels
  showDataLabels?: boolean;
  
  // Custom parameters for specific visualizations
  customParams?: Record<string, any>;
}

/**
 * Visualization result
 */
export interface VisualizationResult {
  // The unique identifier for the visualization
  id: string;
  
  // The type of visualization created
  type: VisualizationType;
  
  // The dataset ID that was visualized
  datasetId: string;
  
  // The analysis ID that was visualized (optional)
  analysisId?: string;
  
  // The parameters used for the visualization
  params: VisualizationParams;
  
  // The date the visualization was created
  createdAt: string;
  
  // The owner of the visualization
  ownerId: string;
  
  // The status of the visualization
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  // The SVG or image data for the visualization
  imageData?: string;
  
  // The HTML for the interactive visualization
  htmlContent?: string;
  
  // The URL to view the visualization
  viewUrl?: string;
  
  // The error message if the visualization failed
  error?: string;
  
  // The execution time in milliseconds
  executionTime?: number;
}

/**
 * Data analysis tool credentials
 */
export interface DataAnalysisToolCredentials {
  // The type of data analysis tool
  toolType: string;
  
  // The API key for the tool
  apiKey: string;
  
  // The user ID for the tool
  userId: string;
  
  // Additional credentials for specific tools
  additionalCredentials?: Record<string, any>;
}

/**
 * Base class for data analysis services
 */
export abstract class BaseDataAnalysisService {
  // The name of the data analysis tool
  protected abstract toolName: string;
  
  // The base URL for the API
  protected abstract baseUrl: string;
  
  // The API key for the tool
  protected abstract apiKey: string;
  
  // The cache key prefix for this tool
  protected abstract cacheKeyPrefix: string;
  
  // The default cache TTL in seconds
  protected cacheTtl: number = 60 * 60 * 24; // 24 hours
  
  /**
   * Get all datasets for the current user
   * @returns The list of datasets
   */
  public abstract getDatasets(): Promise<Dataset[]>;
  
  /**
   * Get a dataset by ID
   * @param id The dataset ID
   * @returns The dataset
   */
  public abstract getDataset(id: string): Promise<Dataset>;
  
  /**
   * Create a new dataset
   * @param name The dataset name
   * @param description The dataset description
   * @param columns The dataset columns
   * @param data The dataset data
   * @returns The created dataset
   */
  public abstract createDataset(
    name: string,
    description: string,
    columns: DataColumn[],
    data: any[]
  ): Promise<Dataset>;
  
  /**
   * Update a dataset
   * @param id The dataset ID
   * @param name The new dataset name
   * @param description The new dataset description
   * @returns The updated dataset
   */
  public abstract updateDataset(
    id: string,
    name?: string,
    description?: string
  ): Promise<Dataset>;
  
  /**
   * Delete a dataset
   * @param id The dataset ID
   * @returns True if the dataset was deleted
   */
  public abstract deleteDataset(id: string): Promise<boolean>;
  
  /**
   * Upload a dataset from a file
   * @param file The file to upload
   * @param name The dataset name
   * @param description The dataset description
   * @returns The created dataset
   */
  public abstract uploadDataset(
    file: File,
    name: string,
    description: string
  ): Promise<Dataset>;
  
  /**
   * Download a dataset
   * @param id The dataset ID
   * @param format The format to download (e.g., 'csv', 'json', 'excel')
   * @returns The dataset file
   */
  public abstract downloadDataset(
    id: string,
    format: string
  ): Promise<Blob>;
  
  /**
   * Perform an analysis on a dataset
   * @param params The analysis parameters
   * @returns The analysis result
   */
  public abstract performAnalysis(
    params: AnalysisParams
  ): Promise<AnalysisResult>;
  
  /**
   * Get an analysis result by ID
   * @param id The analysis ID
   * @returns The analysis result
   */
  public abstract getAnalysisResult(id: string): Promise<AnalysisResult>;
  
  /**
   * Delete an analysis result
   * @param id The analysis ID
   * @returns True if the analysis result was deleted
   */
  public abstract deleteAnalysisResult(id: string): Promise<boolean>;
  
  /**
   * Transform a dataset
   * @param params The transformation parameters
   * @returns The transformation result
   */
  public abstract transformDataset(
    params: TransformationParams
  ): Promise<TransformationResult>;
  
  /**
   * Get a transformation result by ID
   * @param id The transformation ID
   * @returns The transformation result
   */
  public abstract getTransformationResult(id: string): Promise<TransformationResult>;
  
  /**
   * Delete a transformation result
   * @param id The transformation ID
   * @returns True if the transformation result was deleted
   */
  public abstract deleteTransformationResult(id: string): Promise<boolean>;
  
  /**
   * Create a visualization
   * @param params The visualization parameters
   * @returns The visualization result
   */
  public abstract createVisualization(
    params: VisualizationParams
  ): Promise<VisualizationResult>;
  
  /**
   * Get a visualization result by ID
   * @param id The visualization ID
   * @returns The visualization result
   */
  public abstract getVisualizationResult(id: string): Promise<VisualizationResult>;
  
  /**
   * Delete a visualization result
   * @param id The visualization ID
   * @returns True if the visualization result was deleted
   */
  public abstract deleteVisualizationResult(id: string): Promise<boolean>;
  
  /**
   * Execute a custom script
   * @param script The script to execute
   * @param language The script language (e.g., 'r', 'python', 'spss')
   * @param datasetIds The dataset IDs to use in the script
   * @returns The script execution result
   */
  public abstract executeScript(
    script: string,
    language: string,
    datasetIds: string[]
  ): Promise<any>;
  
  /**
   * Get the cache key for a dataset
   * @param id The dataset ID
   * @returns The cache key
   */
  protected getDatasetCacheKey(id: string): string {
    return `${this.cacheKeyPrefix}:dataset:${id}`;
  }
  
  /**
   * Get the cache key for datasets
   * @returns The cache key
   */
  protected getDatasetsCacheKey(): string {
    return `${this.cacheKeyPrefix}:datasets`;
  }
  
  /**
   * Get the cache key for an analysis result
   * @param id The analysis ID
   * @returns The cache key
   */
  protected getAnalysisResultCacheKey(id: string): string {
    return `${this.cacheKeyPrefix}:analysis:${id}`;
  }
  
  /**
   * Get the cache key for a transformation result
   * @param id The transformation ID
   * @returns The cache key
   */
  protected getTransformationResultCacheKey(id: string): string {
    return `${this.cacheKeyPrefix}:transformation:${id}`;
  }
  
  /**
   * Get the cache key for a visualization result
   * @param id The visualization ID
   * @returns The cache key
   */
  protected getVisualizationResultCacheKey(id: string): string {
    return `${this.cacheKeyPrefix}:visualization:${id}`;
  }
  
  /**
   * Get cached datasets
   * @returns The cached datasets or null if not found
   */
  protected async getCachedDatasets(): Promise<Dataset[] | null> {
    if (!redisClient) {
      return null;
    }
    
    try {
      const cacheKey = this.getDatasetsCacheKey();
      const cachedDatasets = await redisClient.get(cacheKey);
      
      if (cachedDatasets) {
        return JSON.parse(cachedDatasets);
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting cached datasets', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName
      });
      
      return null;
    }
  }
  
  /**
   * Cache datasets
   * @param datasets The datasets to cache
   */
  protected async cacheDatasets(datasets: Dataset[]): Promise<void> {
    if (!redisClient) {
      return;
    }
    
    try {
      const cacheKey = this.getDatasetsCacheKey();
      await redisClient.set(cacheKey, JSON.stringify(datasets), 'EX', this.cacheTtl);
    } catch (error) {
      logger.warn('Error caching datasets', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName
      });
    }
  }
  
  /**
   * Get a cached dataset
   * @param id The dataset ID
   * @returns The cached dataset or null if not found
   */
  protected async getCachedDataset(id: string): Promise<Dataset | null> {
    if (!redisClient) {
      return null;
    }
    
    try {
      const cacheKey = this.getDatasetCacheKey(id);
      const cachedDataset = await redisClient.get(cacheKey);
      
      if (cachedDataset) {
        return JSON.parse(cachedDataset);
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting cached dataset', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName,
        datasetId: id
      });
      
      return null;
    }
  }
  
  /**
   * Cache a dataset
   * @param dataset The dataset to cache
   */
  protected async cacheDataset(dataset: Dataset): Promise<void> {
    if (!redisClient) {
      return;
    }
    
    try {
      const cacheKey = this.getDatasetCacheKey(dataset.id);
      await redisClient.set(cacheKey, JSON.stringify(dataset), 'EX', this.cacheTtl);
    } catch (error) {
      logger.warn('Error caching dataset', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName,
        datasetId: dataset.id
      });
    }
  }
  
  /**
   * Get a cached analysis result
   * @param id The analysis ID
   * @returns The cached analysis result or null if not found
   */
  protected async getCachedAnalysisResult(id: string): Promise<AnalysisResult | null> {
    if (!redisClient) {
      return null;
    }
    
    try {
      const cacheKey = this.getAnalysisResultCacheKey(id);
      const cachedResult = await redisClient.get(cacheKey);
      
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting cached analysis result', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName,
        analysisId: id
      });
      
      return null;
    }
  }
  
  /**
   * Cache an analysis result
   * @param result The analysis result to cache
   */
  protected async cacheAnalysisResult(result: AnalysisResult): Promise<void> {
    if (!redisClient) {
      return;
    }
    
    try {
      const cacheKey = this.getAnalysisResultCacheKey(result.id);
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', this.cacheTtl);
    } catch (error) {
      logger.warn('Error caching analysis result', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName,
        analysisId: result.id
      });
    }
  }
  
  /**
   * Get a cached transformation result
   * @param id The transformation ID
   * @returns The cached transformation result or null if not found
   */
  protected async getCachedTransformationResult(id: string): Promise<TransformationResult | null> {
    if (!redisClient) {
      return null;
    }
    
    try {
      const cacheKey = this.getTransformationResultCacheKey(id);
      const cachedResult = await redisClient.get(cacheKey);
      
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting cached transformation result', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName,
        transformationId: id
      });
      
      return null;
    }
  }
  
  /**
   * Cache a transformation result
   * @param result The transformation result to cache
   */
  protected async cacheTransformationResult(result: TransformationResult): Promise<void> {
    if (!redisClient) {
      return;
    }
    
    try {
      const cacheKey = this.getTransformationResultCacheKey(result.id);
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', this.cacheTtl);
    } catch (error) {
      logger.warn('Error caching transformation result', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName,
        transformationId: result.id
      });
    }
  }
  
  /**
   * Get a cached visualization result
   * @param id The visualization ID
   * @returns The cached visualization result or null if not found
   */
  protected async getCachedVisualizationResult(id: string): Promise<VisualizationResult | null> {
    if (!redisClient) {
      return null;
    }
    
    try {
      const cacheKey = this.getVisualizationResultCacheKey(id);
      const cachedResult = await redisClient.get(cacheKey);
      
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting cached visualization result', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName,
        visualizationId: id
      });
      
      return null;
    }
  }
  
  /**
   * Cache a visualization result
   * @param result The visualization result to cache
   */
  protected async cacheVisualizationResult(result: VisualizationResult): Promise<void> {
    if (!redisClient) {
      return;
    }
    
    try {
      const cacheKey = this.getVisualizationResultCacheKey(result.id);
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', this.cacheTtl);
    } catch (error) {
      logger.warn('Error caching visualization result', {
        error: error instanceof Error ? error.message : String(error),
        toolName: this.toolName,
        visualizationId: result.id
      });
    }
  }
}
