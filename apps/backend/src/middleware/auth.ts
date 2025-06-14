import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserRole } from '@zenith/database';
import { Logger } from '@zenith/agents';

const logger = new Logger('AuthMiddleware');
const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export class AuthenticationError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
  }
}

export class AuthorizationError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Extracts JWT token from request headers
 * @param req Express request object
 * @returns JWT token string or null
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Check for Bearer token format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for simple token format
  return authHeader;
}

/**
 * Verifies JWT token and returns decoded payload
 * @param token JWT token string
 * @returns Decoded JWT payload
 */
function verifyToken(token: string): JwtPayload {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Authentication middleware - verifies JWT token and loads user
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verify the token
    const payload = verifyToken(token);
    
    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      logger.warn('Token valid but user not found', {
        userId: payload.userId,
        email: payload.email
      });
      
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!user.isActive) {
      logger.warn('Authentication attempt by inactive user', {
        userId: user.id,
        email: user.email
      });
      
      return res.status(401).json({
        success: false,
        error: 'Account disabled',
        message: 'Your account has been disabled',
        timestamp: new Date().toISOString()
      });
    }
    
    // Attach user to request
    req.user = user as User;
    req.userId = user.id;
    
    logger.debug('Authentication successful', {
      userId: user.id,
      email: user.email,
      role: user.role,
      endpoint: req.path
    });
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: 'Authentication failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method
    });
    
    return res.status(500).json({
      success: false,
      error: 'Authentication system error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional authentication middleware - loads user if token is present but doesn't require it
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  
  if (!token) {
    return next();
  }
  
  try {
    const payload = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (user && user.isActive) {
      req.user = user as User;
      req.userId = user.id;
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    logger.debug('Optional authentication failed, continuing without user', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  next();
}

/**
 * Role-based authorization middleware
 * @param allowedRoles Array of roles that are allowed to access the endpoint
 */
export function authorize(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This endpoint requires one of the following roles: ${roles.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.debug('Authorization successful', {
      userId: req.user.id,
      userRole: req.user.role,
      endpoint: req.path
    });
    
    next();
  };
}

/**
 * Admin-only authorization middleware
 */
export const requireAdmin = authorize(UserRole.ADMIN);

/**
 * User or Admin authorization middleware
 */
export const requireUser = authorize([UserRole.USER, UserRole.ADMIN]);

/**
 * Resource ownership middleware - ensures user owns the specified resource
 * @param resourceIdParam Parameter name that contains the resource ID
 * @param resourceType Type of resource to check ownership for
 */
export function requireOwnership(resourceIdParam: string, resourceType: 'business') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    
    const resourceId = req.params[resourceIdParam];
    
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        error: 'Resource ID required',
        message: `Parameter '${resourceIdParam}' is required`,
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      let hasAccess = false;
      
      // Admins have access to all resources
      if (req.user.role === UserRole.ADMIN) {
        hasAccess = true;
      } else {
        // Check resource-specific ownership
        switch (resourceType) {
          case 'business':
            const business = await prisma.business.findFirst({
              where: {
                id: resourceId,
                ownerId: req.user.id
              }
            });
            hasAccess = !!business;
            break;
          
          default:
            throw new Error(`Unknown resource type: ${resourceType}`);
        }
      }
      
      if (!hasAccess) {
        logger.warn('Resource access denied', {
          userId: req.user.id,
          resourceType,
          resourceId,
          endpoint: req.path
        });
        
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this resource',
          timestamp: new Date().toISOString()
        });
      }
      
      logger.debug('Resource access granted', {
        userId: req.user.id,
        resourceType,
        resourceId,
        endpoint: req.path
      });
      
      next();
    } catch (error) {
      logger.error('Ownership check failed', {
        userId: req.user.id,
        resourceType,
        resourceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return res.status(500).json({
        success: false,
        error: 'Authorization system error',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Rate limiting middleware for authenticated users
 * @param maxRequests Maximum requests per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    const userRequests = requests.get(userId) || { count: 0, resetTime: now + windowMs };
    
    // Reset counter if window has expired
    if (now > userRequests.resetTime) {
      userRequests.count = 0;
      userRequests.resetTime = now + windowMs;
    }
    
    userRequests.count++;
    requests.set(userId, userRequests);
    
    if (userRequests.count > maxRequests) {
      const resetIn = Math.ceil((userRequests.resetTime - now) / 1000);
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${resetIn} seconds.`,
        retryAfter: resetIn,
        timestamp: new Date().toISOString()
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - userRequests.count).toString(),
      'X-RateLimit-Reset': new Date(userRequests.resetTime).toISOString()
    });
    
    next();
  };
}