import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { stripeService } from '@/lib/services/stripeService';

let stripe: Stripe | null = null;

const getStripeInstance = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('STRIPE_SECRET_KEY is not set in environment variables.');
      throw new Error('Stripe secret key is not configured.');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
      typescript: true,
    });
  }
  return stripe;
};

const relevantEvents = new Set([
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  // Add other events you need to handle
]);

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    logger.warn('Stripe webhook error: Missing signature');
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }
  if (!webhookSecret) {
    logger.error('Stripe webhook error: Missing webhook secret in environment variables.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  let event: Stripe.Event;
  let currentStripeInstance: Stripe;

  try {
    currentStripeInstance = getStripeInstance(); // Initialize Stripe instance here
    const body = await req.text(); // Stripe requires the raw body
    event = currentStripeInstance.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    // If getStripeInstance() throws, it will be caught here too.
    logger.error('Stripe webhook setup or signature verification failed', { error: err.message });
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  logger.info('Stripe webhook event received', { eventType: event.type, eventId: event.id });

  if (relevantEvents.has(event.type)) {
    try {
      // Process the webhook event using the stripeService
      const success = await stripeService.processWebhookEvent(event);
      
      if (!success) {
        logger.error('Failed to process webhook event', { eventType: event.type, eventId: event.id });
        return NextResponse.json({ error: 'Failed to process webhook event.' }, { status: 500 });
      }
      
      logger.info('Successfully processed webhook event', { eventType: event.type, eventId: event.id });
    } catch (error: any) {
      logger.error('Error handling Stripe webhook event', { eventType: event.type, error: error.message, stack: error.stack });
      // Return 500 so Stripe retries, but be cautious of infinite retries for non-transient errors.
      return NextResponse.json({ error: 'Webhook handler failed. Please check logs.' }, { status: 500 });
    }
  } else {
    logger.info('Irrelevant Stripe event type received', { eventType: event.type });
  }

  return NextResponse.json({ received: true });
}
