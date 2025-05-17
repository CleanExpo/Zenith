// Basic Logger Utility
// This can be expanded with different log levels, transports (e.g., to a logging service),
// and structured logging as needed.

enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

const getTimestamp = (): string => new Date().toISOString();

const log = (level: LogLevel, message: string, context?: unknown): void => {
  const timestamp = getTimestamp();
  const logEntry: {
    timestamp: string;
    level: LogLevel;
    message: string;
    details?: unknown;
  } = {
    timestamp,
    level,
    message,
  };

  if (context !== undefined) {
    logEntry.details = context;
  }

  // Output to console
  // In a production environment, you might send this to a logging service
  if (level === LogLevel.ERROR) {
    console.error(JSON.stringify(logEntry, null, 2));
  } else if (level === LogLevel.WARN) {
    console.warn(JSON.stringify(logEntry, null, 2));
  } else {
    console.log(JSON.stringify(logEntry, null, 2));
  }
};

export const logger = {
  debug: (message: string, context?: unknown) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: unknown) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: unknown) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: unknown) => log(LogLevel.ERROR, message, context),
};

// Example Usage:
// import { logger } from '@/lib/logger';
// logger.info('User logged in', { userId: '123' });
// logger.error('Failed to process payment', { error: 'Insufficient funds', transactionId: 'xyz' });
