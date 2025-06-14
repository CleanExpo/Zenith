/**
 * Logging Utility
 * Centralized logging configuration with different levels and formats
 */

import winston from 'winston';
import { getEnv, isDevelopment, isProduction } from './validateEnv';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Create the logger
export function createLogger(service?: string): winston.Logger {
  const env = getEnv();
  
  // Determine log level based on environment
  const level = env.LOG_LEVEL || (isDevelopment() ? 'debug' : 'info');
  
  // Create formatters
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, service: logService, ...meta }) => {
      const servicePrefix = logService || service ? `[${logService || service}] ` : '';
      const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
      return `${timestamp} ${level}: ${servicePrefix}${message}${metaString}`;
    })
  );

  const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  // Create transports
  const transports: winston.transport[] = [];

  // Console transport (always enabled in development)
  if (isDevelopment()) {
    transports.push(
      new winston.transports.Console({
        level,
        format: consoleFormat,
      })
    );
  }

  // File transports (enabled in production)
  if (isProduction()) {
    // Error log
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Combined log
    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Console transport for production (less verbose)
    transports.push(
      new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.simple()
        ),
      })
    );
  }

  const logger = winston.createLogger({
    levels,
    level,
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.timestamp(),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] })
    ),
    defaultMeta: service ? { service } : {},
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
  });

  // Handle uncaught exceptions and unhandled rejections
  if (isProduction()) {
    logger.exceptions.handle(
      new winston.transports.File({
        filename: 'logs/exceptions.log',
        format: fileFormat,
      })
    );

    logger.rejections.handle(
      new winston.transports.File({
        filename: 'logs/rejections.log',
        format: fileFormat,
      })
    );
  }

  return logger;
}

// Create default logger instance
export const logger = createLogger('app');

// Express.js HTTP logging middleware
export function createHttpLogger() {
  return winston.createLogger({
    level: 'http',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
    ],
  });
}

// Utility functions for structured logging
export function logError(message: string, error: Error, meta?: Record<string, any>) {
  logger.error(message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...meta,
  });
}

export function logWarning(message: string, meta?: Record<string, any>) {
  logger.warn(message, meta);
}

export function logInfo(message: string, meta?: Record<string, any>) {
  logger.info(message, meta);
}

export function logDebug(message: string, meta?: Record<string, any>) {
  logger.debug(message, meta);
}

// Performance logging
export function logPerformance(operation: string, duration: number, meta?: Record<string, any>) {
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    operation,
    ...meta,
  });
}

// Database operation logging
export function logDatabaseOperation(operation: string, table: string, duration?: number, meta?: Record<string, any>) {
  logger.debug(`Database: ${operation}`, {
    table,
    duration: duration ? `${duration}ms` : undefined,
    operation,
    ...meta,
  });
}

// API request logging
export function logApiRequest(method: string, url: string, statusCode: number, duration: number, meta?: Record<string, any>) {
  const level = statusCode >= 400 ? 'warn' : 'http';
  logger.log(level, `API: ${method} ${url}`, {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ...meta,
  });
}

// Agent operation logging
export function logAgentOperation(agentType: string, operation: string, success: boolean, duration?: number, meta?: Record<string, any>) {
  const level = success ? 'info' : 'error';
  logger.log(level, `Agent: ${agentType} ${operation}`, {
    agentType,
    operation,
    success,
    duration: duration ? `${duration}ms` : undefined,
    ...meta,
  });
}

// Workflow logging
export function logWorkflowEvent(workflowId: string, event: string, meta?: Record<string, any>) {
  logger.info(`Workflow: ${event}`, {
    workflowId,
    event,
    ...meta,
  });
}

// Security logging
export function logSecurityEvent(event: string, user?: string, ip?: string, meta?: Record<string, any>) {
  logger.warn(`Security: ${event}`, {
    event,
    user,
    ip,
    timestamp: new Date().toISOString(),
    ...meta,
  });
}

// Business operation logging
export function logBusinessOperation(businessId: string, operation: string, success: boolean, meta?: Record<string, any>) {
  const level = success ? 'info' : 'error';
  logger.log(level, `Business: ${operation}`, {
    businessId,
    operation,
    success,
    ...meta,
  });
}