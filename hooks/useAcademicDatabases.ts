import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AcademicPublication, AcademicSearchResults, AcademicSearchParams } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';
import { AcademicDatabaseType } from '@/lib/services/academicDatabases/academicDatabaseFactory';

/**
 * Hook for interacting with academic databases
 */
export function useAcademicDatabases() {
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPublication, setIsLoadingPublication] = useState(false);
  const { toast } = useToast();

  /**
   * Search an academic database
   * @param database The database to search
   * @param params The search parameters
   * @returns The search results
   */
  const searchDatabase = useCallback(
    async (database: AcademicDatabaseType, params: AcademicSearchParams): Promise<AcademicSearchResults | null> => {
      setIsSearching(true);
      
      try {
        // Build the query string
        const queryParams = new URLSearchParams();
        queryParams.append('database', database);
        queryParams.append('query', params.query);
        
        if (params.field) {
          queryParams.append('field', params.field);
        }
        
        if (params.limit) {
          queryParams.append('limit', params.limit.toString());
        }
        
        if (params.page) {
          queryParams.append('page', params.page.toString());
        }
        
        if (params.sort) {
          queryParams.append('sort', params.sort);
        }
        
        if (params.startDate) {
          queryParams.append('startDate', params.startDate);
        }
        
        if (params.endDate) {
          queryParams.append('endDate', params.endDate);
        }
        
        if (params.filters) {
          queryParams.append('filters', JSON.stringify(params.filters));
        }
        
        // Make the API request
        const response = await fetch(`/api/academic-databases/search?${queryParams.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to search academic database');
        }
        
        const results = await response.json();
        return results as AcademicSearchResults;
      } catch (error) {
        toast({
          title: 'Error searching academic database',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive'
        });
        
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [toast]
  );
  
  /**
   * Get a publication by ID
   * @param database The database to search
   * @param id The publication ID
   * @returns The publication
   */
  const getPublicationById = useCallback(
    async (database: AcademicDatabaseType, id: string): Promise<AcademicPublication | null> => {
      setIsLoadingPublication(true);
      
      try {
        // Build the query string
        const queryParams = new URLSearchParams();
        queryParams.append('database', database);
        queryParams.append('id', id);
        
        // Make the API request
        const response = await fetch(`/api/academic-databases/publication?${queryParams.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get publication');
        }
        
        const publication = await response.json();
        return publication as AcademicPublication;
      } catch (error) {
        toast({
          title: 'Error getting publication',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive'
        });
        
        return null;
      } finally {
        setIsLoadingPublication(false);
      }
    },
    [toast]
  );
  
  /**
   * Get the available academic database types
   * @returns The available database types
   */
  const getAvailableDatabaseTypes = useCallback(async (): Promise<AcademicDatabaseType[]> => {
    try {
      // Make the API request
      const response = await fetch('/api/academic-databases/types');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get available database types');
      }
      
      const types = await response.json();
      return types as AcademicDatabaseType[];
    } catch (error) {
      toast({
        title: 'Error getting available database types',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
      
      // Return default types
      return ['pubmed', 'scopus', 'ieee'];
    }
  }, [toast]);
  
  return {
    searchDatabase,
    getPublicationById,
    getAvailableDatabaseTypes,
    isSearching,
    isLoadingPublication
  };
}
