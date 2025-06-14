import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { Logger } from '@zenith/agents';

const logger = new Logger('ValidationMiddleware');

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class ValidationException extends Error {
  public errors: ValidationError[];
  public statusCode: number;

  constructor(errors: ValidationError[], message = 'Validation failed') {
    super(message);
    this.name = 'ValidationException';
    this.errors = errors;
    this.statusCode = 400;
  }
}

/**
 * Validates request body against a Zod schema
 * @param schema Zod schema to validate against
 * @param property Request property to validate ('body', 'query', 'params')
 */
export function validate(schema: ZodSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[property];
      
      // Parse and validate the data
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated/transformed data
      req[property] = validatedData;
      
      logger.debug(`Validation successful for ${property}`, {
        endpoint: req.path,
        method: req.method
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        logger.warn('Validation failed', {
          endpoint: req.path,
          method: req.method,
          errors: validationErrors
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }
      
      // Handle unexpected validation errors
      logger.error('Unexpected validation error', {
        endpoint: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Validates multiple request properties
 * @param schemas Object with property names as keys and schemas as values
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];
    
    // Validate each specified property
    for (const [property, schema] of Object.entries(schemas)) {
      if (schema) {
        try {
          const validatedData = schema.parse(req[property as keyof Request]);
          (req as any)[property] = validatedData;
        } catch (error) {
          if (error instanceof ZodError) {
            const propertyErrors = error.errors.map(err => ({
              field: `${property}.${err.path.join('.')}`,
              message: err.message,
              code: err.code
            }));
            errors.push(...propertyErrors);
          }
        }
      }
    }
    
    if (errors.length > 0) {
      logger.warn('Multi-property validation failed', {
        endpoint: req.path,
        method: req.method,
        errors
      });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.debug('Multi-property validation successful', {
      endpoint: req.path,
      method: req.method,
      properties: Object.keys(schemas)
    });
    
    next();
  };
}

/**
 * Optional validation - only validates if data is present
 * @param schema Zod schema to validate against
 * @param property Request property to validate
 */
export function validateOptional(schema: ZodSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[property];
    
    // Skip validation if no data is present
    if (!dataToValidate || (typeof dataToValidate === 'object' && Object.keys(dataToValidate).length === 0)) {
      return next();
    }
    
    // Use regular validation if data is present
    return validate(schema, property)(req, res, next);
  };
}

/**
 * Sanitizes input data by removing potentially dangerous characters
 * @param options Sanitization options
 */
export function sanitize(options: {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
} = {}) {
  const {
    allowHtml = false,
    maxLength = 10000,
    trimWhitespace = true
  } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        let sanitized = value;
        
        // Trim whitespace if enabled
        if (trimWhitespace) {
          sanitized = sanitized.trim();
        }
        
        // Remove HTML tags if not allowed
        if (!allowHtml) {
          sanitized = sanitized.replace(/<[^>]*>/g, '');
        }
        
        // Truncate if too long
        if (sanitized.length > maxLength) {
          sanitized = sanitized.substring(0, maxLength);
        }
        
        return sanitized;
      }
      
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      
      if (value && typeof value === 'object') {
        const sanitizedObj: any = {};
        for (const [key, val] of Object.entries(value)) {
          sanitizedObj[key] = sanitizeValue(val);
        }
        return sanitizedObj;
      }
      
      return value;
    };
    
    // Sanitize body, query, and params
    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }
    
    if (req.params) {
      req.params = sanitizeValue(req.params);
    }
    
    next();
  };
}