import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Job status enum
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Job priority enum
 */
export enum JobPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Job interface
 */
export interface Job {
  id: string;
  type: string;
  data: any;
  status: JobStatus;
  priority: JobPriority;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
}

/**
 * Job options interface
 */
export interface JobOptions {
  priority?: JobPriority;
  maxAttempts?: number;
}

/**
 * Default job options
 */
const DEFAULT_JOB_OPTIONS: JobOptions = {
  priority: JobPriority.MEDIUM,
  maxAttempts: 3
};

/**
 * Job queue class
 */
class JobQueue {
  private tableName = 'job_queue';
  
  /**
   * Add a job to the queue
   * @param type Job type
   * @param data Job data
   * @param options Job options
   * @returns Job ID
   */
  async addJob(type: string, data: any, options: JobOptions = {}): Promise<string> {
    try {
      const supabase = createClient();
      const jobId = uuidv4();
      const now = new Date().toISOString();
      
      const mergedOptions = { ...DEFAULT_JOB_OPTIONS, ...options };
      
      const job: Job = {
        id: jobId,
        type,
        data,
        status: JobStatus.PENDING,
        priority: mergedOptions.priority!,
        createdAt: now,
        updatedAt: now,
        attempts: 0,
        maxAttempts: mergedOptions.maxAttempts!
      };
      
      const { error } = await supabase
        .from(this.tableName)
        .insert(job);
      
      if (error) {
        throw error;
      }
      
      logger.info(`Job added to queue: ${jobId}`, { type, priority: mergedOptions.priority });
      
      return jobId;
    } catch (error) {
      logger.error('Error adding job to queue', { error });
      throw error;
    }
  }
  
  /**
   * Get a job by ID
   * @param jobId Job ID
   * @returns Job or null if not found
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          return null;
        }
        throw error;
      }
      
      return data as Job;
    } catch (error) {
      logger.error('Error getting job', { error, jobId });
      throw error;
    }
  }
  
  /**
   * Get jobs by status
   * @param status Job status
   * @param limit Maximum number of jobs to return
   * @param offset Offset for pagination
   * @returns Array of jobs
   */
  async getJobsByStatus(status: JobStatus, limit: number = 20, offset: number = 0): Promise<Job[]> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('priority', { ascending: false })
        .order('createdAt', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      return data as Job[];
    } catch (error) {
      logger.error('Error getting jobs by status', { error, status });
      throw error;
    }
  }
  
  /**
   * Update a job
   * @param jobId Job ID
   * @param updates Job updates
   * @returns Updated job
   */
  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
    try {
      const supabase = createClient();
      
      // Ensure updatedAt is set
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updatesWithTimestamp)
        .eq('id', jobId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as Job;
    } catch (error) {
      logger.error('Error updating job', { error, jobId });
      throw error;
    }
  }
  
  /**
   * Process the next pending job
   * @param processFunction Function to process the job
   * @returns Processed job or null if no pending jobs
   */
  async processNextJob(processFunction: (job: Job) => Promise<any>): Promise<Job | null> {
    try {
      const supabase = createClient();
      
      // Start a transaction
      const { data: pendingJobs, error: fetchError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', JobStatus.PENDING)
        .order('priority', { ascending: false })
        .order('createdAt', { ascending: true })
        .limit(1);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!pendingJobs || pendingJobs.length === 0) {
        return null;
      }
      
      const job = pendingJobs[0] as Job;
      
      // Update job status to processing
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from(this.tableName)
        .update({
          status: JobStatus.PROCESSING,
          startedAt: now,
          updatedAt: now,
          attempts: job.attempts + 1
        })
        .eq('id', job.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Process the job
      try {
        await processFunction(job);
        
        // Update job status to completed
        const { error: completeError } = await supabase
          .from(this.tableName)
          .update({
            status: JobStatus.COMPLETED,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('id', job.id);
        
        if (completeError) {
          throw completeError;
        }
        
        logger.info(`Job completed: ${job.id}`, { type: job.type });
        
        return {
          ...job,
          status: JobStatus.COMPLETED,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } catch (processError: any) {
        // Check if max attempts reached
        if (job.attempts >= job.maxAttempts) {
          // Update job status to failed
          const { error: failError } = await supabase
            .from(this.tableName)
            .update({
              status: JobStatus.FAILED,
              error: processError.message || 'Unknown error',
              updatedAt: new Date().toISOString()
            })
            .eq('id', job.id);
          
          if (failError) {
            throw failError;
          }
          
          logger.error(`Job failed: ${job.id}`, { 
            type: job.type, 
            error: processError.message || 'Unknown error',
            attempts: job.attempts
          });
          
          return {
            ...job,
            status: JobStatus.FAILED,
            error: processError.message || 'Unknown error',
            updatedAt: new Date().toISOString()
          };
        } else {
          // Update job status back to pending for retry
          const { error: retryError } = await supabase
            .from(this.tableName)
            .update({
              status: JobStatus.PENDING,
              updatedAt: new Date().toISOString()
            })
            .eq('id', job.id);
          
          if (retryError) {
            throw retryError;
          }
          
          logger.warn(`Job retry: ${job.id}`, { 
            type: job.type, 
            error: processError.message || 'Unknown error',
            attempts: job.attempts,
            maxAttempts: job.maxAttempts
          });
          
          return {
            ...job,
            status: JobStatus.PENDING,
            updatedAt: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      logger.error('Error processing next job', { error });
      throw error;
    }
  }
  
  /**
   * Cancel a job
   * @param jobId Job ID
   * @returns True if job was cancelled, false otherwise
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      
      // Get the job first to check if it can be cancelled
      const { data: job, error: fetchError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Record not found
          return false;
        }
        throw fetchError;
      }
      
      // Only pending or processing jobs can be cancelled
      if (job.status !== JobStatus.PENDING && job.status !== JobStatus.PROCESSING) {
        return false;
      }
      
      // Update job status to failed with cancellation message
      const { error: updateError } = await supabase
        .from(this.tableName)
        .update({
          status: JobStatus.FAILED,
          error: 'Job cancelled by user',
          updatedAt: new Date().toISOString()
        })
        .eq('id', jobId);
      
      if (updateError) {
        throw updateError;
      }
      
      logger.info(`Job cancelled: ${jobId}`);
      
      return true;
    } catch (error) {
      logger.error('Error cancelling job', { error, jobId });
      throw error;
    }
  }
  
  /**
   * Clean up old completed and failed jobs
   * @param olderThan Jobs older than this date will be deleted
   * @returns Number of jobs deleted
   */
  async cleanupOldJobs(olderThan: Date): Promise<number> {
    try {
      const supabase = createClient();
      
      const { count, error } = await supabase
        .from(this.tableName)
        .delete({ count: 'exact' })
        .in('status', [JobStatus.COMPLETED, JobStatus.FAILED])
        .lt('updatedAt', olderThan.toISOString());
      
      if (error) {
        throw error;
      }
      
      logger.info(`Cleaned up ${count} old jobs`);
      
      return count || 0;
    } catch (error) {
      logger.error('Error cleaning up old jobs', { error });
      throw error;
    }
  }
}

// Export a singleton instance
export const jobQueue = new JobQueue();
