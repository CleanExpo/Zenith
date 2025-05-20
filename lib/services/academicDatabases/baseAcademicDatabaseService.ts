/**
 * Base Academic Database Service
 * 
 * This service provides a common interface for integrating with various academic databases
 * such as PubMed, Scopus, IEEE Xplore, etc. It defines the common methods and types
 * that all academic database integrations should implement.
 */

import { logger } from '@/lib/logger';
import { SimpleCache } from '@/lib/services/simpleCache';

/**
 * Search parameters for academic database queries
 */
export interface AcademicSearchParams {
  // The search query
  query: string;
  
  // The field to search in (e.g., title, abstract, author, etc.)
  field?: string;
  
  // The maximum number of results to return
  limit?: number;
  
  // The page number for paginated results
  page?: number;
  
  // The sort order (e.g., relevance, date, citations, etc.)
  sort?: string;
  
  // The start date for filtering results
  startDate?: string;
  
  // The end date for filtering results
  endDate?: string;
  
  // Additional filters specific to the database
  filters?: Record<string, any>;
}

/**
 * Common fields for academic publications
 */
export interface AcademicPublication {
  // The unique identifier for the publication
  id: string;
  
  // The title of the publication
  title: string;
  
  // The abstract of the publication
  abstract?: string;
  
  // The authors of the publication
  authors: string[];
  
  // The publication date
  publicationDate?: string;
  
  // The journal or conference name
  source?: string;
  
  // The DOI (Digital Object Identifier)
  doi?: string;
  
  // The URL to the publication
  url?: string;
  
  // The number of citations
  citationCount?: number;
  
  // The keywords associated with the publication
  keywords?: string[];
  
  // The type of publication (e.g., article, conference paper, book chapter, etc.)
  publicationType?: string | string[];
  
  // The database source (e.g., PubMed, Scopus, IEEE Xplore, etc.)
  databaseSource: string;
  
  // Additional metadata specific to the database
  metadata?: Record<string, any>;
}

/**
 * Search results from an academic database
 */
export interface AcademicSearchResults {
  // The list of publications
  publications: AcademicPublication[];
  
  // The total number of results
  totalResults: number;
  
  // The current page number
  page: number;
  
  // The total number of pages
  totalPages: number;
  
  // The search parameters used
  searchParams: AcademicSearchParams;
  
  // The database source
  databaseSource: string;
  
  // Additional metadata specific to the database
  metadata?: Record<string, any>;
}

/**
 * Base class for academic database services
 */
export abstract class BaseAcademicDatabaseService {
  // The name of the database
  protected abstract databaseName: string;
  
  // The base URL for the API
  protected abstract baseUrl: string;
  
  // The API key for the database
  protected abstract apiKey: string;
  
  // The cache key prefix for this database
  protected abstract cacheKeyPrefix: string;
  
  // The default cache TTL in seconds
  protected cacheTtl: number = 60 * 60 * 24; // 24 hours
  
  // The cache instance
  protected cache: SimpleCache = new SimpleCache();
  
  /**
   * Search the academic database
   * @param params The search parameters
   * @returns The search results
   */
  public abstract search(params: AcademicSearchParams): Promise<AcademicSearchResults>;
  
  /**
   * Get a publication by ID
   * @param id The publication ID
   * @returns The publication
   */
  public abstract getPublicationById(id: string): Promise<AcademicPublication>;
  
  /**
   * Get the cache key for a search query
   * @param params The search parameters
   * @returns The cache key
   */
  protected getCacheKey(params: AcademicSearchParams): string {
    return `${this.cacheKeyPrefix}:search:${JSON.stringify(params)}`;
  }
  
  /**
   * Get the cache key for a publication
   * @param id The publication ID
   * @returns The cache key
   */
  protected getPublicationCacheKey(id: string): string {
    return `${this.cacheKeyPrefix}:publication:${id}`;
  }
  
  /**
   * Get cached search results
   * @param params The search parameters
   * @returns The cached search results or null if not found
   */
  protected async getCachedSearchResults(params: AcademicSearchParams): Promise<AcademicSearchResults | null> {
    try {
      const cacheKey = this.getCacheKey(params);
      const cachedResults = this.cache.get(cacheKey); // Using the SimpleCache instance
      
      if (cachedResults) {
        return JSON.parse(cachedResults);
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting cached search results', {
        error: error instanceof Error ? error.message : String(error),
        databaseName: this.databaseName,
        params
      });
      
      return null;
    }
  }
  
  /**
   * Cache search results
   * @param params The search parameters
   * @param results The search results
   */
  protected async cacheSearchResults(params: AcademicSearchParams, results: AcademicSearchResults): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(params);
      this.cache.set(cacheKey, JSON.stringify(results), this.cacheTtl); // Using the SimpleCache instance
    } catch (error) {
      logger.warn('Error caching search results', {
        error: error instanceof Error ? error.message : String(error),
        databaseName: this.databaseName,
        params
      });
    }
  }
  
  /**
   * Get a cached publication
   * @param id The publication ID
   * @returns The cached publication or null if not found
   */
  protected async getCachedPublication(id: string): Promise<AcademicPublication | null> {
    try {
      const cacheKey = this.getPublicationCacheKey(id);
      const cachedPublication = this.cache.get(cacheKey); // Using the SimpleCache instance
      
      if (cachedPublication) {
        return JSON.parse(cachedPublication);
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting cached publication', {
        error: error instanceof Error ? error.message : String(error),
        databaseName: this.databaseName,
        id
      });
      
      return null;
    }
  }
  
  /**
   * Cache a publication
   * @param publication The publication to cache
   */
  protected async cachePublication(publication: AcademicPublication): Promise<void> {
    try {
      const cacheKey = this.getPublicationCacheKey(publication.id);
      this.cache.set(cacheKey, JSON.stringify(publication), this.cacheTtl); // Using the SimpleCache instance
    } catch (error) {
      logger.warn('Error caching publication', {
        error: error instanceof Error ? error.message : String(error),
        databaseName: this.databaseName,
        publicationId: publication.id
      });
    }
  }
  
  /**
   * Make an API request to the academic database
   * @param endpoint The API endpoint
   * @param params The query parameters
   * @returns The API response
   */
  protected async makeApiRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      logger.error('Error making API request to academic database', {
        error: error instanceof Error ? error.message : String(error),
        databaseName: this.databaseName,
        endpoint,
        params
      });
      
      throw error;
    }
  }
}
