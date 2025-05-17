-- Create job_queue table for background job processing
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS job_queue_status_idx ON public.job_queue (status);
CREATE INDEX IF NOT EXISTS job_queue_priority_idx ON public.job_queue (priority);
CREATE INDEX IF NOT EXISTS job_queue_created_at_idx ON public.job_queue (created_at);
CREATE INDEX IF NOT EXISTS job_queue_type_idx ON public.job_queue (type);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS job_queue_status_priority_created_at_idx 
ON public.job_queue (status, priority, created_at);

-- Add RLS policies
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Only allow admins to access the job queue
CREATE POLICY job_queue_admin_policy ON public.job_queue
  USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Create function to clean up old jobs
CREATE OR REPLACE FUNCTION public.cleanup_old_jobs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.job_queue
  WHERE 
    status IN ('completed', 'failed') 
    AND updated_at < NOW() - (days_to_keep * INTERVAL '1 day')
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Create function to get job queue stats
CREATE OR REPLACE FUNCTION public.get_job_queue_stats()
RETURNS TABLE (
  status TEXT,
  count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    status, 
    COUNT(*) as count
  FROM 
    public.job_queue
  GROUP BY 
    status
  ORDER BY 
    status;
$$;

-- Create function to process next pending job
CREATE OR REPLACE FUNCTION public.get_next_pending_job()
RETURNS SETOF public.job_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_record public.job_queue;
BEGIN
  -- Get the next pending job with highest priority and oldest creation time
  SELECT *
  INTO job_record
  FROM public.job_queue
  WHERE status = 'pending'
  ORDER BY 
    CASE 
      WHEN priority = 'high' THEN 1
      WHEN priority = 'medium' THEN 2
      WHEN priority = 'low' THEN 3
    END,
    created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- If no job found, return empty set
  IF job_record IS NULL THEN
    RETURN;
  END IF;
  
  -- Update job status to processing
  UPDATE public.job_queue
  SET 
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW(),
    attempts = attempts + 1
  WHERE id = job_record.id;
  
  -- Return the job
  RETURN QUERY SELECT * FROM public.job_queue WHERE id = job_record.id;
END;
$$;

-- Add comment to table
COMMENT ON TABLE public.job_queue IS 'Background job queue for asynchronous processing';
