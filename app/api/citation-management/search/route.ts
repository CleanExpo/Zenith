import { NextRequest, NextResponse } from 'next/server';
import { getCitationService } from '@/lib/services/citationManagement/citationServiceFactory';
import { CitationSearchParams } from '@/lib/services/citationManagement/baseCitationService';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client'

/**
 * Search for citations in a citation management tool
 * 
 * This API route searches for citations in a citation management tool.
 * It requires authentication and the following query parameters:
 * - toolType: The citation tool type (e.g., 'zotero', 'mendeley')
 * - apiKey: The API key for the tool
 * - userId: The user ID for the tool
 * - query: The search query
 * 
 * Optional query parameters:
 * - field: The field to search in (e.g., 'title', 'author')
 * - collectionId: The collection ID to search in
 * - limit: The maximum number of results to return
 * - page: The page number for paginated results
 * - tags: Comma-separated list of tags to filter by
 * 
 * Example:
 * GET /api/citation-management/search?toolType=zotero&apiKey=abc123&userId=123&query=machine%20learning&limit=10&page=1
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the query parameters
    const searchParams = request.nextUrl.searchParams;
    const toolType = searchParams.get('toolType');
    const apiKey = searchParams.get('apiKey');
    const userId = searchParams.get('userId');
    const query = searchParams.get('query');
    
    // Validate required parameters
    if (!toolType || !apiKey || !userId || !query) {
      return NextResponse.json(
        { error: 'Missing required parameters: toolType, apiKey, userId, query' },
        { status: 400 }
      );
    }
    
    // Get optional parameters
    const field = searchParams.get('field') || undefined;
    const collectionId = searchParams.get('collectionId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;
    const tags = searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined;
    
    // Create the search parameters
    const params: CitationSearchParams = {
      query,
      field,
      collectionId,
      limit,
      page,
      tags
    };
    
    // Get the citation service
    const service = getCitationService(
      toolType as any,
      apiKey,
      userId
    );
    
    // Search for citations
    const results = await service.searchCitations(params);
    
    // Return the results
    return NextResponse.json(results);
  } catch (error) {
    logger.error('Error searching for citations', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'An error occurred while searching for citations' },
      { status: 500 }
    );
  }
}

