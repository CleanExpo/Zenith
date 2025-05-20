import { NextRequest, NextResponse } from 'next/server';
import { jobQueue, JobStatus, JobPriority } from '@/lib/utils/jobQueue';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers';
import { UserRole } from '@/lib/auth/types';

/**
 * GET handler for retrieving job queue information
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is an admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userProfile || userProfile.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as JobStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const jobId = searchParams.get('id');
    
    // Get job by ID if specified
    if (jobId) {
      const job = await jobQueue.getJob(jobId);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({ job });
    }
    
    // Get jobs by status if specified
    if (status) {
      if (!Object.values(JobStatus).includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      
      const jobs = await jobQueue.getJobsByStatus(status, limit, offset);
      return NextResponse.json({ jobs });
    }
    
    // Get all jobs (default to pending)
    const pendingJobs = await jobQueue.getJobsByStatus(JobStatus.PENDING, limit, offset);
    const processingJobs = await jobQueue.getJobsByStatus(JobStatus.PROCESSING, limit, offset);
    const completedJobs = await jobQueue.getJobsByStatus(JobStatus.COMPLETED, limit, offset);
    const failedJobs = await jobQueue.getJobsByStatus(JobStatus.FAILED, limit, offset);
    
    return NextResponse.json({
      stats: {
        pendingJobs: pendingJobs.length,
        processingJobs: processingJobs.length,
        completedJobs: completedJobs.length,
        failedJobs: failedJobs.length,
        totalJobs: pendingJobs.length + processingJobs.length + completedJobs.length + failedJobs.length
      },
      jobs: {
        pending: pendingJobs,
        processing: processingJobs,
        completed: completedJobs,
        failed: failedJobs
      }
    });
  } catch (error: any) {
    logger.error('Error retrieving job queue information', { error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for adding a job to the queue
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is an admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userProfile || userProfile.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { type, data, priority, maxAttempts } = body;
    
    if (!type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Add job to queue
    const jobId = await jobQueue.addJob(type, data, {
      priority: priority as JobPriority,
      maxAttempts
    });
    
    return NextResponse.json({ jobId });
  } catch (error: any) {
    logger.error('Error adding job to queue', { error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE handler for cancelling a job
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and authorization
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is an admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userProfile || userProfile.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get job ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('id');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 });
    }
    
    // Cancel job
    const success = await jobQueue.cancelJob(jobId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to cancel job' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error cancelling job', { error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

