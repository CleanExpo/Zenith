import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { redisClient } from '@/lib/utils/redis';
import { logger } from '@/lib/logger';

/**
 * Health check endpoint for load balancers and monitoring systems
 * 
 * This endpoint performs checks on various system components:
 * - API server (this endpoint itself)
 * - Database connection (Supabase)
 * - Redis connection
 * 
 * Response format:
 * {
 *   status: 'healthy' | 'degraded' | 'unhealthy',
 *   timestamp: ISO string,
 *   version: string,
 *   services: {
 *     api: { status: 'healthy' | 'unhealthy', responseTime: number },
 *     database: { status: 'healthy' | 'unhealthy', responseTime: number },
 *     redis: { status: 'healthy' | 'unhealthy', responseTime: number }
 *   },
 *   details: {
 *     api: { message: string },
 *     database: { message: string },
 *     redis: { message: string }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const appVersion = process.env.APP_VERSION || '1.0.0';
  
  // Initialize response object
  const healthResponse = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    version: appVersion,
    services: {
      api: { status: 'healthy' as 'healthy' | 'unhealthy', responseTime: 0 },
      database: { status: 'healthy' as 'healthy' | 'unhealthy', responseTime: 0 },
      redis: { status: 'healthy' as 'healthy' | 'unhealthy', responseTime: 0 }
    },
    details: {
      api: { message: 'API server is responding normally' },
      database: { message: '' },
      redis: { message: '' }
    }
  };
  
  // Check database connection
  const dbStartTime = Date.now();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('research_projects').select('id').limit(1);
    
    if (error) {
      throw error;
    }
    
    healthResponse.services.database.responseTime = Date.now() - dbStartTime;
    healthResponse.details.database.message = 'Database connection successful';
  } catch (error: any) {
    healthResponse.services.database.status = 'unhealthy';
    healthResponse.services.database.responseTime = Date.now() - dbStartTime;
    healthResponse.details.database.message = `Database connection failed: ${error.message}`;
    healthResponse.status = 'degraded';
    
    logger.error('Health check - Database connection failed', { 
      error: error.message,
      stack: error.stack
    });
  }
  
  // Check Redis connection
  const redisStartTime = Date.now();
  try {
    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }
    
    // Test Redis connection with a simple operation
    await redisClient.set('health_check', 'ok', 'EX', 10);
    const testValue = await redisClient.get('health_check');
    
    if (testValue !== 'ok') {
      throw new Error('Redis test operation failed');
    }
    
    healthResponse.services.redis.responseTime = Date.now() - redisStartTime;
    healthResponse.details.redis.message = 'Redis connection successful';
  } catch (error: any) {
    healthResponse.services.redis.status = 'unhealthy';
    healthResponse.services.redis.responseTime = Date.now() - redisStartTime;
    healthResponse.details.redis.message = `Redis connection failed: ${error.message}`;
    
    // Redis failure is not critical in development (we have fallbacks)
    if (process.env.NODE_ENV === 'development') {
      healthResponse.details.redis.message += ' (using fallback in development)';
    } else {
      healthResponse.status = 'degraded';
    }
    
    logger.error('Health check - Redis connection failed', { 
      error: error.message,
      stack: error.stack
    });
  }
  
  // Calculate API response time
  healthResponse.services.api.responseTime = Date.now() - startTime;
  
  // Determine overall status
  if (healthResponse.services.database.status === 'unhealthy') {
    healthResponse.status = 'unhealthy';
  } else if (healthResponse.services.redis.status === 'unhealthy' && process.env.NODE_ENV !== 'development') {
    healthResponse.status = 'degraded';
  }
  
  // Log health check result
  logger.info('Health check completed', { 
    status: healthResponse.status,
    responseTime: healthResponse.services.api.responseTime
  });
  
  // Return health check response
  return NextResponse.json(healthResponse, {
    status: healthResponse.status === 'unhealthy' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  });
}

/**
 * Health check endpoint for load balancers that only need a simple response
 * This is useful for load balancers that just need to know if the server is up
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
