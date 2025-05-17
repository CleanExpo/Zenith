'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import JobQueueMonitoring from '@/components/admin/JobQueueMonitoring';

export default function JobQueuePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Background Jobs</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Job Queue Management</CardTitle>
          <CardDescription>
            Monitor and manage background jobs in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSkeleton className="h-[600px]" />}>
            <JobQueueMonitoring />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
