import { BaseAgent } from '../base/BaseAgent';
import { Logger } from '../utils/logger';

export class Container {
  private static instance: Container;
  private agents: Map<string, BaseAgent> = new Map();
  private logger: Logger;

  private constructor() {
    this.logger = new Logger('Container');
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register(key: string, agent: BaseAgent): void {
    if (this.agents.has(key)) {
      throw new Error(`Agent with key '${key}' is already registered`);
    }

    this.agents.set(key, agent);
    this.logger.info(`Registered agent: ${key}`);
  }

  get<T extends BaseAgent>(key: string): T {
    const agent = this.agents.get(key);
    if (!agent) {
      throw new Error(`Agent with key '${key}' not found`);
    }
    return agent as T;
  }

  has(key: string): boolean {
    return this.agents.has(key);
  }

  getAll(): Map<string, BaseAgent> {
    return new Map(this.agents);
  }

  async initializeAll(): Promise<void> {
    this.logger.info('Initializing all registered agents...');
    
    const initPromises = Array.from(this.agents.values()).map(agent => 
      agent.start().catch(error => {
        this.logger.error(`Failed to initialize agent ${agent.getName()}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return Promise.reject(error);
      })
    );

    await Promise.all(initPromises);
    this.logger.info('All agents initialized successfully');
  }

  async shutdownAll(): Promise<void> {
    this.logger.info('Shutting down all agents...');
    
    const shutdownPromises = Array.from(this.agents.values()).map(agent =>
      agent.shutdown().catch(error => {
        this.logger.error(`Failed to shutdown agent ${agent.getName()}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      })
    );

    await Promise.all(shutdownPromises);
    this.agents.clear();
    this.logger.info('All agents shut down successfully');
  }

  clear(): void {
    this.agents.clear();
    this.logger.info('Container cleared');
  }
}