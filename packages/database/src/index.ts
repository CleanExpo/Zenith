import { PrismaClient } from './generated';

export * from './generated';

// Create global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database utilities
export class DatabaseService {
  static async connect(): Promise<void> {
    await prisma.$connect();
  }

  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  static async reset(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production');
    }
    
    // Delete all data in reverse order of dependencies
    await prisma.refreshToken.deleteMany();
    await prisma.queueJob.deleteMany();
    await prisma.systemMetrics.deleteMany();
    await prisma.workflowTask.deleteMany();
    await prisma.workflowExecution.deleteMany();
    await prisma.agentHealthCheck.deleteMany();
    await prisma.seoAnalytics.deleteMany();
    await prisma.contentPiece.deleteMany();
    await prisma.analyticsReport.deleteMany();
    await prisma.visualAsset.deleteMany();
    await prisma.business.deleteMany();
    await prisma.user.deleteMany();
  }
}

export default prisma;