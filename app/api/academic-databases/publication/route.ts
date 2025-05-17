import { NextRequest, NextResponse } from 'next/server';
import { getAcademicDatabaseService } from '@/lib/services/academicDatabases/academicDatabaseFactory';
import { logger } from '@/lib/logger';

/**
 * Get a publication from an academic database by ID
 * 
 * This API route allows retrieving a specific publication from academic databases
 * like PubMed, Scopus, IEEE, etc. by its ID.
 * 
 * Query parameters:
 * - database: The database to search (e.g., 'pubmed', 'scopus', 'ieee')
 * - id: The publication ID
 * 
 * Example:
 * GET /api/academic-databases/publication?database=pubmed&id=12345678
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
    
    // Get the publication ID
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Get the database service
    try {
      const databaseService = getAcademicDatabaseService(database as any);
      
      // Get the publication
      const publication = await databaseService.getPublicationById(id);
      
      // Return the publication
      return NextResponse.json(publication);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not implemented yet')) {
        return NextResponse.json(
          { error: `Database '${database}' is not supported yet` },
          { status: 501 }
        );
      }
      
      if (error instanceof Error && error.message.includes('No article found for ID')) {
        return NextResponse.json(
          { error: `Publication with ID '${id}' not found in database '${database}'` },
          { status: 404 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    logger.error('Error getting publication from academic database', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'An error occurred while getting the publication from the academic database' },
      { status: 500 }
    );
  }
}
