import { NextRequest, NextResponse } from 'next/server';
import { getAcademicDatabaseService } from '@/lib/services/academicDatabases/academicDatabaseFactory';
import { AcademicSearchParams } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';
import { logger } from '@/lib/logger';

/**
 * Search academic databases
 * 
 * This API route allows searching academic databases like PubMed, Scopus, IEEE, etc.
 * 
 * Query parameters:
 * - database: The database to search (e.g., 'pubmed', 'scopus', 'ieee')
 * - query: The search query
 * - field: The field to search in (e.g., 'title', 'abstract', 'author')
 * - limit: The maximum number of results to return
 * - page: The page number for paginated results
 * - sort: The sort order (e.g., 'relevance', 'date', 'citations')
 * - startDate: The start date for filtering results (format depends on the database)
 * - endDate: The end date for filtering results (format depends on the database)
 * - filters: Additional filters specific to the database (JSON string)
 * 
 * Example:
 * GET /api/academic-databases/search?database=pubmed&query=cancer&field=title&limit=10&page=1&sort=relevance
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get the database to search
    const database = searchParams.get('database');
    if (!database) {
      return NextResponse.json(
        { error: 'Missing required parameter: database' },
        { status: 400 }
      );
    }
    
    // Get the search query
    const query = searchParams.get('query');
    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter: query' },
        { status: 400 }
      );
    }
    
    // Build the search parameters
    const params: AcademicSearchParams = {
      query,
      field: searchParams.get('field') || undefined,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      sort: searchParams.get('sort') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    };
    
    // Parse filters if provided
    if (searchParams.has('filters')) {
      try {
        params.filters = JSON.parse(searchParams.get('filters')!);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid filters parameter: must be a valid JSON string' },
          { status: 400 }
        );
      }
    }
    
    // Get the database service
    try {
      const databaseService = getAcademicDatabaseService(database as any);
      
      // Search the database
      const results = await databaseService.search(params);
      
      // Return the results
      return NextResponse.json(results);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not implemented yet')) {
        return NextResponse.json(
          { error: `Database '${database}' is not supported yet` },
          { status: 501 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    logger.error('Error searching academic database', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'An error occurred while searching the academic database' },
      { status: 500 }
    );
  }
}
