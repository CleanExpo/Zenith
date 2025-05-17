'use client';

import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  /**
   * The name of the feature to check access for
   */
  feature: string;
  /**
   * The content to render if the user has access to the feature
   */
  children: React.ReactNode;
  /**
   * Optional custom message to display if the user doesn't have access
   */
  fallbackMessage?: string;
  /**
   * Optional custom component to render if the user doesn't have access
   */
  fallbackComponent?: React.ReactNode;
  /**
   * Whether to show a link to the subscription page
   * @default true
   */
  showUpgradeLink?: boolean;
  /**
   * Optional custom text for the upgrade link
   * @default "Upgrade your plan"
   */
  upgradeText?: string;
  /**
   * Optional custom URL for the upgrade link
   * @default "/dashboard/subscription"
   */
  upgradeUrl?: string;
}

/**
 * A component that conditionally renders content based on whether the user has access to a feature
 */
export function FeatureGate({
  feature,
  children,
  fallbackMessage = "This feature requires a higher subscription tier.",
  fallbackComponent,
  showUpgradeLink = true,
  upgradeText = "Upgrade your plan",
  upgradeUrl = "/dashboard/subscription",
}: FeatureGateProps) {
  const { hasAccess, isLoading, error } = useFeatureAccess(feature);

  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
        <span className="ml-2">Checking access...</span>
      </div>
    );
  }

  // If there was an error, show an error message
  if (error) {
    return (
      <div className="flex items-center p-4 text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>Error checking feature access. Please try again later.</span>
      </div>
    );
  }

  // If the user has access, render the children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If the user doesn't have access, render the fallback
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Default fallback UI
  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/50">
      <AlertCircle className="h-8 w-8 mb-2 text-amber-500" />
      <p className="text-center mb-4">{fallbackMessage}</p>
      {showUpgradeLink && (
        <Button asChild>
          <Link href={upgradeUrl}>{upgradeText}</Link>
        </Button>
      )}
    </div>
  );
}

/**
 * A component that renders content only if the user has a specific subscription plan or higher
 */
export function PlanGate({
  plan,
  children,
  fallbackMessage,
  fallbackComponent,
  showUpgradeLink,
  upgradeText,
  upgradeUrl,
}: {
  plan: 'basic' | 'premium' | 'enterprise';
  children: React.ReactNode;
  fallbackMessage?: string;
  fallbackComponent?: React.ReactNode;
  showUpgradeLink?: boolean;
  upgradeText?: string;
  upgradeUrl?: string;
}) {
  // Map plan to a feature that's only available on that plan or higher
  const featureMap = {
    basic: 'max_projects_10',
    premium: 'max_projects_50',
    enterprise: 'max_projects_unlimited',
  };

  return (
    <FeatureGate
      feature={featureMap[plan]}
      fallbackMessage={fallbackMessage || `This feature requires the ${plan} plan or higher.`}
      fallbackComponent={fallbackComponent}
      showUpgradeLink={showUpgradeLink}
      upgradeText={upgradeText}
      upgradeUrl={upgradeUrl}
    >
      {children}
    </FeatureGate>
  );
}
