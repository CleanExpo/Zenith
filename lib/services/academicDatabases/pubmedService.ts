/**
 * PubMed Database Service
 * 
 * This service provides integration with the PubMed database via the NCBI E-utilities API.
 * It allows searching for publications and retrieving publication details.
 * 
 * API Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25500/
 */

import { logger } from '@/lib/logger';
import { 
  BaseAcademicDatabaseService, 
  AcademicSearchParams, 
  AcademicSearchResults,
  AcademicPublication
} from './baseAcademicDatabaseService';

/**
 * PubMed API response for search
 */
interface PubMedSearchResponse {
  esearchresult: {
    count: string;
    retmax: string;
    retstart: string;
    idlist: string[];
    translationset: Array<{
      from: string;
      to: string;
    }>;
    querytranslation: string;
  };
}

/**
 * PubMed API response for summary
 */
interface PubMedSummaryResponse {
  result: {
    uids: string[];
    [key: string]: any;
  };
}

/**
 * PubMed publication summary
 */
interface PubMedPublicationSummary {
  uid: string;
  pubdate: string;
  epubdate: string;
  source: string;
  authors: Array<{
    name: string;
    authtype: string;
    clusterid: string;
  }>;
  lastauthor: string;
  title: string;
  sorttitle: string;
  volume: string;
  issue: string;
  pages: string;
  lang: string[];
  nlmuniqueid: string;
  issn: string;
  essn: string;
  pubtype: string[];
  recordstatus: string;
  pubstatus: string;
  articleids: Array<{
    idtype: string;
    idtypen: number;
    value: string;
  }>;
  history: Array<{
    pubstatus: string;
    date: string;
  }>;
  references: string[];
  attributes: string[];
  pmcrefcount: string;
  fulljournalname: string;
  elocationid: string;
  doctype: string;
  srccontriblist: string[];
  booktitle: string;
  medium: string;
  edition: string;
  publisherlocation: string;
  publishername: string;
  srcdate: string;
  reportnumber: string;
  availablefromurl: string;
  locationlabel: string;
  doccontriblist: string[];
  docdate: string;
  bookname: string;
  chapter: string;
  sortpubdate: string;
  sortfirstauthor: string;
  vernaculartitle: string;
}

/**
 * PubMed API response for fetch
 */
interface PubMedFetchResponse {
  PubmedArticleSet: {
    PubmedArticle: Array<{
      MedlineCitation: {
        PMID: {
          _: string;
          Version: string;
        };
        DateCompleted?: {
          Year: string;
          Month: string;
          Day: string;
        };
        DateRevised: {
          Year: string;
          Month: string;
          Day: string;
        };
        Article: {
          Journal: {
            ISSN?: {
              _: string;
              IssnType: string;
            };
            JournalIssue: {
              Volume?: string;
              Issue?: string;
              PubDate: {
                Year?: string;
                Month?: string;
                Day?: string;
                MedlineDate?: string;
              };
            };
            Title: string;
            ISOAbbreviation: string;
          };
          ArticleTitle: string;
          Pagination?: {
            MedlinePgn: string;
          };
          Abstract?: {
            AbstractText: Array<{
              _: string;
              Label?: string;
              NlmCategory?: string;
            }> | string;
          };
          AuthorList?: {
            Author: Array<{
              LastName?: string;
              ForeName?: string;
              Initials?: string;
              AffiliationInfo?: Array<{
                Affiliation: string;
              }>;
              CollectiveName?: string;
            }>;
          };
          Language: string[];
          PublicationTypeList: {
            PublicationType: Array<{
              _: string;
              UI: string;
            }>;
          };
        };
        MedlineJournalInfo: {
          Country: string;
          MedlineTA: string;
          NlmUniqueID: string;
          ISSNLinking?: string;
        };
        CitationSubset?: string[];
        MeshHeadingList?: {
          MeshHeading: Array<{
            DescriptorName: {
              _: string;
              UI: string;
              MajorTopicYN: string;
            };
            QualifierName?: Array<{
              _: string;
              UI: string;
              MajorTopicYN: string;
            }>;
          }>;
        };
        KeywordList?: {
          Owner: string;
          Keyword: Array<{
            _: string;
            MajorTopicYN: string;
          }>;
        };
      };
      PubmedData: {
        History: {
          PubMedPubDate: Array<{
            Year: string;
            Month: string;
            Day: string;
            Hour?: string;
            Minute?: string;
            PubStatus: string;
          }>;
        };
        PublicationStatus: string;
        ArticleIdList: {
          ArticleId: Array<{
            _: string;
            IdType: string;
          }>;
        };
      };
    }>;
  };
}

/**
 * PubMed service for integrating with the PubMed database
 */
export class PubMedService extends BaseAcademicDatabaseService {
  protected databaseName = 'PubMed';
  protected baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
  protected cacheKeyPrefix = 'pubmed';
  
  // API key for NCBI E-utilities
  protected apiKey: string;
  
  // Default parameters for PubMed API requests
  private defaultParams = {
    db: 'pubmed',
    retmode: 'json',
    retmax: 20,
    sort: 'relevance'
  };
  
  /**
   * Constructor
   * @param apiKey API key for NCBI E-utilities (optional)
   */
  constructor(apiKey: string = '') {
    super();
    this.apiKey = apiKey;
  }
  
  /**
   * Search PubMed for publications
   * @param params Search parameters
   * @returns Search results
   */
  public async search(params: AcademicSearchParams): Promise<AcademicSearchResults> {
    try {
      // Check cache first
      const cachedResults = await this.getCachedSearchResults(params);
      if (cachedResults) {
        return cachedResults;
      }
      
      // Convert generic search params to PubMed-specific params
      const pubmedParams = this.convertToPubMedParams(params);
      
      // Search for IDs first
      const searchResponse = await this.makeApiRequest<PubMedSearchResponse>('esearch.fcgi', {
        ...pubmedParams,
        usehistory: 'y'
      });
      
      const idList = searchResponse.esearchresult.idlist;
      const totalResults = parseInt(searchResponse.esearchresult.count, 10);
      
      if (idList.length === 0) {
        // No results found
        const emptyResults: AcademicSearchResults = {
          publications: [],
          totalResults: 0,
          page: params.page || 1,
          totalPages: 0,
          searchParams: params,
          databaseSource: this.databaseName
        };
        
        await this.cacheSearchResults(params, emptyResults);
        return emptyResults;
      }
      
      // Get summaries for the IDs
      const summaryResponse = await this.makeApiRequest<PubMedSummaryResponse>('esummary.fcgi', {
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'json'
      });
      
      // Convert PubMed summaries to AcademicPublication objects
      const publications = this.convertSummariesToPublications(summaryResponse);
      
      // Calculate pagination info
      const limit = params.limit || parseInt(searchResponse.esearchresult.retmax, 10);
      const totalPages = Math.ceil(totalResults / limit);
      
      // Create search results
      const results: AcademicSearchResults = {
        publications,
        totalResults,
        page: params.page || 1,
        totalPages,
        searchParams: params,
        databaseSource: this.databaseName,
        metadata: {
          queryTranslation: searchResponse.esearchresult.querytranslation
        }
      };
      
      // Cache results
      await this.cacheSearchResults(params, results);
      
      return results;
    } catch (error) {
      logger.error('Error searching PubMed', {
        error: error instanceof Error ? error.message : String(error),
        params
      });
      
      throw error;
    }
  }
  
  /**
   * Get a publication by ID
   * @param id PubMed ID (PMID)
   * @returns Publication details
   */
  public async getPublicationById(id: string): Promise<AcademicPublication> {
    try {
      // Check cache first
      const cachedPublication = await this.getCachedPublication(id);
      if (cachedPublication) {
        return cachedPublication;
      }
      
      // Fetch publication details
      const fetchResponse = await this.makeApiRequest<PubMedFetchResponse>('efetch.fcgi', {
        db: 'pubmed',
        id,
        retmode: 'xml',
        rettype: 'abstract'
      });
      
      // Convert PubMed article to AcademicPublication
      const publication = this.convertArticleToPublication(fetchResponse, id);
      
      // Cache publication
      await this.cachePublication(publication);
      
      return publication;
    } catch (error) {
      logger.error('Error getting PubMed publication', {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      
      throw error;
    }
  }
  
  /**
   * Convert generic search params to PubMed-specific params
   * @param params Generic search params
   * @returns PubMed-specific params
   */
  private convertToPubMedParams(params: AcademicSearchParams): Record<string, any> {
    const pubmedParams: Record<string, any> = {
      ...this.defaultParams
    };
    
    // Add API key if available
    if (this.apiKey) {
      pubmedParams.api_key = this.apiKey;
    }
    
    // Convert query
    pubmedParams.term = params.query;
    
    // Convert field
    if (params.field) {
      // Map generic fields to PubMed fields
      const fieldMap: Record<string, string> = {
        title: 'title',
        abstract: 'abstract',
        author: 'author',
        journal: 'journal',
        keyword: 'mesh'
      };
      
      const pubmedField = fieldMap[params.field] || params.field;
      pubmedParams.term = `${params.query}[${pubmedField}]`;
    }
    
    // Convert pagination
    if (params.limit) {
      pubmedParams.retmax = params.limit;
    }
    
    if (params.page && params.limit) {
      pubmedParams.retstart = (params.page - 1) * params.limit;
    }
    
    // Convert sort
    if (params.sort) {
      // Map generic sort options to PubMed sort options
      const sortMap: Record<string, string> = {
        relevance: 'relevance',
        date: 'pub date',
        author: 'author',
        journal: 'journal'
      };
      
      pubmedParams.sort = sortMap[params.sort] || params.sort;
    }
    
    // Convert date filters
    if (params.startDate || params.endDate) {
      let dateRange = '';
      
      if (params.startDate) {
        dateRange += params.startDate;
      }
      
      dateRange += ':';
      
      if (params.endDate) {
        dateRange += params.endDate;
      }
      
      pubmedParams.term = `${pubmedParams.term} AND (${dateRange}[Date - Publication])`;
    }
    
    // Add additional filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) {
          pubmedParams.term = `${pubmedParams.term} AND ${value}[${key}]`;
        }
      });
    }
    
    return pubmedParams;
  }
  
  /**
   * Convert PubMed summaries to AcademicPublication objects
   * @param response PubMed summary response
   * @returns List of publications
   */
  private convertSummariesToPublications(response: PubMedSummaryResponse): AcademicPublication[] {
    const { result } = response;
    const { uids } = result;
    
    return uids.map(uid => {
      const summary = result[uid] as PubMedPublicationSummary;
      
      // Extract DOI if available
      const doiArticleId = summary.articleids.find(id => id.idtype === 'doi');
      const doi = doiArticleId ? doiArticleId.value : undefined;
      
      // Extract URL if available
      const urlArticleId = summary.articleids.find(id => id.idtype === 'pmc');
      const url = urlArticleId 
        ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${urlArticleId.value}/`
        : `https://pubmed.ncbi.nlm.nih.gov/${uid}/`;
      
      // Extract authors
      const authors = summary.authors
        ? summary.authors.map(author => author.name)
        : [];
      
      // Extract publication date
      const pubDate = summary.pubdate || summary.epubdate || summary.sortpubdate || '';
      
      // Extract keywords
      const keywords = summary.attributes || [];
      
      return {
        id: uid,
        title: summary.title,
        authors,
        publicationDate: pubDate,
        source: summary.fulljournalname || summary.source,
        doi,
        url,
        publicationType: summary.pubtype || [],
        databaseSource: this.databaseName,
        keywords,
        metadata: {
          volume: summary.volume,
          issue: summary.issue,
          pages: summary.pages,
          nlmId: summary.nlmuniqueid
        }
      };
    });
  }
  
  /**
   * Convert PubMed article to AcademicPublication
   * @param response PubMed fetch response
   * @param id PubMed ID
   * @returns Publication details
   */
  private convertArticleToPublication(response: PubMedFetchResponse, id: string): AcademicPublication {
    try {
      const article = response.PubmedArticleSet.PubmedArticle[0];
      
      if (!article) {
        throw new Error(`No article found for ID ${id}`);
      }
      
      const { MedlineCitation, PubmedData } = article;
      const { Article, MeshHeadingList, KeywordList } = MedlineCitation;
      const { Journal, Abstract, AuthorList, PublicationTypeList } = Article;
      
      // Extract abstract
      let abstractText = '';
      if (Abstract && Abstract.AbstractText) {
        if (Array.isArray(Abstract.AbstractText)) {
          abstractText = Abstract.AbstractText.map(section => {
            if (typeof section === 'string') {
              return section;
            }
            return section.Label 
              ? `${section.Label}: ${section._}` 
              : section._;
          }).join('\n\n');
        } else {
          abstractText = Abstract.AbstractText as string;
        }
      }
      
      // Extract authors
      const authors: string[] = [];
      if (AuthorList && AuthorList.Author) {
        AuthorList.Author.forEach(author => {
          if (author.CollectiveName) {
            authors.push(author.CollectiveName);
          } else if (author.LastName && author.ForeName) {
            authors.push(`${author.LastName} ${author.ForeName}`);
          } else if (author.LastName) {
            authors.push(author.LastName);
          }
        });
      }
      
      // Extract publication date
      let publicationDate = '';
      const pubDate = Journal.JournalIssue.PubDate;
      if (pubDate.MedlineDate) {
        publicationDate = pubDate.MedlineDate;
      } else {
        const year = pubDate.Year || '';
        const month = pubDate.Month || '';
        const day = pubDate.Day || '';
        publicationDate = [year, month, day].filter(Boolean).join(' ');
      }
      
      // Extract DOI
      const articleIds = PubmedData.ArticleIdList.ArticleId;
      const doiArticleId = articleIds.find(id => id.IdType === 'doi');
      const doi = doiArticleId ? doiArticleId._ : undefined;
      
      // Extract URL
      const pmcArticleId = articleIds.find(id => id.IdType === 'pmc');
      const url = pmcArticleId 
        ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcArticleId._}/`
        : `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
      
      // Extract publication types
      const publicationTypes = PublicationTypeList.PublicationType.map(type => type._);
      
      // Extract keywords
      const keywords: string[] = [];
      if (KeywordList && KeywordList.Keyword) {
        KeywordList.Keyword.forEach(keyword => {
          keywords.push(keyword._);
        });
      }
      
      // Extract MeSH terms
      const meshTerms: string[] = [];
      if (MeshHeadingList && MeshHeadingList.MeshHeading) {
        MeshHeadingList.MeshHeading.forEach(heading => {
          meshTerms.push(heading.DescriptorName._);
          if (heading.QualifierName) {
            heading.QualifierName.forEach(qualifier => {
              meshTerms.push(`${heading.DescriptorName._}/${qualifier._}`);
            });
          }
        });
      }
      
      return {
        id,
        title: Article.ArticleTitle,
        abstract: abstractText,
        authors,
        publicationDate,
        source: Journal.Title,
        doi,
        url,
        publicationType: publicationTypes,
        databaseSource: this.databaseName,
        keywords: [...keywords, ...meshTerms],
        metadata: {
          journal: Journal.Title,
          journalAbbreviation: Journal.ISOAbbreviation,
          volume: Journal.JournalIssue.Volume,
          issue: Journal.JournalIssue.Issue,
          pagination: Article.Pagination?.MedlinePgn,
          meshTerms,
          publicationStatus: PubmedData.PublicationStatus
        }
      };
    } catch (error) {
      logger.error('Error converting PubMed article to publication', {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      
      throw error;
    }
  }
}
