/**
 * Business Management Routes
 * Handles business CRUD operations and onboarding workflows
 */

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, BusinessCategory, OnboardingStatus } from '@zenith/database';
import { validate, validateParams } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const CreateBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.nativeEnum(BusinessCategory),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
});

const UpdateBusinessSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.nativeEnum(BusinessCategory).optional(),
  location: z.string().min(2).optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  onboardingStatus: z.nativeEnum(OnboardingStatus).optional(),
});

const BusinessParamsSchema = z.object({
  id: z.string().uuid('Invalid business ID format'),
});

const StartOnboardingSchema = z.object({
  skipSteps: z.array(z.string()).optional(),
  customInstructions: z.string().optional(),
  prioritizeSpeed: z.boolean().optional().default(false),
  generateVisuals: z.boolean().optional().default(true),
});

/**
 * GET /api/business
 * Get all businesses for the authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '10', category, status, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      ownerId: userId,
    };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.onboardingStatus = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get businesses with pagination
    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              visualAssets: true,
              analyticsReports: true,
            },
          },
        },
      }),
      prisma.business.count({ where }),
    ]);

    res.json({
      businesses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({
      error: 'Failed to fetch businesses',
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/business
 * Create a new business
 */
router.post('/', authenticate, validate(CreateBusinessSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const businessData = req.body;

    const business = await prisma.business.create({
      data: {
        ...businessData,
        ownerId: userId,
        onboardingStatus: OnboardingStatus.PENDING,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Business created successfully',
      business,
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({
      error: 'Failed to create business',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/business/:id
 * Get a specific business by ID
 */
router.get('/:id', authenticate, validateParams(BusinessParamsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const business = await prisma.business.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        visualAssets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        analyticsReports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        workflowExecutions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            visualAssets: true,
            analyticsReports: true,
            workflowExecutions: true,
            agentHealthChecks: true,
          },
        },
      },
    });

    if (!business) {
      return res.status(404).json({
        error: 'Business not found',
        message: 'Business not found or you do not have access to it',
      });
    }

    res.json({ business });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({
      error: 'Failed to fetch business',
      message: 'Internal server error',
    });
  }
});

/**
 * PUT /api/business/:id
 * Update a business
 */
router.put('/:id', authenticate, validateParams(BusinessParamsSchema), validate(UpdateBusinessSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    // Check if business exists and user owns it
    const existingBusiness = await prisma.business.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!existingBusiness) {
      return res.status(404).json({
        error: 'Business not found',
        message: 'Business not found or you do not have access to it',
      });
    }

    // Update business
    const business = await prisma.business.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Business updated successfully',
      business,
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({
      error: 'Failed to update business',
      message: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/business/:id
 * Delete a business
 */
router.delete('/:id', authenticate, validateParams(BusinessParamsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if business exists and user owns it
    const existingBusiness = await prisma.business.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!existingBusiness) {
      return res.status(404).json({
        error: 'Business not found',
        message: 'Business not found or you do not have access to it',
      });
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.$transaction([
      prisma.agentHealthCheck.deleteMany({ where: { businessId: id } }),
      prisma.analyticsReport.deleteMany({ where: { businessId: id } }),
      prisma.visualAsset.deleteMany({ where: { businessId: id } }),
      prisma.workflowExecution.deleteMany({ where: { businessId: id } }),
      prisma.business.delete({ where: { id } }),
    ]);

    res.json({
      message: 'Business deleted successfully',
    });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({
      error: 'Failed to delete business',
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/business/:id/onboarding
 * Start onboarding workflow for a business
 */
router.post('/:id/onboarding', authenticate, validateParams(BusinessParamsSchema), validate(StartOnboardingSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const options = req.body;

    // Check if business exists and user owns it
    const business = await prisma.business.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!business) {
      return res.status(404).json({
        error: 'Business not found',
        message: 'Business not found or you do not have access to it',
      });
    }

    // Check if onboarding is already in progress
    if (business.onboardingStatus === OnboardingStatus.ONBOARDING) {
      return res.status(400).json({
        error: 'Onboarding in progress',
        message: 'Onboarding workflow is already running for this business',
      });
    }

    // Get agent manager from app context
    const agentManager = req.app.get('agentManager');
    if (!agentManager) {
      return res.status(503).json({
        error: 'Agent system unavailable',
        message: 'Agent system is not properly initialized',
      });
    }

    // Start onboarding workflow
    const result = await agentManager.startOnboardingWorkflow(id, options);

    // Update business status
    await prisma.business.update({
      where: { id },
      data: { onboardingStatus: OnboardingStatus.ONBOARDING },
    });

    res.json({
      message: 'Onboarding workflow started successfully',
      workflowId: result.workflowId,
      business: {
        id: business.id,
        name: business.name,
        onboardingStatus: OnboardingStatus.ONBOARDING,
      },
    });
  } catch (error) {
    console.error('Start onboarding error:', error);
    res.status(500).json({
      error: 'Failed to start onboarding',
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/business/:id/workflows
 * Get workflow history for a business
 */
router.get('/:id/workflows', authenticate, validateParams(BusinessParamsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if business exists and user owns it
    const business = await prisma.business.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!business) {
      return res.status(404).json({
        error: 'Business not found',
        message: 'Business not found or you do not have access to it',
      });
    }

    // Get agent manager for workflow status
    const agentManager = req.app.get('agentManager');
    if (!agentManager) {
      return res.status(503).json({
        error: 'Agent system unavailable',
        message: 'Agent system is not properly initialized',
      });
    }

    // Get workflows from agent system
    const workflows = agentManager.getJobScheduler().getWorkflowsByBusinessId(id);

    res.json({
      businessId: id,
      workflows,
      total: workflows.length,
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      error: 'Failed to fetch workflows',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/business/categories
 * Get all available business categories
 */
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = Object.values(BusinessCategory).map(category => ({
      value: category,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/business/stats
 * Get business statistics for the authenticated user
 */
router.get('/meta/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const [
      totalBusinesses,
      completedOnboarding,
      onboardingInProgress,
      pendingOnboarding,
      categoryStats,
    ] = await Promise.all([
      prisma.business.count({ where: { ownerId: userId } }),
      prisma.business.count({ 
        where: { 
          ownerId: userId, 
          onboardingStatus: OnboardingStatus.COMPLETED 
        } 
      }),
      prisma.business.count({ 
        where: { 
          ownerId: userId, 
          onboardingStatus: OnboardingStatus.ONBOARDING 
        } 
      }),
      prisma.business.count({ 
        where: { 
          ownerId: userId, 
          onboardingStatus: OnboardingStatus.PENDING 
        } 
      }),
      prisma.business.groupBy({
        by: ['category'],
        where: { ownerId: userId },
        _count: { category: true },
      }),
    ]);

    res.json({
      summary: {
        totalBusinesses,
        completedOnboarding,
        onboardingInProgress,
        pendingOnboarding,
        completionRate: totalBusinesses > 0 ? (completedOnboarding / totalBusinesses) * 100 : 0,
      },
      categoryBreakdown: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.category,
      })),
    });
  } catch (error) {
    console.error('Get business stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch business statistics',
      message: 'Internal server error',
    });
  }
});

export default router;