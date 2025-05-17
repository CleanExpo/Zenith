import { NextRequest, NextResponse } from 'next/server';
import { getCitationService } from '@/lib/services/citationManagement/citationServiceFactory';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { AcademicPublication } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';

/**
 * Add a citation to a citation management tool
 * 
 * This API route adds a citation to a citation management tool.
 * It requires authentication and the following body parameters:
 * - toolType: The citation tool type (e.g., 'zotero', 'mendeley')
 * - apiKey: The API key for the tool
 * - userId: The user ID for the tool
 * - publication: The publication data to add
 * 
 * Optional body parameters:
 * - collectionId: The collection ID to add to
 * - notes: Notes to add to the citation
 * - tags: Tags to add to the citation
 * 
 * Example:
 * POST /api/citation-management/add
 * {
 *   "toolType": "zotero",
 *   "apiKey": "abc123",
 *   "userId": "123",
 *   "publication": {
 *     "id": "123",
 *     "title": "Machine Learning",
 *     "authors": ["John Doe", "Jane Smith"],
 *     "abstract": "This is an abstract",
 *     "publicationDate": "2023-01-01",
 *     "source": "Journal of Machine Learning",
 *     "doi": "10.1234/5678",
 *     "url": "https://example.com",
 *     "keywords": ["machine learning", "artificial intelligence"],
 *     "databaseSource": "pubmed"
 *   },
 *   "collectionId": "abc123",
 *   "notes": "This is a note",
 *   "tags": ["important", "read later"]
 * }
 */
export async function POST(request: NextRequest) {
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
    
    // Get the request body
    const body = await request.json();
    const { toolType, apiKey, userId, publication, collectionId, notes, tags } = body;
    
    // Validate required parameters
    if (!toolType || !apiKey || !userId || !publication) {
      return NextResponse.json(
        { error: 'Missing required parameters: toolType, apiKey, userId, publication' },
        { status: 400 }
      );
    }
    
    // Validate publication
    if (!publication.title) {
      return NextResponse.json(
        { error: 'Publication must have a title' },
        { status: 400 }
      );
    }
    
    // Get the citation service
    const service = getCitationService(
      toolType as any,
      apiKey,
      userId
    );
    
    // Add the citation
    const citation = await service.addCitation(
      publication as AcademicPublication,
      collectionId,
      notes,
      tags
    );
    
    // Return the citation
    return NextResponse.json(citation);
  } catch (error) {
    logger.error('Error adding citation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'An error occurred while adding the citation' },
      { status: 500 }
    );
  }
}
