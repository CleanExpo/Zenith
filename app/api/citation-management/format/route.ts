import { NextRequest, NextResponse } from 'next/server';
import { getCitationService } from '@/lib/services/citationManagement/citationServiceFactory';
import { CitationFormat } from '@/lib/services/citationManagement/baseCitationService';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * Format a citation in a specific format
 * 
 * This API route formats a citation in a specific format.
 * It requires authentication and the following body parameters:
 * - toolType: The citation tool type (e.g., 'zotero', 'mendeley')
 * - apiKey: The API key for the tool
 * - userId: The user ID for the tool
 * - publication: The publication data to format
 * - format: The citation format (e.g., 'apa', 'mla', 'chicago')
 * 
 * Example:
 * POST /api/citation-management/format
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
 *   "format": "apa"
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
    const { toolType, apiKey, userId, publication, format } = body;
    
    // Validate required parameters
    if (!toolType || !apiKey || !userId || !publication || !format) {
      return NextResponse.json(
        { error: 'Missing required parameters: toolType, apiKey, userId, publication, format' },
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
    
    // Validate format
    const validFormats: CitationFormat[] = ['apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver', 'bibtex', 'ris'];
    if (!validFormats.includes(format as CitationFormat)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Get the citation service
    const service = getCitationService(
      toolType as any,
      apiKey,
      userId
    );
    
    // Format the citation
    const formattedCitation = await service.formatCitation(
      publication,
      format as CitationFormat
    );
    
    // Return the formatted citation
    return NextResponse.json({
      formattedCitation
    });
  } catch (error) {
    logger.error('Error formatting citation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'An error occurred while formatting the citation' },
      { status: 500 }
    );
  }
}
