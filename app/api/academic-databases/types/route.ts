import { NextResponse } from 'next/server';
import { getAcademicDatabaseFactory } from '@/lib/services/academicDatabases/academicDatabaseFactory';
import { logger } from '@/lib/logger';

/**
 * Get available academic database types
 * 
 * This API route returns the list of available academic database types
 * that can be used with the academic database API.
 * 
 * Example:
 * GET /api/academic-databases/types
 */
export async function GET() {
  try {
    // Get the academic database factory
    const factory = getAcademicDatabaseFactory();
    
    // Get the available database types
    const types = factory.getAvailableDatabaseTypes();
    
    // Return the types
    return NextResponse.json(types);
  } catch (error) {
    logger.error('Error getting available academic database types', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'An error occurred while getting available academic database types' },
      { status: 500 }
    );
  }
}
