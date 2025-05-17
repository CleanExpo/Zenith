'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSubscription } from '@/hooks/useFeatureAccess';
import { stripeService, PlanType } from '@/lib/services/stripeService';
import Link from 'next/link';

interface PlanFeature {
  name: string;
  description: string;
  free: boolean | string | number;
  basic: boolean | string | number;
  premium: boolean | string | number;
  enterprise: boolean | string | number;
}

const planFeatures: PlanFeature[] = [
  {
    name: 'Projects',
    description: 'Number of projects you can create',
    free: 3,
    basic: 10,
    premium: 50,
    enterprise: 'Unlimited'
  },
  {
    name: 'Storage',
    description: 'Storage space for files and attachments',
    free: '100 MB',
    basic: '1 GB',
    premium: '10 GB',
    enterprise: '100 GB'
  },
  {
    name: 'Collaborators',
    description: 'Number of collaborators per project',
    free: 0,
    basic: 3,
    premium: 10,
    enterprise: 'Unlimited'
  },
  {
    name: 'API Access',
    description: 'Access to the Zenith API',
    free: false,
    basic: false,
    premium: true,
    enterprise: true
  },
  {
    name: 'Advanced Analytics',
    description: 'Access to advanced analytics and reporting',
    free: false,
    basic: false,
    premium: true,
    enterprise: true
  },
  {
    name: 'Custom Reports',
    description: 'Create and save custom reports',
    free: false,
    basic: true,
    premium: true,
    enterprise: true
  },
  {
    name: 'Team Management',
    description: 'Create and manage teams',
    free: false,
    basic: true,
    premium: true,
    enterprise: true
  },
  {
    name: 'Priority Support',
    description: 'Priority customer support',
    free: false,
    basic: false,
    premium: true,
    enterprise: true
  },
  {
    name: 'Custom Branding',
    description: 'Add your own branding to reports and exports',
    free: false,
    basic: false,
    premium: false,
    enterprise: true
  },
  {
    name: 'SSO Integration',
    description: 'Single Sign-On integration',
    free: false,
    basic: false,
    premium: false,
    enterprise: true
  }
];

interface PlanComparisonTableProps {
  showCurrentPlan?: boolean;
  showButtons?: boolean;
  userId?: string;
  userEmail?: string;
}

export function PlanComparisonTable({
  showCurrentPlan = true,
  showButtons = true,
  userId,
  userEmail
}: PlanComparisonTableProps) {
  const { subscription, isLoading } = showCurrentPlan ? useSubscription() : { subscription: null, isLoading: false };
  const currentPlan = subscription?.planType || 'free';

  const renderValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-gray-300 mx-auto" />
      );
    }
    return <span className="text-center block">{value}</span>;
  };

  const getPlanPrice = (plan: PlanType) => {
    const prices = {
      free: '$0',
      basic: '$9.99',
      premium: '$29.99',
      enterprise: '$99.99'
    };
    return prices[plan] || '$0';
  };

  const handleSubscribe = async (plan: PlanType) => {
    if (!userId || !userEmail) return;
    
    try {
      // Create success and cancel URLs based on the current URL
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/dashboard/subscription?success=true`;
      const cancelUrl = `${baseUrl}/dashboard/subscription?canceled=true`;
      
      const url = await stripeService.createCheckoutSession(
        userId, 
        userEmail, 
        plan, 
        successUrl, 
        cancelUrl
      );
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Plan Comparison</CardTitle>
        <CardDescription>
          Compare features across different subscription tiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Feature</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">Basic</TableHead>
                <TableHead className="text-center">Premium</TableHead>
                <TableHead className="text-center">Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Monthly Price</TableCell>
                <TableCell className="text-center">{getPlanPrice('free')}</TableCell>
                <TableCell className="text-center">{getPlanPrice('basic')}</TableCell>
                <TableCell className="text-center">{getPlanPrice('premium')}</TableCell>
                <TableCell className="text-center">{getPlanPrice('enterprise')}</TableCell>
              </TableRow>
              {planFeatures.map((feature) => (
                <TableRow key={feature.name}>
                  <TableCell className="font-medium">
                    <div>{feature.name}</div>
                    <div className="text-xs text-muted-foreground">{feature.description}</div>
                  </TableCell>
                  <TableCell>{renderValue(feature.free)}</TableCell>
                  <TableCell>{renderValue(feature.basic)}</TableCell>
                  <TableCell>{renderValue(feature.premium)}</TableCell>
                  <TableCell>{renderValue(feature.enterprise)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {showButtons && (
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {showCurrentPlan && (
              <>
                {isLoading ? (
                  <span>Loading current plan...</span>
                ) : (
                  <span>Your current plan: <strong className="capitalize">{currentPlan}</strong></span>
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {userId && userEmail ? (
              <>
                {currentPlan !== 'basic' && (
                  <Button 
                    variant={currentPlan === 'free' ? 'default' : 'outline'} 
                    onClick={() => handleSubscribe('basic')}
                  >
                    {currentPlan === 'free' ? 'Upgrade to Basic' : 'Switch to Basic'}
                  </Button>
                )}
                {currentPlan !== 'premium' && (
                  <Button 
                    variant={currentPlan === 'free' || currentPlan === 'basic' ? 'default' : 'outline'} 
                    onClick={() => handleSubscribe('premium')}
                  >
                    {currentPlan === 'free' || currentPlan === 'basic' ? 'Upgrade to Premium' : 'Switch to Premium'}
                  </Button>
                )}
                {currentPlan !== 'enterprise' && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleSubscribe('enterprise')}
                  >
                    {currentPlan === 'free' || currentPlan === 'basic' || currentPlan === 'premium' 
                      ? 'Upgrade to Enterprise' 
                      : 'Switch to Enterprise'}
                  </Button>
                )}
              </>
            ) : (
              <Button asChild>
                <Link href="/dashboard/subscription">Manage Subscription</Link>
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
