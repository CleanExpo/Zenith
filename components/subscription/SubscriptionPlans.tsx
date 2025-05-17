'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Table as TableIcon, Grid } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PlanType, SUBSCRIPTION_PLANS, stripeService } from '@/lib/services/stripeService';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanComparisonTable } from './PlanComparisonTable';

interface SubscriptionPlansProps {
  currentPlan: PlanType;
  userId: string;
  userEmail: string;
}

export function SubscriptionPlans({ currentPlan, userId, userEmail }: SubscriptionPlansProps) {
  const [isLoading, setIsLoading] = useState<PlanType | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubscribe = async (planType: PlanType) => {
    if (planType === currentPlan) {
      // If user is already on this plan, redirect to manage subscription
      await handleManageSubscription();
      return;
    }

    setIsLoading(planType);
    try {
      // Create a checkout session for the selected plan
      const checkoutUrl = await stripeService.createCheckoutSession(
        userId,
        userEmail,
        planType,
        `${window.location.origin}/dashboard/profile?success=true`,
        `${window.location.origin}/dashboard/profile?canceled=true`
      );

      if (checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(currentPlan);
    try {
      // Create a customer portal session
      const portalUrl = await stripeService.createCustomerPortalSession(
        userId,
        `${window.location.origin}/dashboard/profile`
      );

      if (portalUrl) {
        // Redirect to Stripe customer portal
        window.location.href = portalUrl;
      } else {
        throw new Error('Failed to create customer portal session');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer portal session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price / 100);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Subscription Plans</h2>
        <p className="text-muted-foreground mt-2">
          Choose the plan that best fits your needs
        </p>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="cards" className="flex items-center">
              <Grid className="h-4 w-4 mr-2" />
              Card View
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center">
              <TableIcon className="h-4 w-4 mr-2" />
              Table View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cards">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planType, plan]) => (
          <Card 
            key={planType} 
            className={`flex flex-col ${currentPlan === planType ? 'border-primary' : ''}`}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-3xl font-bold mb-4">
                {plan.price === 0 ? 'Free' : `${formatPrice(plan.price)}/${plan.interval}`}
              </div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>
                    {plan.features.maxProjects === -1 
                      ? 'Unlimited projects' 
                      : `${plan.features.maxProjects} projects`}
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>
                    {plan.features.maxCollaboratorsPerProject === -1 
                      ? 'Unlimited collaborators' 
                      : plan.features.maxCollaboratorsPerProject === 0 
                        ? 'No collaborators' 
                        : `${plan.features.maxCollaboratorsPerProject} collaborators per project`}
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>
                    {plan.features.maxStorageMb >= 1024 
                      ? `${plan.features.maxStorageMb / 1024} GB storage` 
                      : `${plan.features.maxStorageMb} MB storage`}
                  </span>
                </li>
                <li className="flex items-center">
                  {plan.features.apiAccess ? (
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <span className="h-4 w-4 mr-2" />
                  )}
                  <span className={!plan.features.apiAccess ? 'text-muted-foreground line-through' : ''}>
                    API access
                  </span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={currentPlan === planType ? 'outline' : 'default'}
                onClick={() => handleSubscribe(planType as PlanType)}
                disabled={isLoading !== null}
              >
                {isLoading === planType ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {currentPlan === planType 
                  ? 'Manage Subscription' 
                  : plan.price === 0 
                    ? 'Downgrade' 
                    : 'Subscribe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
          </div>

          {currentPlan !== 'free' && (
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => handleManageSubscription()}
                disabled={isLoading !== null}
              >
                {isLoading === currentPlan ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Manage Subscription
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <PlanComparisonTable 
            userId={userId} 
            userEmail={userEmail} 
            showCurrentPlan={true}
            showButtons={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
