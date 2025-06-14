import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@zenith/database';
import { Logger } from '@zenith/agents';

const logger = new Logger('ErrorHandler');

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  code?: string;
  timestamp: string;
  path?: string;
  method?: string;
  stack?: string;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: any) {
    super(`${service} service is currently unavailable`, 503, true, 'SERVICE_UNAVAILABLE', details);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Handles Prisma database errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      const fieldName = field && field.length > 0 ? field[0] : 'field';
      return new ConflictError(`${fieldName} already exists`, {
        field: fieldName,
        constraint: 'unique'
      });
    }
    
    case 'P2025': {
      // Record not found
      return new NotFoundError('Record');
    }
    
    case 'P2003': {
      // Foreign key constraint violation
      return new ValidationError('Related record not found', {
        constraint: 'foreign_key',
        field: error.meta?.field_name
      });
    }
    
    case 'P2014': {
      // Invalid ID
      return new ValidationError('Invalid ID provided', {
        constraint: 'invalid_id'
      });
    }
    
    case 'P2021': {
      // Table not found
      return new AppError('Database schema error', 500, false, 'DATABASE_SCHEMA_ERROR');
    }
    
    case 'P2024': {
      // Connection timeout
      return new ServiceUnavailableError('Database', {
        reason: 'connection_timeout'
      });
    }
    
    default: {
      logger.error('Unhandled Prisma error', {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
      
      return new AppError('Database operation failed', 500, true, 'DATABASE_ERROR', {
        code: error.code
      });
    }
  }
}

/**
 * Handles JSON Web Token errors
 */
function handleJWTError(error: Error): AppError {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }
  
  return new AuthenticationError('Token verification failed');
}

/**
 * Formats error response
 */
function formatErrorResponse(
  error: AppError,
  req: Request,
  includeStack: boolean = false
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: error.name || 'Error',
    message: error.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  if (error.code) {
    response.code = error.code;
  }

  if (error.details) {
    response.details = error.details;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Central error handling middleware
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let appError: AppError;

  // Handle known error types
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    appError = new ServiceUnavailableError('Database', {
      reason: 'unknown_database_error'
    });
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    appError = new ServiceUnavailableError('Database', {
      reason: 'initialization_error'
    });
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Invalid data provided', {
      reason: 'validation_error'
    });
  } else if (error.name && error.name.includes('JWT')) {
    appError = handleJWTError(error);
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message, error.details);
  } else if (error.code === 'ECONNREFUSED') {
    appError = new ServiceUnavailableError('External Service', {
      reason: 'connection_refused'
    });
  } else if (error.code === 'ETIMEDOUT') {
    appError = new ServiceUnavailableError('External Service', {
      reason: 'timeout'
    });
  } else {
    // Unknown error
    appError = new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message || 'Unknown error',
      500,
      false,
      'INTERNAL_ERROR'
    );
  }

  // Log the error
  const logLevel = appError.statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Request error', {
    error: appError.message,
    statusCode: appError.statusCode,
    code: appError.code,
    path: req.path,
    method: req.method,
    userId: (req as any).userId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: appError.stack,
    isOperational: appError.isOperational
  });

  // Send error response
  const includeStack = process.env.NODE_ENV !== 'production' && appError.statusCode >= 500;
  const errorResponse = formatErrorResponse(appError, req, includeStack);
  
  res.status(appError.statusCode).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
}

/**
 * Graceful error response for critical system errors
 */
export function gracefulShutdownHandler(req: Request, res: Response): void {
  res.status(503).json({
    success: false,
    error: 'Service Unavailable',
    message: 'Server is shutting down, please try again later',
    timestamp: new Date().toISOString()
  });
}

/**
 * Health check error handler
 */
export function healthCheckErrorHandler(error: any): {
  status: 'unhealthy';
  error: string;
  timestamp: string;
} {
  logger.error('Health check failed', {
    error: error.message,
    stack: error.stack
  });

  return {
    status: 'unhealthy',
    error: error.message || 'Health check failed',
    timestamp: new Date().toISOString()
  };
}