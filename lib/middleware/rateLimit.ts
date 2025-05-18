import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  // Maximum number of requests allowed in the time window
  limit: number;
  
  // Time window in seconds
  windowMs: number;
  
  // Identifier function to determine the rate limit key (e.g., IP address, user ID)
  identifier: (req: NextRequest) => string | Promise<string>;
  
  // Optional message to return when rate limit is exceeded
  message?: string;
  
  // Optional headers to include in the response
  headers?: boolean;
}

const DEFAULT_CONFIG: Partial<RateLimitConfig> = {
  limit: 100,
  windowMs: 60 * 15, // 15 minutes
  message: 'Too many requests, please try again later.',
  headers: true,
  identifier: (req: NextRequest) => {
    // Default to IP-based rate limiting
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    return `rate-limit:${ip}`;
  }
};

/**
 * Rate limiting middleware for Next.js API routes and pages
 * @param config Rate limit configuration
 * @returns Middleware function
 */
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const options: RateLimitConfig = { ...DEFAULT_CONFIG, ...config } as RateLimitConfig;
  
  return async function rateLimitMiddleware(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Skip rate limiting for non-API routes if desired
      if (!req.nextUrl.pathname.startsWith('/api') && !config.identifier) {
        return next();
      }
      
      // Get the identifier for this request
      const identifier = await options.identifier(req);
      const key = `rate-limit:${identifier}`;
      
      // Check if Redis is available
        logger.warn('Redis client not available for rate limiting, skipping rate limit check');
        return next();
      }
      
      // Get the current count for this identifier
      let currentCount: number;
      
        // Increment the counter
        
        // If this is the first request, set an expiration
        if (currentCount === 1) {
        }
      } else {
        // For mock client, we'll use a simple approach
        currentCount = parseInt(count, 10) + 1;
      }
      
      // Get the remaining time window in seconds
      let ttl: number;
      } else {
        // For mock client, assume the full window
        ttl = options.windowMs;
      }
      
      // Calculate the reset time
      const resetTime = new Date(Date.now() + ttl * 1000);
      
      // Set rate limit headers if enabled
      const headers: Record<string, string> = {};
      if (options.headers) {
        headers['X-RateLimit-Limit'] = options.limit.toString();
        headers['X-RateLimit-Remaining'] = Math.max(0, options.limit - currentCount).toString();
        headers['X-RateLimit-Reset'] = resetTime.getTime().toString();
      }
      
      // If the count exceeds the limit, return a 429 Too Many Requests response
      if (currentCount > options.limit) {
        logger.warn('Rate limit exceeded', { 
          identifier, 
          currentCount, 
          limit: options.limit,
          path: req.nextUrl.pathname
        });
        
        if (options.headers) {
          headers['Retry-After'] = Math.ceil(ttl).toString();
        }
        
        return new NextResponse(
          JSON.stringify({
            error: 'Too Many Requests',
            message: options.message,
            statusCode: 429
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            }
          }
        );
      }
      
      // Call the next middleware or route handler
      const response = await next();
      
      // Add rate limit headers to the response if enabled
      if (options.headers) {
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    } catch (error: any) {
      logger.error('Error in rate limit middleware', { 
        error: error.message,
        stack: error.stack,
        path: req.nextUrl.pathname
      });
      
      // If there's an error, proceed without rate limiting
      return next();
    }
  };
}

/**
 * Create a rate limiter with different configurations based on the path
 * @param configs Map of path patterns to rate limit configurations
 * @returns Middleware function
 */
export function pathBasedRateLimit(
  configs: Record<string, Partial<RateLimitConfig>>
) {
  return async function pathBasedRateLimitMiddleware(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const path = req.nextUrl.pathname;
    
    // Find the first matching path pattern
    const matchingPattern = Object.keys(configs).find(pattern => {
      if (pattern.includes('*')) {
        // Convert glob pattern to regex
        const regexPattern = pattern
          .replace(/\*/g, '.*')
          .replace(/\//g, '\\/');
        return new RegExp(`^${regexPattern}$`).test(path);
      }
      return pattern === path;
    });
    
    if (matchingPattern) {
      // Apply the rate limit for the matching path
      return rateLimit(configs[matchingPattern])(req, next);
    }
    
    // No matching pattern, proceed without rate limiting
    return next();
  };
}

/**
 * Create a rate limiter with different configurations based on the HTTP method
 * @param configs Map of HTTP methods to rate limit configurations
 * @returns Middleware function
 */
export function methodBasedRateLimit(
  configs: Record<string, Partial<RateLimitConfig>>
) {
  return async function methodBasedRateLimitMiddleware(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const method = req.method.toUpperCase();
    
    if (configs[method]) {
      // Apply the rate limit for the matching method
      return rateLimit(configs[method])(req, next);
    }
    
    // No matching method, proceed without rate limiting
    return next();
  };
}

/**
 * Create a user-based rate limiter that uses the user ID from the session
 * @param config Rate limit configuration
 * @returns Middleware function
 */
export function userBasedRateLimit(config: Partial<RateLimitConfig> = {}) {
  return rateLimit({
    ...config,
    identifier: async (req: NextRequest) => {
      // Get the user ID from the session or token
      // This is a simplified example - in a real application, you would
      // extract the user ID from the session or token
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract user ID from token
        const token = authHeader.substring(7);
        // In a real application, you would decode the token and extract the user ID
        return `user:${token}`;
      }
      
      // Fall back to IP-based rate limiting
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
      return `ip:${ip}`;
    }
  });
}
