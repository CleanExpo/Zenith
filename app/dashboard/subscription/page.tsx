import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { BillingHistory } from '@/components/subscription/BillingHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { stripeService } from '@/lib/services/stripeService';
import { PlanType } from '@/lib/services/stripeService';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Subscription Management | Zenith',
  description: 'Manage your subscription and billing information',
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    logger.error('Error fetching user', { error: userError });
    redirect('/auth/login');
  }
  
  // Get the user's subscription
  let currentPlan: PlanType = 'free';
  try {
    const subscription = await stripeService.getUserSubscription(user.id);
    if (subscription) {
      currentPlan = subscription.planType;
    }
  } catch (error) {
    logger.error('Error fetching user subscription', { error, userId: user.id });
    // Default to free plan if there's an error
  }
  
  // Get success and canceled query parameters
  const success = searchParams.success === 'true';
  const canceled = searchParams.canceled === 'true';
  
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your subscription, view billing history, and update payment methods.
          </p>
        </div>
        
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-md">
            <p className="text-green-800 dark:text-green-200">
              Your subscription has been updated successfully.
            </p>
          </div>
        )}
        
        {canceled && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
            <p className="text-amber-800 dark:text-amber-200">
              Your subscription update was canceled.
            </p>
          </div>
        )}
        
        <Tabs defaultValue="plans">
          <TabsList>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
          </TabsList>
          <TabsContent value="plans" className="mt-6">
            <SubscriptionPlans 
              currentPlan={currentPlan} 
              userId={user.id} 
              userEmail={user.email || ''}
            />
          </TabsContent>
          <TabsContent value="billing" className="mt-6">
            <BillingHistory userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

