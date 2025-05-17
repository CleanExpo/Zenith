# Job Queue System

This directory contains SQL migrations for the job queue system used in the Zenith platform. The job queue system provides a way to run background tasks asynchronously, which is useful for long-running operations that should not block the main request-response cycle.

## Overview

The job queue system consists of the following components:

1. **Database Table**: `public.job_queue` - Stores job information including status, priority, and data.
2. **API Routes**: `/api/admin/jobs` - Provides endpoints for managing jobs.
3. **Admin UI**: Job Queue Monitoring page in the admin dashboard.
4. **Utility Functions**: `lib/utils/jobQueue.ts` - Provides functions for interacting with the job queue.

## Database Schema

The `job_queue` table has the following structure:

- `id`: UUID - Primary key
- `type`: TEXT - Job type identifier
- `data`: JSONB - Job data
- `status`: TEXT - Job status (pending, processing, completed, failed)
- `priority`: TEXT - Job priority (high, medium, low)
- `created_at`: TIMESTAMPTZ - Creation timestamp
- `updated_at`: TIMESTAMPTZ - Last update timestamp
- `started_at`: TIMESTAMPTZ - When job started processing
- `completed_at`: TIMESTAMPTZ - When job completed
- `attempts`: INTEGER - Number of processing attempts
- `max_attempts`: INTEGER - Maximum number of attempts before failing
- `error`: TEXT - Error message if job failed

## Database Functions

The following database functions are available:

- `cleanup_old_jobs(days_to_keep INTEGER)`: Deletes old completed and failed jobs.
- `get_job_queue_stats()`: Returns statistics about the job queue.
- `get_next_pending_job()`: Gets the next pending job for processing.

## Row Level Security

The job queue table has row level security enabled. Only users with the `admin` role can access the job queue.

## Usage

### Adding a Job

```typescript
import { jobQueue, JobPriority } from '@/lib/utils/jobQueue';

// Add a job to the queue
const jobId = await jobQueue.addJob(
  'email-notification', // Job type
  {
    userId: 'user-123',
    templateId: 'welcome-email',
    data: { name: 'John Doe' }
  }, // Job data
  {
    priority: JobPriority.HIGH,
    maxAttempts: 5
  } // Job options
);
```

### Processing Jobs

```typescript
import { jobQueue } from '@/lib/utils/jobQueue';

// Process the next pending job
const job = await jobQueue.processNextJob(async (job) => {
  // Process the job based on its type
  switch (job.type) {
    case 'email-notification':
      await sendEmail(job.data);
      break;
    case 'data-export':
      await generateExport(job.data);
      break;
    // Add more job types as needed
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
});
```

### Cancelling a Job

```typescript
import { jobQueue } from '@/lib/utils/jobQueue';

// Cancel a job
const success = await jobQueue.cancelJob('job-id');
```

### Cleaning Up Old Jobs

```typescript
import { jobQueue } from '@/lib/utils/jobQueue';

// Clean up jobs older than 30 days
const deletedCount = await jobQueue.cleanupOldJobs(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
```

## Job Worker Implementation

For production use, you should implement a job worker that continuously processes jobs. This can be done using a serverless function that runs on a schedule, or a dedicated worker process.

### Example Worker Implementation (Serverless)

```typescript
import { jobQueue } from '@/lib/utils/jobQueue';

export async function processJobs() {
  // Process up to 10 jobs
  for (let i = 0; i < 10; i++) {
    const job = await jobQueue.processNextJob(async (job) => {
      // Process the job based on its type
      switch (job.type) {
        case 'email-notification':
          await sendEmail(job.data);
          break;
        case 'data-export':
          await generateExport(job.data);
          break;
        // Add more job types as needed
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
    });

    // If no more jobs, break the loop
    if (!job) {
      break;
    }
  }
}
```

## Admin UI

The admin UI provides a way to monitor and manage jobs. It shows statistics about the job queue and allows administrators to view job details and cancel jobs.

The admin UI is available at `/dashboard/admin/jobs`.

## Security Considerations

- Only users with the `admin` role can access the job queue.
- Sensitive data should be encrypted or stored securely outside the job queue.
- Job workers should validate job data before processing.
- Error handling should be robust to prevent job processing failures.
