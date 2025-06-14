import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { PrismaClient } from '@zenith/database';
import { Logger, AgentManager } from '@zenith/agents';
import { WebSocketService } from './services/websocket';
import { authenticate, optionalAuth } from './middleware/auth';
import { errorHandler, notFoundHandler, healthCheckErrorHandler, gracefulShutdownHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import agentsRoutes from './routes/agents';

// Environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Configuration
const PORT = parseInt(process.env.PORT || '3001');
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize services
const logger = new Logger('Server');
const prisma = new PrismaClient();
let agentManager: AgentManager;
let webSocketService: WebSocketService;

// Create Express app
const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check endpoint (no authentication required)
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check agent system (if initialized)
    const agentSystemHealth = agentManager ? await agentManager.getSystemHealth() : null;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: NODE_ENV,
      services: {
        database: 'healthy',
        agentSystem: agentSystemHealth ? 'healthy' : 'initializing',
        webSocket: webSocketService ? 'healthy' : 'initializing'
      },
      uptime: process.uptime()
    };
    
    res.json(health);
  } catch (error) {
    const errorResponse = healthCheckErrorHandler(error);
    res.status(500).json(errorResponse);
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/business', authenticate, businessRoutes);
app.use('/api/agents', agentsRoutes);

// 404 handler
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize agent system
async function initializeAgentSystem() {
  try {
    logger.info('Initializing agent system...');
    
    // Get singleton instance and initialize
    agentManager = AgentManager.getInstance();
    await agentManager.initialize();
    
    logger.info('✅ Agent system initialized successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize agent system', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // In development, we can continue without agents
    if (NODE_ENV === 'development') {
      logger.warn('⚠️ Continuing without agent system in development mode');
      return false;
    }
    
    throw error;
  }
}

// Initialize WebSocket service
function initializeWebSocket() {
  try {
    logger.info('Initializing WebSocket service...');
    
    webSocketService = new WebSocketService(server, agentManager);
    
    logger.info('✅ WebSocket service initialized successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize WebSocket service', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Continue without WebSocket in development
    if (NODE_ENV === 'development') {
      logger.warn('⚠️ Continuing without WebSocket service in development mode');
      return false;
    }
    
    throw error;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, starting graceful shutdown...');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Cleanup agent system
      if (agentManager) {
        await agentManager.shutdown();
        logger.info('Agent system shutdown complete');
      }
      
      // Cleanup WebSocket service
      if (webSocketService) {
        await webSocketService.shutdown();
        logger.info('WebSocket service shutdown complete');
      }
      
      // Disconnect from database
      await prisma.$disconnect();
      logger.info('Database disconnected');
      
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, starting graceful shutdown...');
  process.emit('SIGTERM');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    logger.info('🚀 Starting Zenith Platform Backend...');
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`Port: ${PORT}`);
    
    // Test database connection
    logger.info('Testing database connection...');
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    
    // Initialize agent system
    const agentSystemInitialized = await initializeAgentSystem();
    
    // Initialize WebSocket service
    const webSocketInitialized = initializeWebSocket();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info('🎉 Zenith Platform Backend Ready!');
      logger.info(`🌐 Server running on http://localhost:${PORT}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API base: http://localhost:${PORT}/api`);
      
      if (agentSystemInitialized) {
        logger.info('🤖 Agent system: Online');
      } else {
        logger.warn('⚠️ Agent system: Offline (check logs)');
      }
      
      if (webSocketInitialized) {
        logger.info('🔌 WebSocket service: Online');
      } else {
        logger.warn('⚠️ WebSocket service: Offline (check logs)');
      }
      
      logger.info('\n' + '='.repeat(50));
      logger.info('🏗️  Available API Endpoints:');
      logger.info('='.repeat(50));
      logger.info('🔐 Authentication:');
      logger.info('  POST /api/auth/register');
      logger.info('  POST /api/auth/login');
      logger.info('  POST /api/auth/refresh');
      logger.info('  POST /api/auth/logout');
      logger.info('');
      logger.info('🏢 Business Management:');
      logger.info('  GET    /api/business');
      logger.info('  POST   /api/business');
      logger.info('  GET    /api/business/:id');
      logger.info('  PUT    /api/business/:id');
      logger.info('  DELETE /api/business/:id');
      logger.info('');
      logger.info('🤖 Agent System:');
      logger.info('  GET  /api/agents/health');
      logger.info('  GET  /api/agents/stats');
      logger.info('  GET  /api/agents/dashboard');
      logger.info('  POST /api/agents/workflows/onboarding');
      logger.info('');
      logger.info('💡 Next Steps:');
      logger.info('  1. Visit http://localhost:3000 for the frontend');
      logger.info('  2. Check health at http://localhost:' + PORT + '/health');
      logger.info('  3. View API docs at http://localhost:' + PORT + '/api/agents/health');
      logger.info('='.repeat(50));
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Start the server
startServer();

// Export for testing
export { app, server };