/**
 * Citation Management Hook
 * 
 * This hook provides functions for interacting with citation management tools
 * like Zotero, Mendeley, etc. through the citation management API.
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  CitationCollection, 
  CitationItem, 
  CitationSearchParams, 
  CitationSearchResults,
  CitationFormat
} from '@/lib/services/citationManagement/baseCitationService';
import { CitationToolType } from '@/lib/services/citationManagement/citationServiceFactory';
import { AcademicPublication } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';

/**
 * Citation management credentials
 */
interface CitationCredentials {
  toolType: CitationToolType;
  apiKey: string;
  userId: string;
}

/**
 * Citation management hook
 * @returns Functions for interacting with citation management tools
 */
export function useCitationManagement() {
  // State for loading status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // State for error
  const [error, setError] = useState<string | null>(null);
  
  // Toast for notifications
  const { toast } = useToast();
  
  /**
   * Get available citation tool types
   * @returns The available tool types
   */
  const getAvailableToolTypes = useCallback(async (): Promise<CitationToolType[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/citation-management/types');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get available citation tool types');
      }
      
      const types = await response.json();
      return types;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  /**
   * Search for citations
   * @param credentials The citation credentials
   * @param params The search parameters
   * @returns The search results
   */
  const searchCitations = useCallback(async (
    credentials: CitationCredentials,
    params: CitationSearchParams
  ): Promise<CitationSearchResults | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the query string
      const queryParams = new URLSearchParams({
        toolType: credentials.toolType,
        apiKey: credentials.apiKey,
        userId: credentials.userId,
        query: params.query
      });
      
      // Add optional parameters
      if (params.field) {
        queryParams.append('field', params.field);
      }
      
      if (params.collectionId) {
        queryParams.append('collectionId', params.collectionId);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.tags) {
        queryParams.append('tags', params.tags.join(','));
      }
      
      // Make the request
      const response = await fetch(`/api/citation-management/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search citations');
      }
      
      const results = await response.json();
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  /**
   * Add a citation
   * @param credentials The citation credentials
   * @param publication The publication to add
   * @param collectionId The collection ID to add to
   * @param notes Notes to add to the citation
   * @param tags Tags to add to the citation
   * @returns The added citation
   */
  const addCitation = useCallback(async (
    credentials: CitationCredentials,
    publication: AcademicPublication,
    collectionId?: string,
    notes?: string,
    tags?: string[]
  ): Promise<CitationItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the request
      const response = await fetch('/api/citation-management/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolType: credentials.toolType,
          apiKey: credentials.apiKey,
          userId: credentials.userId,
          publication,
          collectionId,
          notes,
          tags
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add citation');
      }
      
      const citation = await response.json();
      
      // Show success toast
      toast({
        title: 'Citation Added',
        description: `Successfully added "${publication.title}" to your ${credentials.toolType} library.`,
        variant: 'default'
      });
      
      return citation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  /**
   * Format a citation
   * @param credentials The citation credentials
   * @param publication The publication to format
   * @param format The citation format
   * @returns The formatted citation
   */
  const formatCitation = useCallback(async (
    credentials: CitationCredentials,
    publication: AcademicPublication,
    format: CitationFormat
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the request
      const response = await fetch('/api/citation-management/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolType: credentials.toolType,
          apiKey: credentials.apiKey,
          userId: credentials.userId,
          publication,
          format
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to format citation');
      }
      
      const data = await response.json();
      return data.formattedCitation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  /**
   * Get collections
   * @param credentials The citation credentials
   * @returns The collections
   */
  const getCollections = useCallback(async (
    credentials: CitationCredentials
  ): Promise<CitationCollection[] | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the query string
      const queryParams = new URLSearchParams({
        toolType: credentials.toolType,
        apiKey: credentials.apiKey,
        userId: credentials.userId
      });
      
      // Make the request
      const response = await fetch(`/api/citation-management/collections?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get collections');
      }
      
      const collections = await response.json();
      return collections;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Return the hook functions and state
  return {
    isLoading,
    error,
    getAvailableToolTypes,
    searchCitations,
    addCitation,
    formatCitation,
    getCollections
  };
}
