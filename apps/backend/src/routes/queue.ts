import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Logger } from '../../../packages/agents/src/utils/Logger';
import { QueueIntegration, AgentQueueRequest, WorkflowRequest } from '../../../packages/agents/src/queue/QueueIntegration';
import { QueueType, JobPriority } from '../../../packages/agents/src/queue/AdvancedQueueManager';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

/**
 * Queue Management API Routes
 */
export function createQueueRoutes(
  queueIntegration: QueueIntegration,
  logger: Logger
): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authenticate);

  /**
   * POST /api/queue/agent/execute
   * Execute a single agent through the queue system
   */
  router.post('/agent/execute',
    [
      body('agentType').isString().notEmpty().withMessage('Agent type is required'),
      body('businessId').isUUID().withMessage('Valid business ID is required'),
      body('userId').isUUID().withMessage('Valid user ID is required'),
      body('priority').isIn(Object.values(JobPriority)).withMessage('Valid priority is required'),
      body('data').isObject().withMessage('Agent data must be an object'),
      body('options.deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
      body('options.timeout').optional().isInt({ min: 1000, max: 3600000 }).withMessage('Timeout must be between 1s and 1h'),
      body('options.resources.cpu').optional().isFloat({ min: 0.1, max: 16 }).withMessage('CPU must be between 0.1 and 16'),
      body('options.resources.memory').optional().isInt({ min: 64, max: 32768 }).withMessage('Memory must be between 64MB and 32GB'),
    ],
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        // Check authorization - user can only execute for their own businesses
        const { businessId } = req.body;
        if (req.user.role !== 'admin' && !req.user.businesses?.includes(businessId)) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to execute agents for this business',
          });
        }

        const request: AgentQueueRequest = {
          agentType: req.body.agentType,
          businessId: req.body.businessId,
          userId: req.body.userId,
          priority: req.body.priority,
          data: req.body.data,
          options: {
            deadline: req.body.options?.deadline ? new Date(req.body.options.deadline) : undefined,
            dependencies: req.body.options?.dependencies,
            resources: req.body.options?.resources,
            timeout: req.body.options?.timeout,
            metadata: {
              ...req.body.options?.metadata,
              requestSource: 'api',
              requestIP: req.ip,
              userAgent: req.headers['user-agent'],
            },
          },
        };

        logger.info(`Executing agent: ${request.agentType} for business: ${businessId}`);

        const result = await queueIntegration.executeAgent(request);

        res.json({
          success: true,
          data: result,
        });

      } catch (error) {
        logger.error('Agent execution failed:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/queue/workflow/execute
   * Execute a workflow with multiple agents
   */
  router.post('/workflow/execute',
    [
      body('workflowId').isString().notEmpty().withMessage('Workflow ID is required'),
      body('businessId').isUUID().withMessage('Valid business ID is required'),
      body('userId').isUUID().withMessage('Valid user ID is required'),
      body('priority').isIn(Object.values(JobPriority)).withMessage('Valid priority is required'),
      body('steps').isArray({ min: 1 }).withMessage('At least one workflow step is required'),
      body('steps.*.agentType').isString().notEmpty().withMessage('Agent type is required for each step'),
      body('steps.*.data').isObject().withMessage('Data must be an object for each step'),
      body('options.deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
      body('options.parallelExecution').optional().isBoolean().withMessage('Parallel execution must be boolean'),
      body('options.failFast').optional().isBoolean().withMessage('Fail fast must be boolean'),
    ],
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        // Check authorization
        const { businessId } = req.body;
        if (req.user.role !== 'admin' && !req.user.businesses?.includes(businessId)) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to execute workflows for this business',
          });
        }

        const request: WorkflowRequest = {
          workflowId: req.body.workflowId,
          businessId: req.body.businessId,
          userId: req.body.userId,
          priority: req.body.priority,
          steps: req.body.steps,
          options: {
            parallelExecution: req.body.options?.parallelExecution || false,
            failFast: req.body.options?.failFast || true,
            retryPolicy: req.body.options?.retryPolicy || 'step',
            deadline: req.body.options?.deadline ? new Date(req.body.options.deadline) : undefined,
          },
        };

        logger.info(`Executing workflow: ${request.workflowId} (${request.steps.length} steps)`);

        const result = await queueIntegration.executeWorkflow(request);

        res.json({
          success: true,
          data: result,
        });

      } catch (error) {
        logger.error('Workflow execution failed:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/queue/status
   * Get overall queue system status
   */
  router.get('/status',
    async (req: Request, res: Response) => {
      try {
        const status = await queueIntegration.getSystemStatus();

        res.json({
          success: true,
          data: status,
        });

      } catch (error) {
        logger.error('Failed to get queue status:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/queue/queues
   * Get status of all queues
   */
  router.get('/queues',
    async (req: Request, res: Response) => {
      try {
        const queues = {};
        
        for (const queueType of Object.values(QueueType)) {
          const stats = await queueIntegration.queueManager.getQueueStats(queueType);
          queues[queueType] = stats;
        }

        res.json({
          success: true,
          data: queues,
        });

      } catch (error) {
        logger.error('Failed to get queue stats:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/queue/workflows/active
   * Get active workflows
   */
  router.get('/workflows/active',
    async (req: Request, res: Response) => {
      try {
        const activeWorkflows = queueIntegration.getActiveWorkflows();

        res.json({
          success: true,
          data: {
            count: activeWorkflows.length,
            workflows: activeWorkflows,
          },
        });

      } catch (error) {
        logger.error('Failed to get active workflows:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/queue/agents
   * Get registered agents
   */
  router.get('/agents',
    async (req: Request, res: Response) => {
      try {
        const agents = queueIntegration.getRegisteredAgents();

        res.json({
          success: true,
          data: {
            count: agents.length,
            agents: agents.map(agentType => ({
              type: agentType,
              queueType: determineQueueTypeForAgent(agentType),
            })),
          },
        });

      } catch (error) {
        logger.error('Failed to get registered agents:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/queue/queues/:queueType/pause
   * Pause a specific queue
   */
  router.post('/queues/:queueType/pause',
    [
      param('queueType').isIn(Object.values(QueueType)).withMessage('Valid queue type is required'),
    ],
    authorize(['admin', 'platform_manager']),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        const queueType = req.params.queueType as QueueType;
        await queueIntegration.pauseQueue(queueType);

        logger.info(`Queue paused: ${queueType} by user: ${req.user.id}`);

        res.json({
          success: true,
          message: `Queue ${queueType} paused successfully`,
        });

      } catch (error) {
        logger.error('Failed to pause queue:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/queue/queues/:queueType/resume
   * Resume a specific queue
   */
  router.post('/queues/:queueType/resume',
    [
      param('queueType').isIn(Object.values(QueueType)).withMessage('Valid queue type is required'),
    ],
    authorize(['admin', 'platform_manager']),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        const queueType = req.params.queueType as QueueType;
        await queueIntegration.resumeQueue(queueType);

        logger.info(`Queue resumed: ${queueType} by user: ${req.user.id}`);

        res.json({
          success: true,
          message: `Queue ${queueType} resumed successfully`,
        });

      } catch (error) {
        logger.error('Failed to resume queue:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/queue/queues/:queueType/drain
   * Drain a specific queue
   */
  router.post('/queues/:queueType/drain',
    [
      param('queueType').isIn(Object.values(QueueType)).withMessage('Valid queue type is required'),
    ],
    authorize(['admin']),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        const queueType = req.params.queueType as QueueType;
        await queueIntegration.drainQueue(queueType);

        logger.warn(`Queue drained: ${queueType} by user: ${req.user.id}`);

        res.json({
          success: true,
          message: `Queue ${queueType} drained successfully`,
        });

      } catch (error) {
        logger.error('Failed to drain queue:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/queue/health
   * Get detailed health information
   */
  router.get('/health',
    async (req: Request, res: Response) => {
      try {
        const systemHealth = await queueIntegration.monitor.getSystemHealth();

        res.json({
          success: true,
          data: {
            overall: systemHealth.overall,
            score: systemHealth.score,
            timestamp: new Date(),
            queues: systemHealth.queues.map(queue => ({
              type: queue.queueType,
              status: queue.status,
              score: queue.score,
              issues: queue.issues,
              metrics: queue.metrics,
            })),
            alerts: systemHealth.alerts.filter(alert => !alert.resolved),
            summary: systemHealth.summary,
          },
        });

      } catch (error) {
        logger.error('Failed to get health status:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/queue/metrics
   * Get queue performance metrics
   */
  router.get('/metrics',
    [
      query('queueType').optional().isIn(Object.values(QueueType)).withMessage('Valid queue type required'),
      query('timeRange').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Valid time range required'),
    ],
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        const queueType = req.query.queueType as QueueType;
        const timeRange = req.query.timeRange as string || '1h';
        
        // Calculate time range
        const timeRangeMs = {
          '1h': 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
        };
        
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - timeRangeMs[timeRange]);

        let metrics;
        if (queueType) {
          metrics = queueIntegration.monitor.getQueueMetrics(queueType, { start: startTime, end: endTime });
        } else {
          // Get metrics for all queues
          metrics = {};
          for (const qt of Object.values(QueueType)) {
            metrics[qt] = queueIntegration.monitor.getQueueMetrics(qt, { start: startTime, end: endTime });
          }
        }

        res.json({
          success: true,
          data: {
            timeRange: {
              start: startTime,
              end: endTime,
              duration: timeRangeMs[timeRange],
            },
            metrics,
          },
        });

      } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

  return router;
}

/**
 * Helper function to determine queue type for agent
 */
function determineQueueTypeForAgent(agentType: string): QueueType {
  const agentQueueMap: Record<string, QueueType> = {
    'content-generator': QueueType.CONTENT_GENERATION,
    'seo-optimizer': QueueType.SEO_ANALYSIS,
    'visual-designer': QueueType.VISUAL_ASSETS,
    'analytics-processor': QueueType.ANALYTICS,
    'webhook-handler': QueueType.WEBHOOKS,
    'notification-sender': QueueType.NOTIFICATIONS,
    'background-processor': QueueType.BACKGROUND_TASKS,
  };
  
  return agentQueueMap[agentType] || QueueType.AGENT_EXECUTION;
}

export default createQueueRoutes;