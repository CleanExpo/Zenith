/**
 * Authentication Routes
 * Handles user registration, login, and JWT token management
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@zenith/database';
import { validate } from '../middleware/validate';
import { asyncHandler, NotFoundError, ConflictError, AuthenticationError } from '../middleware/errorHandler';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const prisma = new PrismaClient();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
});

// Validation schemas
const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validate(RegisterSchema), asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user,
    tokens: {
      accessToken,
      refreshToken,
    },
  });
}));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authLimiter, validate(LoginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Clean up old refresh tokens for this user
  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id,
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };

  res.json({
    success: true,
    message: 'Login successful',
    user: userResponse,
    tokens: {
      accessToken,
      refreshToken,
    },
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', validate(RefreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired',
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenRecord.user);

    // Replace old refresh token with new one
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const userResponse = {
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      name: tokenRecord.user.name,
      role: tokenRecord.user.role,
    };

    res.json({
      message: 'Token refreshed successfully',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post('/logout', validate(RefreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided',
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT secret not configured',
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User associated with token no longer exists',
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired',
    });
  }
});

/**
 * Helper function to generate JWT tokens
 */
function generateTokens(user: any) {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: '15m', // 15 minutes
    issuer: 'zenith-platform',
    audience: 'zenith-users',
  });

  const refreshToken = jwt.sign(
    { id: user.id },
    jwtRefreshSecret,
    {
      expiresIn: '7d', // 7 days
      issuer: 'zenith-platform',
      audience: 'zenith-users',
    }
  );

  return { accessToken, refreshToken };
}

export default router;