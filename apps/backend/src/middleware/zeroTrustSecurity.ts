import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../../packages/agents/src/utils/Logger';
import { MetricsCollector } from '../../../packages/agents/src/monitoring/MetricsCollector';
import { SecurityOrchestrator } from '../../../packages/security/src/zero-trust/SecurityOrchestrator';
import { Permission, ResourceType } from '../../../packages/security/src/zero-trust/AccessControl';

/**
 * Extended Request interface with security context
 */
interface SecureRequest extends Request {
  security?: {
    sessionId: string;
    riskScore: number;
    verificationLevel: number;
    restrictions?: {
      timeLimit?: number;
      resourceLimitations?: string[];
      monitoringLevel?: string;
    };
    evaluationTime: number;
  };
}

/**
 * Zero-Trust Security Middleware Configuration
 */
interface ZeroTrustConfig {
  enabled: boolean;
  strictMode: boolean;
  bypassPaths: string[];
  requireAuthentication: boolean;
  maxRiskScore: number;
  emergencyBypass: boolean;
}

/**
 * Resource mapping for different endpoints
 */
const ENDPOINT_RESOURCE_MAP: Record<string, { type: ResourceType; getIdentifier: (req: Request) => string }> = {
  '/api/businesses': {
    type: ResourceType.BUSINESS,
    getIdentifier: (req) => req.params.id || 'new',
  },
  '/api/users': {
    type: ResourceType.USER,
    getIdentifier: (req) => req.params.id || req.user?.id || 'unknown',
  },
  '/api/agents': {
    type: ResourceType.AGENT,
    getIdentifier: (req) => req.params.type || 'general',
  },
  '/api/queue': {
    type: ResourceType.QUEUE,
    getIdentifier: (req) => req.params.queueType || 'general',
  },
  '/api/system': {
    type: ResourceType.SYSTEM,
    getIdentifier: () => 'system',
  },
  '/api/data': {
    type: ResourceType.DATA,
    getIdentifier: (req) => req.params.id || 'general',
  },
};

/**
 * Permission mapping for HTTP methods and endpoints
 */
const METHOD_PERMISSION_MAP: Record<string, Record<string, Permission>> = {
  GET: {
    '/api/businesses': Permission.BUSINESS_READ,
    '/api/users': Permission.USER_READ,
    '/api/agents': Permission.AGENT_EXECUTE,
    '/api/queue': Permission.QUEUE_VIEW,
    '/api/system': Permission.SYSTEM_MONITOR,
    '/api/data': Permission.DATA_READ,
  },
  POST: {
    '/api/businesses': Permission.BUSINESS_CREATE,
    '/api/users': Permission.USER_MANAGE,
    '/api/agents': Permission.AGENT_EXECUTE,
    '/api/queue': Permission.QUEUE_MANAGE,
    '/api/system': Permission.SYSTEM_CONFIG,
    '/api/data': Permission.DATA_WRITE,
  },
  PUT: {
    '/api/businesses': Permission.BUSINESS_UPDATE,
    '/api/users': Permission.USER_UPDATE,
    '/api/agents': Permission.AGENT_MANAGE,
    '/api/queue': Permission.QUEUE_MANAGE,
    '/api/system': Permission.SYSTEM_CONFIG,
    '/api/data': Permission.DATA_WRITE,
  },
  PATCH: {
    '/api/businesses': Permission.BUSINESS_UPDATE,
    '/api/users': Permission.USER_UPDATE,
    '/api/agents': Permission.AGENT_CONFIG,
    '/api/queue': Permission.QUEUE_MANAGE,
    '/api/system': Permission.SYSTEM_CONFIG,
    '/api/data': Permission.DATA_WRITE,
  },
  DELETE: {
    '/api/businesses': Permission.BUSINESS_DELETE,
    '/api/users': Permission.USER_DELETE,
    '/api/agents': Permission.AGENT_MANAGE,
    '/api/queue': Permission.QUEUE_ADMIN,
    '/api/system': Permission.SYSTEM_ADMIN,
    '/api/data': Permission.DATA_DELETE,
  },
};

/**
 * Zero-Trust Security Middleware Factory
 */
export function createZeroTrustMiddleware(
  securityOrchestrator: SecurityOrchestrator,
  logger: Logger,
  metrics: MetricsCollector,
  config: ZeroTrustConfig = {
    enabled: true,
    strictMode: false,
    bypassPaths: ['/health', '/api/auth/login', '/api/auth/register'],
    requireAuthentication: true,
    maxRiskScore: 0.7,
    emergencyBypass: false,
  }
) {
  return async (req: SecureRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // Skip if disabled or path is bypassed
      if (!config.enabled || config.bypassPaths.some(path => req.path.startsWith(path))) {
        return next();
      }
      
      // Emergency bypass check
      if (config.emergencyBypass && req.headers['x-emergency-bypass']) {
        logger.warn(`Emergency bypass used for ${req.path} from ${req.ip}`);
        metrics.incrementCounter('security.emergency_bypass');
        return next();
      }
      
      // Extract security context
      const securityContext = await extractSecurityContext(req);
      
      // Determine resource and permission
      const { resource, permission } = determineResourceAndPermission(req);
      
      // Perform security evaluation
      const securityDecision = await securityOrchestrator.evaluateSecurity({
        userId: req.user?.id,
        action: permission,
        resource,
        context: {
          ipAddress: getClientIP(req),
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint: generateDeviceFingerprint(req),
          sessionId: req.sessionID,
          requestPath: req.path,
          method: req.method,
          headers: req.headers as Record<string, string>,
        },
        credentials: {
          token: extractToken(req),
        },
      });
      
      // Check decision
      if (!securityDecision.allowed) {
        const errorResponse = {
          success: false,
          error: 'Security evaluation failed',
          reason: securityDecision.reason,
          requiredActions: securityDecision.requiredActions,
          code: determineErrorCode(securityDecision),
        };
        
        // Log security denial
        logger.warn(`Security denied: ${req.method} ${req.path} - ${securityDecision.reason}`, {
          userId: req.user?.id,
          ip: getClientIP(req),
          userAgent: req.headers['user-agent'],
          reason: securityDecision.reason,
          confidence: securityDecision.confidence,
        });
        
        metrics.incrementCounter('security.requests.denied', {
          method: req.method,
          path: req.path,
          reason: securityDecision.reason.split(':')[0],
        });
        
        return res.status(errorResponse.code).json(errorResponse);
      }
      
      // Check risk score in strict mode
      if (config.strictMode && securityDecision.confidence < (1 - config.maxRiskScore)) {
        logger.warn(`High risk request in strict mode: ${req.method} ${req.path}`, {
          confidence: securityDecision.confidence,
          riskScore: 1 - securityDecision.confidence,
          threshold: config.maxRiskScore,
        });
        
        return res.status(403).json({
          success: false,
          error: 'Request risk too high for strict mode',
          riskScore: 1 - securityDecision.confidence,
          threshold: config.maxRiskScore,
        });
      }
      
      // Add security context to request
      req.security = {
        sessionId: securityContext.sessionId || 'unknown',
        riskScore: 1 - securityDecision.confidence,
        verificationLevel: securityContext.verificationLevel || 1,
        restrictions: securityDecision.restrictions,
        evaluationTime: securityDecision.metadata.evaluationTime,
      };
      
      // Add security headers to response
      addSecurityHeaders(res, securityDecision);
      
      // Log successful evaluation
      logger.debug(`Security evaluation passed: ${req.method} ${req.path}`, {
        userId: req.user?.id,
        confidence: securityDecision.confidence,
        evaluationTime: securityDecision.metadata.evaluationTime,
        componentsEvaluated: securityDecision.metadata.componentsEvaluated,
      });
      
      metrics.recordHistogram('security.evaluation.duration', securityDecision.metadata.evaluationTime);
      metrics.incrementCounter('security.requests.allowed', {
        method: req.method,
        path: req.path,
        confidence_level: getConfidenceLevel(securityDecision.confidence),
      });
      
      // Set up monitoring for restricted requests
      if (securityDecision.restrictions) {
        setupRequestMonitoring(req, res, securityDecision.restrictions);
      }
      
      next();
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Zero-trust middleware error: ${req.method} ${req.path}`, error);
      metrics.incrementCounter('security.middleware.errors');
      
      // In strict mode, deny on error; otherwise, allow with warning
      if (config.strictMode) {
        return res.status(500).json({
          success: false,
          error: 'Security evaluation error',
          message: 'Request denied due to security system error',
        });
      } else {
        logger.warn(`Security evaluation error, allowing request in non-strict mode: ${req.path}`);
        next();
      }
    }
  };
}

/**
 * Extract security context from request
 */
async function extractSecurityContext(req: Request): Promise<{
  sessionId?: string;
  verificationLevel?: number;
  deviceFingerprint: string;
}> {
  return {
    sessionId: req.sessionID,
    verificationLevel: req.user?.verificationLevel,
    deviceFingerprint: generateDeviceFingerprint(req),
  };
}

/**
 * Determine resource and permission for request
 */
function determineResourceAndPermission(req: Request): {
  resource: { type: ResourceType; identifier: string; attributes?: Record<string, any> };
  permission: Permission;
} {
  // Find matching endpoint pattern
  const endpointPattern = Object.keys(ENDPOINT_RESOURCE_MAP).find(pattern => 
    req.path.startsWith(pattern)
  );
  
  let resourceType = ResourceType.SYSTEM;
  let resourceId = 'unknown';
  
  if (endpointPattern) {
    const mapping = ENDPOINT_RESOURCE_MAP[endpointPattern];
    resourceType = mapping.type;
    resourceId = mapping.getIdentifier(req);
  }
  
  // Determine permission
  let permission = Permission.DATA_READ; // Default
  
  const methodPermissions = METHOD_PERMISSION_MAP[req.method];
  if (methodPermissions && endpointPattern) {
    permission = methodPermissions[endpointPattern] || permission;
  }
  
  return {
    resource: {
      type: resourceType,
      identifier: resourceId,
      attributes: {
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
      },
    },
    permission,
  };
}

/**
 * Extract authentication token from request
 */
function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for token in cookies
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  
  return undefined;
}

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Generate device fingerprint
 */
function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const ip = getClientIP(req);
  
  // Simple fingerprinting - could be enhanced
  const fingerprint = `${userAgent}:${acceptLanguage}:${acceptEncoding}:${ip}`;
  
  return Buffer.from(fingerprint).toString('base64').substring(0, 32);
}

/**
 * Determine error code based on security decision
 */
function determineErrorCode(securityDecision: any): number {
  if (securityDecision.reason.includes('Authentication')) {
    return 401; // Unauthorized
  }
  
  if (securityDecision.reason.includes('Access denied') || 
      securityDecision.reason.includes('permission')) {
    return 403; // Forbidden
  }
  
  if (securityDecision.reason.includes('Rate limit') || 
      securityDecision.reason.includes('DDoS')) {
    return 429; // Too Many Requests
  }
  
  if (securityDecision.reason.includes('Network security')) {
    return 403; // Forbidden
  }
  
  return 403; // Default to Forbidden
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(res: Response, securityDecision: any): void {
  // Standard security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Zero-trust specific headers
  res.setHeader('X-Security-Evaluation', 'passed');
  res.setHeader('X-Security-Confidence', securityDecision.confidence.toFixed(3));
  res.setHeader('X-Security-Components', securityDecision.metadata.componentsEvaluated.join(','));
  
  // Conditional headers based on security level
  if (securityDecision.confidence < 0.8) {
    res.setHeader('X-Security-Level', 'enhanced-monitoring');
  }
  
  if (securityDecision.restrictions) {
    res.setHeader('X-Security-Restrictions', 'active');
    
    if (securityDecision.restrictions.timeLimit) {
      res.setHeader('X-Security-Time-Limit', securityDecision.restrictions.timeLimit.toString());
    }
  }
}

/**
 * Get confidence level category
 */
function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  if (confidence >= 0.5) return 'low';
  return 'very_low';
}

/**
 * Setup request monitoring for restricted requests
 */
function setupRequestMonitoring(
  req: SecureRequest,
  res: Response,
  restrictions: any
): void {
  if (restrictions.monitoringLevel === 'full') {
    // Log all request details
    const originalSend = res.send;
    res.send = function(data) {
      console.log(`[MONITORED] ${req.method} ${req.path} - Response: ${data?.substring(0, 100)}...`);
      return originalSend.call(this, data);
    };
  }
  
  if (restrictions.timeLimit) {
    // Set timeout for long-running requests
    req.setTimeout(restrictions.timeLimit, () => {
      console.log(`[TIMEOUT] Request ${req.method} ${req.path} exceeded time limit`);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          message: 'Request exceeded security time limit',
        });
      }
    });
  }
}

/**
 * Admin bypass middleware for emergency situations
 */
export function createEmergencyBypassMiddleware(
  securityOrchestrator: SecurityOrchestrator,
  logger: Logger
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const bypassToken = req.headers['x-emergency-bypass'] as string;
    
    if (!bypassToken) {
      return next();
    }
    
    // Validate emergency bypass token (implement proper validation)
    const isValidBypass = await validateEmergencyBypass(bypassToken);
    
    if (isValidBypass) {
      logger.error(`Emergency bypass activated for ${req.path} from ${req.ip}`, {
        bypassToken: bypassToken.substring(0, 10) + '...',
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
      });
      
      // Set bypass flag
      req.headers['x-security-bypass'] = 'emergency';
      
      return next();
    }
    
    logger.warn(`Invalid emergency bypass attempted for ${req.path} from ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid emergency bypass token',
    });
  };
}

/**
 * Validate emergency bypass token
 */
async function validateEmergencyBypass(token: string): Promise<boolean> {
  // Implement proper emergency bypass validation
  // This could involve checking against a secure store, time-based tokens, etc.
  const validTokens = process.env.EMERGENCY_BYPASS_TOKENS?.split(',') || [];
  return validTokens.includes(token);
}

/**
 * Security metrics middleware
 */
export function createSecurityMetricsMiddleware(metrics: MetricsCollector) {
  return (req: SecureRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      metrics.recordHistogram('http.request.duration', duration, {
        method: req.method,
        path: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
      });
      
      if (req.security) {
        metrics.recordGauge('security.risk_score', req.security.riskScore, {
          path: req.path,
          method: req.method,
        });
        
        metrics.recordHistogram('security.evaluation_time', req.security.evaluationTime);
      }
      
      // Record security-related status codes
      if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
        metrics.incrementCounter('security.blocked_requests', {
          status_code: res.statusCode.toString(),
          path: req.path,
        });
      }
    });
    
    next();
  };
}

export default {
  createZeroTrustMiddleware,
  createEmergencyBypassMiddleware,
  createSecurityMetricsMiddleware,
};