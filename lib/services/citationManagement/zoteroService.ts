/**
 * Zotero Citation Management Service
 * 
 * This service provides integration with the Zotero API for managing citations.
 * It implements the BaseCitationService interface for the Zotero citation management tool.
 * 
 * Zotero API Documentation: https://www.zotero.org/support/dev/web_api/v3/start
 */

import { logger } from '@/lib/logger';
import { 
  BaseCitationService, 
  CitationCollection, 
  CitationItem, 
  CitationSearchParams, 
  CitationSearchResults,
  CitationFormat,
  ExportOptions,
  ImportOptions
} from './baseCitationService';
import { AcademicPublication } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';

/**
 * Zotero API response types
 */
interface ZoteroCollection {
  key: string;
  version: number;
  name: string;
  parentCollection?: string;
  relations: Record<string, string[]>;
  meta: {
    numItems: number;
    numCollections: number;
  };
  data?: {
    name: string;
    parentCollection?: string;
    relations: Record<string, string[]>;
  };
}

interface ZoteroItem {
  key: string;
  version: number;
  library: {
    type: string;
    id: number;
    name: string;
  };
  links: {
    self: {
      href: string;
      type: string;
    };
    alternate: {
      href: string;
      type: string;
    };
  };
  meta: {
    creatorSummary?: string;
    parsedDate?: string;
    numChildren?: number;
  };
  data: {
    key: string;
    version: number;
    itemType: string;
    title?: string;
    creators?: Array<{
      creatorType: string;
      firstName?: string;
      lastName?: string;
      name?: string;
    }>;
    abstractNote?: string;
    publicationTitle?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    date?: string;
    series?: string;
    seriesTitle?: string;
    seriesText?: string;
    journalAbbreviation?: string;
    language?: string;
    DOI?: string;
    ISSN?: string;
    shortTitle?: string;
    url?: string;
    accessDate?: string;
    archive?: string;
    archiveLocation?: string;
    libraryCatalog?: string;
    callNumber?: string;
    rights?: string;
    extra?: string;
    tags?: Array<{
      tag: string;
      type?: number;
    }>;
    collections?: string[];
    relations?: Record<string, string[]>;
    dateAdded: string;
    dateModified: string;
    note?: string;
  };
}

/**
 * Zotero citation management service
 */
export class ZoteroService extends BaseCitationService {
  // The name of the citation management tool
  protected toolName: string = 'Zotero';
  
  // The base URL for the API
  protected baseUrl: string = 'https://api.zotero.org';
  
  // The API key for the tool
  protected apiKey: string;
  
  // The user ID for the Zotero account
  protected userId: string;
  
  // The cache key prefix for this tool
  protected cacheKeyPrefix: string = 'zotero';
  
  /**
   * Constructor
   * @param apiKey The Zotero API key
   * @param userId The Zotero user ID
   */
  constructor(apiKey: string, userId: string) {
    super();
    this.apiKey = apiKey;
    this.userId = userId;
  }
  
  /**
   * Get all collections for the current user
   * @returns The list of collections
   */
  public async getCollections(): Promise<CitationCollection[]> {
    try {
      // Check cache first
      const cachedCollections = await this.getCachedCollections();
      if (cachedCollections) {
        return cachedCollections;
      }
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/collections`, {
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get collections: ${response.statusText}`);
      }
      
      const zoteroCollections = await response.json() as ZoteroCollection[];
      
      // Convert to our format
      const collections = zoteroCollections.map(this.convertZoteroCollection);
      
      // Cache the collections
      await this.cacheCollections(collections);
      
      return collections;
    } catch (error) {
      logger.error('Error getting Zotero collections', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw error;
    }
  }
  
  /**
   * Get a collection by ID
   * @param id The collection ID
   * @returns The collection
   */
  public async getCollection(id: string): Promise<CitationCollection> {
    try {
      // Check cache first
      const cachedCollection = await this.getCachedCollection(id);
      if (cachedCollection) {
        return cachedCollection;
      }
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/collections/${id}`, {
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get collection: ${response.statusText}`);
      }
      
      const zoteroCollection = await response.json() as ZoteroCollection;
      
      // Convert to our format
      const collection = this.convertZoteroCollection(zoteroCollection);
      
      // Cache the collection
      await this.cacheCollection(collection);
      
      return collection;
    } catch (error) {
      logger.error('Error getting Zotero collection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        collectionId: id
      });
      
      throw error;
    }
  }
  
  /**
   * Create a new collection
   * @param name The collection name
   * @param description The collection description
   * @returns The created collection
   */
  public async createCollection(name: string, description?: string): Promise<CitationCollection> {
    try {
      // Prepare the request body
      const body = {
        name,
        parentCollection: false
      };
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/collections`, {
        method: 'POST',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create collection: ${response.statusText}`);
      }
      
      // Get the collection key from the response
      const key = response.headers.get('Last-Modified-Version');
      
      if (!key) {
        throw new Error('Failed to get collection key from response');
      }
      
      // Get the created collection
      return this.getCollection(key);
    } catch (error) {
      logger.error('Error creating Zotero collection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name
      });
      
      throw error;
    }
  }
  
  /**
   * Update a collection
   * @param id The collection ID
   * @param name The new collection name
   * @param description The new collection description
   * @returns The updated collection
   */
  public async updateCollection(id: string, name?: string, description?: string): Promise<CitationCollection> {
    try {
      // Get the current collection
      const collection = await this.getCollection(id);
      
      // Prepare the request body
      const body = {
        name: name || collection.name
      };
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/collections/${id}`, {
        method: 'PATCH',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update collection: ${response.statusText}`);
      }
      
      // Get the updated collection
      return this.getCollection(id);
    } catch (error) {
      logger.error('Error updating Zotero collection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        collectionId: id
      });
      
      throw error;
    }
  }
  
  /**
   * Delete a collection
   * @param id The collection ID
   * @returns True if the collection was deleted
   */
  public async deleteCollection(id: string): Promise<boolean> {
    try {
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/collections/${id}`, {
        method: 'DELETE',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete collection: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      logger.error('Error deleting Zotero collection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        collectionId: id
      });
      
      throw error;
    }
  }
  
  /**
   * Search for citations
   * @param params The search parameters
   * @returns The search results
   */
  public async searchCitations(params: CitationSearchParams): Promise<CitationSearchResults> {
    try {
      // Check cache first
      const cachedResults = await this.getCachedSearchResults(params);
      if (cachedResults) {
        return cachedResults;
      }
      
      // Prepare the query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('q', params.query);
      
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      
      if (params.page) {
        queryParams.append('start', ((params.page - 1) * (params.limit || 25)).toString());
      }
      
      // Add collection filter if specified
      let url = `${this.baseUrl}/users/${this.userId}/items`;
      if (params.collectionId) {
        url = `${this.baseUrl}/users/${this.userId}/collections/${params.collectionId}/items`;
      }
      
      // Make the API request
      const response = await fetch(`${url}?${queryParams.toString()}`, {
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search citations: ${response.statusText}`);
      }
      
      const zoteroItems = await response.json() as ZoteroItem[];
      
      // Get the total results count from the header
      const totalResults = parseInt(response.headers.get('Total-Results') || '0', 10);
      
      // Convert to our format
      const citations = await Promise.all(zoteroItems.map(item => this.convertZoteroItem(item)));
      
      // Create the search results
      const results: CitationSearchResults = {
        citations,
        totalResults,
        page: params.page || 1,
        totalPages: Math.ceil(totalResults / (params.limit || 25)),
        searchParams: params
      };
      
      // Cache the results
      await this.cacheSearchResults(params, results);
      
      return results;
    } catch (error) {
      logger.error('Error searching Zotero citations', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        params
      });
      
      throw error;
    }
  }
  
  /**
   * Get a citation by ID
   * @param id The citation ID
   * @returns The citation
   */
  public async getCitation(id: string): Promise<CitationItem> {
    try {
      // Check cache first
      const cachedCitation = await this.getCachedCitation(id);
      if (cachedCitation) {
        return cachedCitation;
      }
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/items/${id}`, {
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get citation: ${response.statusText}`);
      }
      
      const zoteroItem = await response.json() as ZoteroItem;
      
      // Convert to our format
      const citation = await this.convertZoteroItem(zoteroItem);
      
      // Cache the citation
      await this.cacheCitation(citation);
      
      return citation;
    } catch (error) {
      logger.error('Error getting Zotero citation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        citationId: id
      });
      
      throw error;
    }
  }
  
  /**
   * Add a citation
   * @param publication The publication to add
   * @param collectionId The collection ID to add to
   * @param notes Optional notes
   * @param tags Optional tags
   * @returns The added citation
   */
  public async addCitation(
    publication: AcademicPublication,
    collectionId?: string,
    notes?: string,
    tags?: string[]
  ): Promise<CitationItem> {
    try {
      // Convert to Zotero format
      const zoteroItem = this.convertPublicationToZoteroItem(publication, collectionId, notes, tags);
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/items`, {
        method: 'POST',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([zoteroItem])
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add citation: ${response.statusText}`);
      }
      
      // Get the item key from the response
      const data = await response.json();
      const key = data.success['0'];
      
      if (!key) {
        throw new Error('Failed to get item key from response');
      }
      
      // Get the added citation
      return this.getCitation(key);
    } catch (error) {
      logger.error('Error adding Zotero citation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        publication
      });
      
      throw error;
    }
  }
  
  /**
   * Update a citation
   * @param id The citation ID
   * @param collectionIds The collection IDs to update
   * @param notes The notes to update
   * @param tags The tags to update
   * @returns The updated citation
   */
  public async updateCitation(
    id: string,
    collectionIds?: string[],
    notes?: string,
    tags?: string[]
  ): Promise<CitationItem> {
    try {
      // Get the current citation
      const citation = await this.getCitation(id);
      
      // Prepare the request body
      const body: any = {
        collections: collectionIds || citation.collectionIds
      };
      
      if (notes !== undefined) {
        body.note = notes;
      }
      
      if (tags !== undefined) {
        body.tags = tags.map(tag => ({ tag }));
      }
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update citation: ${response.statusText}`);
      }
      
      // Get the updated citation
      return this.getCitation(id);
    } catch (error) {
      logger.error('Error updating Zotero citation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        citationId: id
      });
      
      throw error;
    }
  }
  
  /**
   * Delete a citation
   * @param id The citation ID
   * @returns True if the citation was deleted
   */
  public async deleteCitation(id: string): Promise<boolean> {
    try {
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete citation: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      logger.error('Error deleting Zotero citation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        citationId: id
      });
      
      throw error;
    }
  }
  
  /**
   * Format a citation
   * @param publication The publication to format
   * @param format The citation format
   * @returns The formatted citation
   */
  public async formatCitation(publication: AcademicPublication, format: CitationFormat): Promise<string> {
    try {
      // Convert to Zotero format
      const zoteroItem = this.convertPublicationToZoteroItem(publication);
      
      // Make the API request to create a temporary item
      const createResponse = await fetch(`${this.baseUrl}/users/${this.userId}/items`, {
        method: 'POST',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([zoteroItem])
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create temporary item: ${createResponse.statusText}`);
      }
      
      // Get the item key from the response
      const createData = await createResponse.json();
      const key = createData.success['0'];
      
      if (!key) {
        throw new Error('Failed to get item key from response');
      }
      
      // Get the citation in the requested format
      const formatResponse = await fetch(`${this.baseUrl}/users/${this.userId}/items/${key}/citation?style=${format}`, {
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!formatResponse.ok) {
        throw new Error(`Failed to format citation: ${formatResponse.statusText}`);
      }
      
      const formatData = await formatResponse.json();
      const formattedCitation = formatData.text;
      
      // Delete the temporary item
      await fetch(`${this.baseUrl}/users/${this.userId}/items/${key}`, {
        method: 'DELETE',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return formattedCitation;
    } catch (error) {
      logger.error('Error formatting Zotero citation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        publication,
        format
      });
      
      // Fallback to a basic format if the API fails
      return this.formatCitationBasic(publication, format);
    }
  }
  
  /**
   * Export citations
   * @param citationIds The citation IDs to export
   * @param options The export options
   * @returns The exported citations as a string
   */
  public async exportCitations(citationIds: string[], options: ExportOptions): Promise<string> {
    try {
      // Prepare the query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('format', this.mapFormatToZotero(options.format));
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/items?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(citationIds)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export citations: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      logger.error('Error exporting Zotero citations', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        citationIds,
        options
      });
      
      throw error;
    }
  }
  
  /**
   * Import citations
   * @param content The content to import
   * @param options The import options
   * @returns The imported citations
   */
  public async importCitations(content: string, options: ImportOptions): Promise<CitationItem[]> {
    try {
      // Prepare the query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('format', this.mapFormatToZotero(options.format));
      
      if (options.collectionId) {
        queryParams.append('collectionKey', options.collectionId);
      }
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/items?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Zotero-API-Version': '3',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'text/plain'
        },
        body: content
      });
      
      if (!response.ok) {
        throw new Error(`Failed to import citations: ${response.statusText}`);
      }
      
      // Get the item keys from the response
      const data = await response.json();
      const keys = Object.values(data.success);
      
      // Get the imported citations
      const citations = await Promise.all((keys as string[]).map((key: string) => this.getCitation(key)));
      
      return citations;
    } catch (error) {
      logger.error('Error importing Zotero citations', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      
      throw error;
    }
  }
  
  /**
   * Convert a Zotero collection to our format
   * @param zoteroCollection The Zotero collection
   * @returns The converted collection
   */
  private convertZoteroCollection(zoteroCollection: ZoteroCollection): CitationCollection {
    return {
      id: zoteroCollection.key,
      name: zoteroCollection.data?.name || zoteroCollection.name,
      citationCount: zoteroCollection.meta.numItems,
      createdAt: new Date().toISOString(), // Zotero doesn't provide creation date
      updatedAt: new Date().toISOString(), // Zotero doesn't provide update date
      ownerId: this.userId,
      isShared: false // Zotero doesn't provide sharing info in the API
    };
  }
  
  /**
   * Convert a Zotero item to our format
   * @param zoteroItem The Zotero item
   * @returns The converted citation
   */
  private async convertZoteroItem(zoteroItem: ZoteroItem): Promise<CitationItem> {
    // Extract the publication data
    const publication: AcademicPublication = {
      id: zoteroItem.key,
      title: zoteroItem.data.title || '',
      authors: this.extractAuthors(zoteroItem),
      abstract: zoteroItem.data.abstractNote,
      publicationDate: zoteroItem.data.date,
      source: zoteroItem.data.publicationTitle,
      doi: zoteroItem.data.DOI,
      url: zoteroItem.data.url,
      keywords: zoteroItem.data.tags?.map(tag => tag.tag),
      databaseSource: 'zotero'
    };
    
    return {
      id: zoteroItem.key,
      publication,
      collectionIds: zoteroItem.data.collections || [],
      notes: zoteroItem.data.note,
      tags: zoteroItem.data.tags?.map(tag => tag.tag),
      addedAt: zoteroItem.data.dateAdded,
      updatedAt: zoteroItem.data.dateModified,
      ownerId: this.userId
    };
  }
  
  /**
   * Extract authors from a Zotero item
   * @param zoteroItem The Zotero item
   * @returns The authors
   */
  private extractAuthors(zoteroItem: ZoteroItem): string[] {
    if (!zoteroItem.data.creators) {
      return [];
    }
    
    return zoteroItem.data.creators.map(creator => {
      if (creator.name) {
        return creator.name;
      }
      
      if (creator.firstName && creator.lastName) {
        return `${creator.lastName}, ${creator.firstName}`;
      }
      
      return creator.lastName || creator.firstName || '';
    });
  }
  
  /**
   * Convert a publication to a Zotero item
   * @param publication The publication
   * @param collectionId The collection ID
   * @param notes The notes
   * @param tags The tags
   * @returns The Zotero item
   */
  private convertPublicationToZoteroItem(
    publication: AcademicPublication,
    collectionId?: string,
    notes?: string,
    tags?: string[]
  ): any {
    // Determine the item type
    const itemType = this.determineItemType(publication);
    
    // Create the base item
    const item: any = {
      itemType,
      title: publication.title,
      abstractNote: publication.abstract,
      date: publication.publicationDate,
      url: publication.url,
      DOI: publication.doi,
      creators: this.convertAuthorsToCreators(publication.authors),
      tags: (tags || publication.keywords || []).map(tag => ({ tag })),
      collections: collectionId ? [collectionId] : []
    };
    
    // Add publication-specific fields
    if (itemType === 'journalArticle') {
      item.publicationTitle = publication.source;
    } else if (itemType === 'book') {
      item.publisher = publication.source;
    } else if (itemType === 'conferencePaper') {
      item.conferenceName = publication.source;
    }
    
    // Add notes if provided
    if (notes) {
      item.note = notes;
    }
    
    return item;
  }
  
  /**
   * Determine the item type for a publication
   * @param publication The publication
   * @returns The item type
   */
  private determineItemType(publication: AcademicPublication): string {
    if (!publication.publicationType) {
      return 'journalArticle';
    }
    
    const type = Array.isArray(publication.publicationType)
      ? publication.publicationType[0]
      : publication.publicationType;
    
    // Map publication types to Zotero item types
    switch (type.toLowerCase()) {
      case 'book':
        return 'book';
      case 'conference':
      case 'conference paper':
      case 'proceedings':
        return 'conferencePaper';
      case 'thesis':
      case 'dissertation':
        return 'thesis';
      case 'report':
      case 'technical report':
        return 'report';
      case 'website':
      case 'web page':
        return 'webpage';
      case 'patent':
        return 'patent';
      default:
        return 'journalArticle';
    }
  }
  
  /**
   * Convert authors to Zotero creators
   * @param authors The authors
   * @returns The creators
   */
  private convertAuthorsToCreators(authors?: string[]): any[] {
    if (!authors || authors.length === 0) {
      return [];
    }
    
    return authors.map(author => {
      // Check if the author is in "Last, First" format
      const match = author.match(/^([^,]+),\s*(.+)$/);
      
      if (match) {
        return {
          creatorType: 'author',
          lastName: match[1],
          firstName: match[2]
        };
      }
      
      // Check if the author has multiple parts
      const parts = author.split(' ');
      
      if (parts.length > 1) {
        return {
          creatorType: 'author',
          lastName: parts[parts.length - 1],
          firstName: parts.slice(0, parts.length - 1).join(' ')
        };
      }
      
      // Single name
      return {
        creatorType: 'author',
        lastName: author,
        firstName: ''
      };
    });
  }
  
  /**
   * Map a citation format to a Zotero format
   * @param format The citation format
   * @returns The Zotero format
   */
  private mapFormatToZotero(format: CitationFormat): string {
    switch (format) {
      case 'bibtex':
        return 'bibtex';
      case 'ris':
        return 'ris';
      case 'apa':
        return 'apa';
      case 'mla':
        return 'mla';
      case 'chicago':
        return 'chicago-note-bibliography';
      case 'harvard':
        return 'harvard1';
      case 'ieee':
        return 'ieee';
      case 'vancouver':
        return 'vancouver';
      default:
        return 'apa';
    }
  }
  
  /**
   * Format a citation in a basic way as a fallback
   * @param publication The publication
   * @param format The citation format
   * @returns The formatted citation
   */
  private formatCitationBasic(publication: AcademicPublication, format: CitationFormat): string {
    // Extract the year from the publication date
    const year = publication.publicationDate 
      ? publication.publicationDate.match(/\d{4}/)
        ? publication.publicationDate.match(/\d{4}/)![0]
        : ''
      : '';
    
    // Format the authors
    const authors = publication.authors && publication.authors.length > 0
      ? publication.authors.length > 5
        ? `${publication.authors[0]} et al.`
        : publication.authors.join(', ')
      : 'Unknown';
    
    // Format the citation based on the requested format
    switch (format) {
      case 'apa':
        return `${authors} (${year}). ${publication.title}. ${publication.source || ''}${publication.doi ? ` doi:${publication.doi}` : ''}`;
      
      case 'mla':
        return `${authors}. "${publication.title}." ${publication.source || ''} ${year}.${publication.doi ? ` DOI: ${publication.doi}` : ''}`;
      
      case 'chicago':
        return `${authors}. "${publication.title}." ${publication.source || ''} (${year}).${publication.doi ? ` DOI: ${publication.doi}` : ''}`;
      
      case 'harvard':
        return `${authors} ${year}, '${publication.title}', ${publication.source || ''}${publication.doi ? `, DOI: ${publication.doi}` : ''}`;
      
      case 'ieee':
        return `${authors}, "${publication.title}," ${publication.source || ''}, ${year}.${publication.doi ? ` DOI: ${publication.doi}` : ''}`;
      
      case 'vancouver':
        return `${authors}. ${publication.title}. ${publication.source || ''}. ${year}.${publication.doi ? ` DOI: ${publication.doi}` : ''}`;
      
      case 'bibtex':
        return `@article{${publication.id},
  author = {${authors}},
  title = {${publication.title}},
  journal = {${publication.source || ''}},
  year = {${year}},
  doi = {${publication.doi || ''}}
}`;
      
      case 'ris':
        return `TY  - JOUR
AU  - ${publication.authors ? publication.authors.join('\nAU  - ') : 'Unknown'}
TI  - ${publication.title}
JO  - ${publication.source || ''}
PY  - ${year}
DO  - ${publication.doi || ''}
ER  - `;
      
      default:
        return `${authors} (${year}). ${publication.title}. ${publication.source || ''}${publication.doi ? ` doi:${publication.doi}` : ''}`;
    }
  }
}
