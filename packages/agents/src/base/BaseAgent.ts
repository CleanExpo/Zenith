import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { prisma, AgentType, TaskStatus } from '@zenith/database';

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  version: string;
  dependencies?: AgentType[];
  maxConcurrency?: number;
  timeout?: number;
}

export interface AgentContext {
  businessId: string;
  workflowExecutionId?: string;
  taskId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AgentInput {
  [key: string]: any;
}

export interface AgentOutput {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  protected readonly id: string;
  protected readonly config: AgentConfig;
  protected readonly logger: Logger;
  protected isInitialized: boolean = false;

  constructor(config: AgentConfig) {
    this.id = uuidv4();
    this.config = config;
    this.logger = new Logger(`Agent:${config.name}`);
  }

  // Abstract methods that must be implemented by concrete agents
  abstract initialize(): Promise<void>;
  abstract execute(input: AgentInput, context: AgentContext): Promise<AgentOutput>;
  abstract healthCheck(): Promise<boolean>;
  abstract shutdown(): Promise<void>;

  // Common agent functionality
  async start(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Agent already initialized');
      return;
    }

    try {
      this.logger.info(`Initializing agent: ${this.config.name}`);
      await this.initialize();
      this.isInitialized = true;
      this.logger.info('Agent initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize agent', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async run(input: AgentInput, context: AgentContext): Promise<AgentOutput> {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.config.name} is not initialized`);
    }

    const startTime = Date.now();
    this.logger.info('Starting agent execution', {
      taskId: context.taskId,
      businessId: context.businessId
    });

    try {
      // Update task status to running if we have a task
      if (context.taskId) {
        await this.updateTaskStatus(context.taskId, TaskStatus.RUNNING);
      }

      // Execute the agent logic
      const result = await this.execute(input, context);
      
      const duration = Date.now() - startTime;
      this.logger.info('Agent execution completed', {
        taskId: context.taskId,
        duration: `${duration}ms`,
        success: result.success
      });

      // Update task status to completed if successful
      if (context.taskId && result.success) {
        await this.updateTaskStatus(context.taskId, TaskStatus.COMPLETED, result);
      } else if (context.taskId && !result.success) {
        await this.updateTaskStatus(context.taskId, TaskStatus.FAILED, result);
      }

      // Record health check
      await this.recordHealthCheck(true, duration, context.businessId);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error('Agent execution failed', {
        taskId: context.taskId,
        duration: `${duration}ms`,
        error: errorMessage
      });

      // Update task status to failed
      if (context.taskId) {
        await this.updateTaskStatus(context.taskId, TaskStatus.FAILED, null, errorMessage);
      }

      // Record health check
      await this.recordHealthCheck(false, duration, context.businessId, errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Helper methods
  protected async updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    output?: AgentOutput | null,
    error?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        ...(status === TaskStatus.RUNNING && { startedAt: new Date() }),
        ...(status === TaskStatus.COMPLETED && { completedAt: new Date() }),
        ...(status === TaskStatus.FAILED && { completedAt: new Date() }),
        ...(output && { output }),
        ...(error && { error })
      };

      await prisma.workflowTask.update({
        where: { id: taskId },
        data: updateData
      });
    } catch (err) {
      this.logger.error('Failed to update task status', {
        taskId,
        status,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  protected async recordHealthCheck(
    healthy: boolean, 
    responseTime: number,
    businessId?: string,
    error?: string
  ): Promise<void> {
    try {
      await prisma.agentHealthCheck.create({
        data: {
          agentType: this.config.type,
          healthy,
          responseTime,
          businessId,
          error,
          metadata: {
            agentId: this.id,
            version: this.config.version
          }
        }
      });
    } catch (err) {
      this.logger.error('Failed to record health check', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  getType(): AgentType {
    return this.config.type;
  }

  getName(): string {
    return this.config.name;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}