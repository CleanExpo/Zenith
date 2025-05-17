import { NextResponse } from 'next/server';
import { getAvailableCitationToolTypes } from '@/lib/services/citationManagement/citationServiceFactory';
import { logger } from '@/lib/logger';

/**
 * Get available citation management tool types
 * 
 * This API route returns the list of available citation management tool types
 * that can be used with the citation management API.
 * 
 * Example:
 * GET /api/citation-management/types
 */
export async function GET() {
  try {
    // Get the available tool types
    const types = getAvailableCitationToolTypes();
    
    // Return the types
    return NextResponse.json(types);
  } catch (error) {
    logger.error('Error getting available citation management tool types', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'An error occurred while getting available citation management tool types' },
      { status: 500 }
    );
  }
}
