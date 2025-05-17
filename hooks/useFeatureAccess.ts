'use client';

import { useState, useEffect } from 'react';
import { stripeService } from '@/lib/services/stripeService';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook to check if a user has access to a specific feature based on their subscription plan
 * @param featureName The name of the feature to check access for
 * @returns An object containing the access status and loading state
 */
export function useFeatureAccess(featureName: string) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('User not authenticated');
          setHasAccess(false);
          return;
        }

        // Check if the user has access to the feature
        const access = await stripeService.hasFeatureAccess(user.id, featureName);
        setHasAccess(access);
      } catch (err: any) {
        setError(err.message || 'Failed to check feature access');
        toast({
          title: 'Error',
          description: 'Failed to check feature access. Please try again later.',
          variant: 'destructive',
        });
        // Default to no access on error
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [featureName, toast]);

  return { hasAccess, isLoading, error };
}

/**
 * Hook to get the feature limits for a user based on their subscription plan
 * @returns An object containing the feature limits, loading state, and error
 */
export function useFeatureLimits() {
  const [limits, setLimits] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('User not authenticated');
          setLimits({});
          return;
        }

        // Get the feature limits for the user
        const featureLimits = await stripeService.getFeatureLimits(user.id);
        setLimits(featureLimits);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch feature limits');
        toast({
          title: 'Error',
          description: 'Failed to fetch feature limits. Please try again later.',
          variant: 'destructive',
        });
        // Default to empty limits on error
        setLimits({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchLimits();
  }, [toast]);

  return { limits, isLoading, error };
}

/**
 * Hook to get the user's current subscription plan
 * @returns An object containing the subscription plan, loading state, and error
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('User not authenticated');
          setSubscription(null);
          return;
        }

        // Get the user's subscription
        const userSubscription = await stripeService.getUserSubscription(user.id);
        setSubscription(userSubscription);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch subscription');
        toast({
          title: 'Error',
          description: 'Failed to fetch subscription. Please try again later.',
          variant: 'destructive',
        });
        // Default to null subscription on error
        setSubscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [toast]);

  return { subscription, isLoading, error };
}
