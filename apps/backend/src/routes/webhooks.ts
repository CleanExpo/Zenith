/**
 * Webhook Routes
 * Handles external webhooks and integrations
 */

import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { PrismaClient } from '@zenith/database';
import { validate } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const GitHubWebhookSchema = z.object({
  action: z.string(),
  repository: z.object({
    name: z.string(),
    full_name: z.string(),
  }),
  sender: z.object({
    login: z.string(),
  }),
});

const StripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
});

/**
 * POST /api/webhooks/github
 * GitHub webhook for repository events
 */
router.post('/github', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);

    // Verify GitHub webhook signature
    if (!verifyGitHubSignature(payload, signature)) {
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Webhook signature verification failed',
      });
    }

    const event = req.headers['x-github-event'] as string;
    const body = req.body;

    console.log(`GitHub webhook received: ${event}`, {
      repository: body.repository?.name,
      action: body.action,
    });

    // Handle different GitHub events
    switch (event) {
      case 'push':
        await handleGitHubPush(body);
        break;
      case 'pull_request':
        await handleGitHubPullRequest(body);
        break;
      case 'issues':
        await handleGitHubIssue(body);
        break;
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }

    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/webhooks/stripe
 * Stripe webhook for payment events
 */
router.post('/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    // Verify Stripe webhook signature
    if (!verifyStripeSignature(JSON.stringify(payload), signature)) {
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Stripe webhook signature verification failed',
      });
    }

    const event = payload;

    console.log(`Stripe webhook received: ${event.type}`, {
      id: event.id,
    });

    // Handle different Stripe events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/webhooks/agent-system
 * Internal webhook for agent system events
 */
router.post('/agent-system', async (req, res) => {
  try {
    const { event, data } = req.body;

    console.log(`Agent system webhook received: ${event}`, data);

    // Handle different agent system events
    switch (event) {
      case 'workflow.completed':
        await handleWorkflowCompleted(data);
        break;
      case 'workflow.failed':
        await handleWorkflowFailed(data);
        break;
      case 'agent.health_check':
        await handleAgentHealthCheck(data);
        break;
      default:
        console.log(`Unhandled agent system event: ${event}`);
    }

    res.json({ message: 'Agent webhook processed successfully' });
  } catch (error) {
    console.error('Agent system webhook error:', error);
    res.status(500).json({
      error: 'Agent webhook processing failed',
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/webhooks/notifications
 * General notification webhook
 */
router.post('/notifications', async (req, res) => {
  try {
    const { type, recipient, subject, message, data } = req.body;

    console.log(`Notification webhook received: ${type}`, {
      recipient,
      subject,
    });

    // Handle different notification types
    switch (type) {
      case 'email':
        await handleEmailNotification(recipient, subject, message, data);
        break;
      case 'sms':
        await handleSMSNotification(recipient, message, data);
        break;
      case 'slack':
        await handleSlackNotification(recipient, message, data);
        break;
      default:
        console.log(`Unhandled notification type: ${type}`);
    }

    res.json({ message: 'Notification processed successfully' });
  } catch (error) {
    console.error('Notification webhook error:', error);
    res.status(500).json({
      error: 'Notification processing failed',
      message: 'Internal server error',
    });
  }
});

// Helper functions for signature verification
function verifyGitHubSignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

function verifyStripeSignature(payload: string, signature: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;

  try {
    const elements = signature.split(',');
    const signatureElements = elements.reduce((acc, element) => {
      const [key, value] = element.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = signatureElements.t;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex');

    return signatureElements.v1 === expectedSignature;
  } catch {
    return false;
  }
}

// Event handlers
async function handleGitHubPush(data: any) {
  console.log('Processing GitHub push event', {
    repository: data.repository.name,
    commits: data.commits?.length || 0,
  });
  
  // Handle deployment triggers, notifications, etc.
}

async function handleGitHubPullRequest(data: any) {
  console.log('Processing GitHub pull request event', {
    action: data.action,
    pr: data.pull_request.number,
  });
  
  // Handle PR notifications, automated testing, etc.
}

async function handleGitHubIssue(data: any) {
  console.log('Processing GitHub issue event', {
    action: data.action,
    issue: data.issue.number,
  });
  
  // Handle issue notifications, project management integration, etc.
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log('Processing successful payment', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
  });
  
  // Update subscription status, send confirmation emails, etc.
}

async function handlePaymentFailed(paymentIntent: any) {
  console.log('Processing failed payment', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
  });
  
  // Handle failed payments, retry logic, notifications, etc.
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('Processing new subscription', {
    id: subscription.id,
    customer: subscription.customer,
  });
  
  // Activate user account, send welcome emails, etc.
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing subscription cancellation', {
    id: subscription.id,
    customer: subscription.customer,
  });
  
  // Deactivate features, send cancellation emails, etc.
}

async function handleWorkflowCompleted(data: any) {
  console.log('Processing completed workflow', {
    workflowId: data.workflowId,
    businessId: data.businessId,
  });
  
  try {
    // Update business onboarding status
    if (data.businessId) {
      await prisma.business.update({
        where: { id: data.businessId },
        data: { 
          onboardingStatus: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }
    
    // Send completion notifications
    await handleEmailNotification(
      data.userEmail,
      'Business Onboarding Complete!',
      'Your business onboarding has been completed successfully.',
      data
    );
  } catch (error) {
    console.error('Error processing workflow completion:', error);
  }
}

async function handleWorkflowFailed(data: any) {
  console.log('Processing failed workflow', {
    workflowId: data.workflowId,
    businessId: data.businessId,
    error: data.error,
  });
  
  try {
    // Update business onboarding status
    if (data.businessId) {
      await prisma.business.update({
        where: { id: data.businessId },
        data: { 
          onboardingStatus: 'FAILED',
        },
      });
    }
    
    // Send failure notifications
    await handleEmailNotification(
      data.userEmail,
      'Business Onboarding Failed',
      'There was an issue with your business onboarding. Our team has been notified.',
      data
    );
  } catch (error) {
    console.error('Error processing workflow failure:', error);
  }
}

async function handleAgentHealthCheck(data: any) {
  console.log('Processing agent health check', {
    agentType: data.agentType,
    healthy: data.healthy,
  });
  
  try {
    // Store health check data
    await prisma.agentHealthCheck.create({
      data: {
        agentType: data.agentType,
        healthy: data.healthy,
        responseTime: data.responseTime,
        metadata: data.metadata || {},
        businessId: data.businessId,
      },
    });
  } catch (error) {
    console.error('Error storing agent health check:', error);
  }
}

async function handleEmailNotification(recipient: string, subject: string, message: string, data?: any) {
  console.log('Sending email notification', {
    recipient,
    subject,
  });
  
  // Integrate with email service (SendGrid, AWS SES, etc.)
  // For now, just log the notification
}

async function handleSMSNotification(recipient: string, message: string, data?: any) {
  console.log('Sending SMS notification', {
    recipient,
    message: message.substring(0, 50) + '...',
  });
  
  // Integrate with SMS service (Twilio, AWS SNS, etc.)
}

async function handleSlackNotification(channel: string, message: string, data?: any) {
  console.log('Sending Slack notification', {
    channel,
    message: message.substring(0, 50) + '...',
  });
  
  // Integrate with Slack API
}

export default router;