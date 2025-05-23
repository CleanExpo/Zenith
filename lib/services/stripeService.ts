import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger';

// Define subscription plan types
export type PlanType = 'free' | 'basic' | 'premium' | 'enterprise';

// Define subscription plan details
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  features: {
    maxProjects: number;
    maxCollaboratorsPerProject: number;
    maxStorageMb: number;
    apiAccess: boolean;
    [key: string]: any;
  };
}

// Define subscription plans
export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Basic features for personal use',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: {
      maxProjects: 3,
      maxCollaboratorsPerProject: 0,
      maxStorageMb: 100,
      apiAccess: false,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Essential features for small teams',
    price: 999, // $9.99
    currency: 'usd',
    interval: 'month',
    features: {
      maxProjects: 10,
      maxCollaboratorsPerProject: 3,
      maxStorageMb: 1024, // 1GB
      apiAccess: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Advanced features for growing teams',
    price: 2999, // $29.99
    currency: 'usd',
    interval: 'month',
    features: {
      maxProjects: 50,
      maxCollaboratorsPerProject: 10,
      maxStorageMb: 10240, // 10GB
      apiAccess: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large organizations',
    price: 9999, // $99.99
    currency: 'usd',
    interval: 'month',
    features: {
      maxProjects: -1, // Unlimited
      maxCollaboratorsPerProject: -1, // Unlimited
      maxStorageMb: 102400, // 100GB
      apiAccess: true,
    },
  },
};

// Define user subscription details
export interface UserSubscription {
  planType: PlanType;
  subscriptionId: string | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  features: Record<string, any>;
}

// Define Stripe service
class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    this.initializeStripe();
  }

  private initializeStripe() {
    if (!this.stripe && typeof process !== 'undefined') {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        // Only log error in production, warn in development/build
        if (process.env.NODE_ENV === 'production') {
          logger.error('STRIPE_SECRET_KEY is not set in environment variables.');
        } else {
          logger.warn('STRIPE_SECRET_KEY is not set in environment variables. Stripe functionality will be disabled.');
        }
        return;
      }
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-04-30.basil',
        typescript: true,
      });
    }
  }

  /**
   * Get the user's current subscription plan
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const supabase = createClient();
      
      // Query the user_plans table
      const { data, error } = await supabase.rpc('stripe.get_user_plan', {
        user_id: userId,
      });

      if (error) {
        logger.error('Error fetching user subscription', { error, userId });
        throw error;
      }

      if (!data) {
        // If no subscription found, return free plan
        return {
          planType: 'free',
          subscriptionId: null,
          status: null,
          currentPeriodEnd: null,
          features: SUBSCRIPTION_PLANS.free.features,
        };
      }

      return {
        planType: data.plan_type as PlanType,
        subscriptionId: data.subscription_id,
        status: data.subscription_status,
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
        features: data.features || SUBSCRIPTION_PLANS[data.plan_type as PlanType].features,
      };
    } catch (error) {
      logger.error('Error in getUserSubscription', { error, userId });
      throw error;
    }
  }

  /**
   * Check if a user has access to a specific feature
   */
  async hasFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.rpc('stripe.has_feature_access', {
        user_id: userId,
        feature_name: featureName,
      });

      if (error) {
        logger.error('Error checking feature access', { error, userId, featureName });
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.error('Error in hasFeatureAccess', { error, userId, featureName });
      // Default to false for safety
      return false;
    }
  }

  /**
   * Get feature limits for a user
   */
  async getFeatureLimits(userId: string): Promise<Record<string, any>> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.rpc('stripe.get_feature_limits', {
        user_id: userId,
      });

      if (error) {
        logger.error('Error fetching feature limits', { error, userId });
        throw error;
      }

      return data || {};
    } catch (error) {
      logger.error('Error in getFeatureLimits', { error, userId });
      // Return free plan limits as default
      return {
        max_projects: 3,
        max_collaborators_per_project: 0,
        max_storage_mb: 100,
        api_access: false,
      };
    }
  }

  /**
   * Create a checkout session for a subscription
   */
  async createCheckoutSession(
    userId: string, 
    email: string, 
    planType: PlanType, 
    successUrl: string, 
    cancelUrl: string
  ): Promise<string | null> {
    try {
      if (!this.stripe) {
        this.initializeStripe();
        if (!this.stripe) {
          throw new Error('Stripe is not initialized');
        }
      }

      // Get the plan details
      const plan = SUBSCRIPTION_PLANS[planType];
      if (!plan || plan.price === 0) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      // Create or get Stripe customer
      const supabase = createClient();
      
      // Check if customer exists
      const { data: customerData } = await supabase
        .from('stripe.customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      let stripeCustomerId: string;

      if (customerData?.stripe_customer_id) {
        stripeCustomerId = customerData.stripe_customer_id;
      } else {
        // Create new customer in Stripe
        const customer = await this.stripe.customers.create({
          email,
          metadata: {
            userId,
          },
        });
        stripeCustomerId = customer.id;

        // Save customer in database
        await supabase.rpc('stripe.create_customer', {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          email,
        });
      }

      // Create a product if it doesn't exist
      let stripeProductId: string;
      const { data: productData } = await supabase
        .from('stripe.products')
        .select('stripe_product_id')
        .eq('name', plan.name)
        .single();

      if (productData?.stripe_product_id) {
        stripeProductId = productData.stripe_product_id;
      } else {
        // Create product in Stripe
        const product = await this.stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            planType,
          },
        });
        stripeProductId = product.id;

        // Save product in database
        await supabase.rpc('stripe.create_product', {
          stripe_product_id: stripeProductId,
          name: plan.name,
          description: plan.description,
          active: true,
          metadata: { planType },
        });
      }

      // Create a price if it doesn't exist
      let stripePriceId: string;
      const { data: priceData } = await supabase
        .from('stripe.prices')
        .select('stripe_price_id')
        .eq('currency', plan.currency)
        .eq('unit_amount', plan.price)
        .eq('type', 'recurring')
        .eq('interval', plan.interval)
        .single();

      if (priceData?.stripe_price_id) {
        stripePriceId = priceData.stripe_price_id;
      } else {
        // Create price in Stripe
        const price = await this.stripe.prices.create({
          product: stripeProductId,
          unit_amount: plan.price,
          currency: plan.currency,
          recurring: {
            interval: plan.interval,
          },
          metadata: {
            planType,
          },
        });
        stripePriceId = price.id;

        // Save price in database
        await supabase.rpc('stripe.create_price', {
          stripe_price_id: stripePriceId,
          stripe_product_id: stripeProductId,
          currency: plan.currency,
          unit_amount: plan.price,
          type: 'recurring',
          interval: plan.interval,
          active: true,
          metadata: { planType },
        });
      }

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planType,
        },
      });

      return session.url;
    } catch (error: any) {
      logger.error('Error creating checkout session', { error: error.message, userId, planType });
      return null;
    }
  }

  /**
   * Create a customer portal session for managing subscriptions
   */
  async createCustomerPortalSession(userId: string, returnUrl: string): Promise<string | null> {
    try {
      if (!this.stripe) {
        this.initializeStripe();
        if (!this.stripe) {
          throw new Error('Stripe is not initialized');
        }
      }

      const supabase = createClient();
      
      // Get customer ID
      const { data: customerData } = await supabase
        .from('stripe.customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (!customerData?.stripe_customer_id) {
        throw new Error('Customer not found');
      }

      // Create customer portal session
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerData.stripe_customer_id,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error: any) {
      logger.error('Error creating customer portal session', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      if (!this.stripe) {
        this.initializeStripe();
        if (!this.stripe) {
          throw new Error('Stripe is not initialized');
        }
      }

      const supabase = createClient();
      
      // Get subscription ID
      const { data: subscriptionData } = await supabase
        .from('stripe.user_plans')
        .select('subscription_id')
        .eq('user_id', userId)
        .single();

      if (!subscriptionData?.subscription_id) {
        throw new Error('Subscription not found');
      }

      // Get Stripe subscription ID
      const { data: stripeSubData } = await supabase
        .from('stripe.subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionData.subscription_id)
        .single();

      if (!stripeSubData?.stripe_subscription_id) {
        throw new Error('Stripe subscription not found');
      }

      // Cancel subscription in Stripe
      await this.stripe.subscriptions.cancel(stripeSubData.stripe_subscription_id);

      // Update subscription status in database
      // This will be handled by the webhook, but we'll update it here as well for immediate feedback
      await supabase
        .from('stripe.user_plans')
        .update({
          plan_type: 'free',
          subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return true;
    } catch (error: any) {
      logger.error('Error canceling subscription', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Get user's invoices
   */
  async getUserInvoices(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const supabase = createClient();
      
      // Get customer ID
      const { data: customerData } = await supabase
        .from('stripe.customers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!customerData?.id) {
        return [];
      }

      // Get invoices
      const { data: invoices, error } = await supabase
        .from('stripe.invoices')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return invoices || [];
    } catch (error) {
      logger.error('Error fetching user invoices', { error, userId });
      return [];
    }
  }

  /**
   * Process a webhook event
   */
  async processWebhookEvent(event: Stripe.Event): Promise<boolean> {
    try {
      const supabase = createClient();
      
      // Record webhook event
      await supabase.rpc('stripe.record_webhook_event', {
        stripe_event_id: event.id,
        type: event.type,
        object: event.object,
        data: event.data,
      });

      // Process specific event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode === 'subscription' && session.subscription && session.customer) {
            // Get subscription details
            if (!this.stripe) {
              this.initializeStripe();
              if (!this.stripe) {
                throw new Error('Stripe is not initialized');
              }
            }
            
            const subscriptionData = await this.stripe.subscriptions.retrieve(session.subscription as string);
            const customerId = session.customer as string;
            
            // Get price ID
            const priceId = subscriptionData.items.data[0].price.id;
            
            // Create or update subscription in database
            await supabase.rpc('stripe.create_subscription', {
              stripe_subscription_id: subscriptionData.id,
              stripe_customer_id: customerId,
              stripe_price_id: priceId,
              status: subscriptionData.status,
              current_period_start: new Date((subscriptionData as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscriptionData as any).current_period_end * 1000).toISOString(),
              cancel_at: subscriptionData.cancel_at ? new Date(subscriptionData.cancel_at * 1000).toISOString() : null,
              canceled_at: subscriptionData.canceled_at ? new Date(subscriptionData.canceled_at * 1000).toISOString() : null,
              trial_start: subscriptionData.trial_start ? new Date(subscriptionData.trial_start * 1000).toISOString() : null,
              trial_end: subscriptionData.trial_end ? new Date(subscriptionData.trial_end * 1000).toISOString() : null,
              metadata: subscriptionData.metadata,
            });
          }
          break;
        }
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscriptionData = event.data.object as Stripe.Subscription;
          
          // Get price ID
          const priceId = subscriptionData.items.data[0].price.id;
          
          // Create or update subscription in database
          await supabase.rpc('stripe.create_subscription', {
            stripe_subscription_id: subscriptionData.id,
            stripe_customer_id: subscriptionData.customer as string,
            stripe_price_id: priceId,
            status: subscriptionData.status,
              current_period_start: new Date((subscriptionData as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscriptionData as any).current_period_end * 1000).toISOString(),
            cancel_at: subscriptionData.cancel_at ? new Date(subscriptionData.cancel_at * 1000).toISOString() : null,
            canceled_at: subscriptionData.canceled_at ? new Date(subscriptionData.canceled_at * 1000).toISOString() : null,
            trial_start: subscriptionData.trial_start ? new Date(subscriptionData.trial_start * 1000).toISOString() : null,
            trial_end: subscriptionData.trial_end ? new Date(subscriptionData.trial_end * 1000).toISOString() : null,
            metadata: subscriptionData.metadata,
          });
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          
          // Create or update invoice in database
          await supabase.rpc('stripe.create_invoice', {
            stripe_invoice_id: invoice.id,
            stripe_customer_id: invoice.customer as string,
            stripe_subscription_id: (invoice as any).subscription || (invoice as any).subscription_id || null,
            status: invoice.status as string,
            amount_due: invoice.amount_due,
            amount_paid: invoice.amount_paid,
            amount_remaining: invoice.amount_remaining,
            currency: invoice.currency,
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
          });
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          
          // Create or update invoice in database
          await supabase.rpc('stripe.create_invoice', {
            stripe_invoice_id: invoice.id,
            stripe_customer_id: invoice.customer as string,
            stripe_subscription_id: (invoice as any).subscription || (invoice as any).subscription_id || null,
            status: invoice.status as string,
            amount_due: invoice.amount_due,
            amount_paid: invoice.amount_paid,
            amount_remaining: invoice.amount_remaining,
            currency: invoice.currency,
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
          });
          break;
        }
      }

      return true;
    } catch (error: any) {
      logger.error('Error processing webhook event', { error: error.message, eventType: event.type, eventId: event.id });
      return false;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
