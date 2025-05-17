'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubscription, useFeatureLimits } from '@/hooks/useFeatureAccess';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { AlertCircle, CheckCircle, CreditCard, Users, FileText, Database, Code } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionStatusProps {
  userId: string;
}

export function SubscriptionStatus({ userId }: SubscriptionStatusProps) {
  const { subscription, isLoading: isLoadingSubscription, error: subscriptionError } = useSubscription();
  const { limits, isLoading: isLoadingLimits, error: limitsError } = useFeatureLimits();
  const [projectCount, setProjectCount] = useState<number>(0);
  const [storageUsed, setStorageUsed] = useState<number>(0);

  useEffect(() => {
    // Fetch project count and storage used
    // This would typically come from an API call
    // For now, we'll use dummy data
    setProjectCount(2);
    setStorageUsed(25); // 25 MB
  }, []);

  if (isLoadingSubscription || isLoadingLimits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <LoadingSkeleton className="h-7 w-48" />
          </CardTitle>
          <CardDescription>
            <LoadingSkeleton className="h-5 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (subscriptionError || limitsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error Loading Subscription
          </CardTitle>
          <CardDescription>
            We couldn't load your subscription information. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/dashboard/subscription">Manage Subscription</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const planType = subscription?.planType || 'free';
  const status = subscription?.status || null;
  const currentPeriodEnd = subscription?.currentPeriodEnd || null;

  const maxProjects = limits.max_projects || 3;
  const maxCollaborators = limits.max_collaborators_per_project || 0;
  const maxStorageMb = limits.max_storage_mb || 100;
  const hasApiAccess = limits.api_access || false;

  // Calculate percentages for progress bars
  const projectPercentage = maxProjects === -1 ? 0 : (projectCount / maxProjects) * 100;
  const storagePercentage = (storageUsed / maxStorageMb) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
          {status && status !== 'active' && (
            <span className="ml-2 text-sm font-normal text-amber-500">({status})</span>
          )}
        </CardTitle>
        <CardDescription>
          {currentPeriodEnd
            ? `Your subscription renews on ${new Date(currentPeriodEnd).toLocaleDateString()}`
            : 'Free plan with limited features'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Projects</span>
            <span className="text-sm text-muted-foreground">
              {projectCount} / {maxProjects === -1 ? 'Unlimited' : maxProjects}
            </span>
          </div>
          {maxProjects !== -1 && (
            <Progress value={projectPercentage} className="h-2" />
          )}
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Storage</span>
            <span className="text-sm text-muted-foreground">
              {storageUsed} MB / {maxStorageMb >= 1024 ? `${maxStorageMb / 1024} GB` : `${maxStorageMb} MB`}
            </span>
          </div>
          <Progress value={storagePercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">
              {maxCollaborators === -1
                ? 'Unlimited collaborators'
                : maxCollaborators === 0
                ? 'No collaborators'
                : `${maxCollaborators} collaborators per project`}
            </span>
          </div>
          <div className="flex items-center">
            <Code className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">
              API Access: {hasApiAccess ? (
                <CheckCircle className="h-4 w-4 inline text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 inline text-muted-foreground" />
              )}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/dashboard/subscription">
            {planType === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
