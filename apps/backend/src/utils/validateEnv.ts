/**
 * Environment Variables Validation
 * Validates required environment variables at startup
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // JWT Secrets
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().optional(),
  
  // Redis (for BullMQ)
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  
  // Server Configuration
  PORT: z.string().regex(/^\d+$/).optional().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  
  // Frontend URL
  FRONTEND_URL: z.string().url().optional().default('http://localhost:3000'),
  
  // OpenAI API (for content generation and visual assets)
  OPENAI_API_KEY: z.string().optional(),
  
  // External Services
  SENDGRID_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  
  // Analytics Services
  GOOGLE_ANALYTICS_KEY: z.string().optional(),
  GOOGLE_SEARCH_CONSOLE_KEY: z.string().optional(),
  
  // Webhook Secrets
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().optional().default('us-east-1'),
  
  // Monitoring and Logging
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).optional().default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).optional().default('100'),
  
  // Security
  CORS_ORIGIN: z.string().optional(),
  TRUST_PROXY: z.string().optional().default('false'),
  
  // Agent System Configuration
  AGENT_CONCURRENCY_LIMIT: z.string().regex(/^\d+$/).optional().default('10'),
  AGENT_TIMEOUT_MS: z.string().regex(/^\d+$/).optional().default('300000'), // 5 minutes
  AGENT_RETRY_ATTEMPTS: z.string().regex(/^\d+$/).optional().default('3'),
  
  // Queue Configuration
  QUEUE_CONCURRENCY: z.string().regex(/^\d+$/).optional().default('5'),
  QUEUE_RETRY_ATTEMPTS: z.string().regex(/^\d+$/).optional().default('3'),
  QUEUE_RETRY_DELAY: z.string().regex(/^\d+$/).optional().default('60000'), // 1 minute
});

type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig;

export function validateEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    
    // Set defaults for optional JWT refresh secret
    if (!validatedEnv.JWT_REFRESH_SECRET) {
      validatedEnv.JWT_REFRESH_SECRET = validatedEnv.JWT_SECRET;
    }
    
    console.log('✅ Environment variables validated successfully');
    
    // Log configuration (without secrets)
    console.log('📋 Configuration:', {
      nodeEnv: validatedEnv.NODE_ENV,
      port: validatedEnv.PORT,
      frontendUrl: validatedEnv.FRONTEND_URL,
      redisUrl: validatedEnv.REDIS_URL,
      hasOpenAI: !!validatedEnv.OPENAI_API_KEY,
      hasSendGrid: !!validatedEnv.SENDGRID_API_KEY,
      hasTwilio: !!validatedEnv.TWILIO_ACCOUNT_SID,
      hasAWS: !!validatedEnv.AWS_ACCESS_KEY_ID,
      hasSentry: !!validatedEnv.SENTRY_DSN,
      logLevel: validatedEnv.LOG_LEVEL,
      agentConcurrency: validatedEnv.AGENT_CONCURRENCY_LIMIT,
      queueConcurrency: validatedEnv.QUEUE_CONCURRENCY,
    });
    
    return validatedEnv;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      console.error('\n📝 Required environment variables:');
      console.error('  - DATABASE_URL: PostgreSQL connection string');
      console.error('  - JWT_SECRET: Secret for JWT token signing (min 32 chars)');
      console.error('\n🔧 Optional environment variables:');
      console.error('  - REDIS_URL: Redis connection string (default: redis://localhost:6379)');
      console.error('  - OPENAI_API_KEY: OpenAI API key for AI features');
      console.error('  - SENDGRID_API_KEY: SendGrid API key for emails');
      console.error('  - AWS_ACCESS_KEY_ID: AWS credentials for file storage');
      console.error('  - SENTRY_DSN: Sentry DSN for error monitoring');
      
      process.exit(1);
    }
    
    console.error('❌ Unexpected error during environment validation:', error);
    process.exit(1);
  }
}

export function getEnv(): EnvConfig {
  if (!validatedEnv) {
    throw new Error('Environment not validated. Call validateEnv() first.');
  }
  return validatedEnv;
}

export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}

// Utility functions for common environment checks
export function hasOpenAI(): boolean {
  return !!getEnv().OPENAI_API_KEY;
}

export function hasEmailService(): boolean {
  return !!getEnv().SENDGRID_API_KEY;
}

export function hasSMSService(): boolean {
  return !!(getEnv().TWILIO_ACCOUNT_SID && getEnv().TWILIO_AUTH_TOKEN);
}

export function hasFileStorage(): boolean {
  return !!(getEnv().AWS_ACCESS_KEY_ID && getEnv().AWS_SECRET_ACCESS_KEY && getEnv().AWS_S3_BUCKET);
}

export function hasMonitoring(): boolean {
  return !!getEnv().SENTRY_DSN;
}