import winston from 'winston';

export class Logger {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string = 'Application') {
    this.context = context;
    
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          context: context || this.context,
          message,
          ...meta
        });
      })
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { context: this.context },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ level, message, timestamp, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            })
          )
        })
      ]
    });

    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
      }));
      this.logger.add(new winston.transports.File({
        filename: 'logs/combined.log'
      }));
    }
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  fatal(message: string, meta?: any): void {
    this.logger.error(message, { ...meta, fatal: true });
  }

  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }
}

export default Logger;