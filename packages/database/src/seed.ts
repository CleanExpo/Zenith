import { PrismaClient, BusinessCategory, UserRole, OnboardingStatus } from './generated';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zenith.local' },
    update: {},
    create: {
      email: 'admin@zenith.local',
      password: adminPassword,
      name: 'Zenith Admin',
      role: UserRole.ADMIN,
      verified: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo user
  const userPassword = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@zenith.local' },
    update: {},
    create: {
      email: 'demo@zenith.local',
      password: userPassword,
      name: 'Demo User',
      role: UserRole.USER,
      verified: true,
    },
  });
  console.log('✅ Created demo user:', demoUser.email);

  // Create sample businesses
  const businesses = [
    {
      name: 'Elite Restoration Services',
      category: BusinessCategory.RESTORATION,
      location: 'Austin, TX',
      description: 'Professional water and fire damage restoration services for residential and commercial properties.',
      address: '123 Main Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      phone: '(512) 555-0123',
      email: 'info@eliterestoration.com',
      website: 'https://eliterestoration.com',
      onboardingStatus: OnboardingStatus.COMPLETED,
      ownerId: demoUser.id,
    },
    {
      name: 'TechFlow Solutions',
      category: BusinessCategory.TECHNOLOGY,
      location: 'San Francisco, CA',
      description: 'Cutting-edge web development and digital transformation services for modern businesses.',
      address: '456 Tech Avenue',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      phone: '(415) 555-0456',
      email: 'hello@techflow.io',
      website: 'https://techflow.io',
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
      ownerId: demoUser.id,
    },
    {
      name: 'Green Thumb Landscaping',
      category: BusinessCategory.LANDSCAPING,
      location: 'Denver, CO',
      description: 'Sustainable landscaping and garden design services for eco-conscious homeowners.',
      address: '789 Garden Lane',
      city: 'Denver',
      state: 'CO',
      zipCode: '80202',
      phone: '(303) 555-0789',
      email: 'contact@greenthumb.com',
      onboardingStatus: OnboardingStatus.PENDING,
      ownerId: demoUser.id,
    },
  ];

  for (const businessData of businesses) {
    const business = await prisma.business.create({
      data: businessData,
    });
    console.log(`✅ Created business: ${business.name}`);

    // Create sample content pieces for completed business
    if (business.onboardingStatus === OnboardingStatus.COMPLETED) {
      await prisma.contentPiece.createMany({
        data: [
          {
            type: 'homepage',
            title: 'Professional Restoration Services - Elite Restoration',
            content: '# Elite Restoration Services\n\nYour trusted partner for water and fire damage restoration...',
            seoTitle: 'Professional Water & Fire Damage Restoration | Elite Restoration',
            seoDescription: 'Elite Restoration provides 24/7 emergency water and fire damage restoration services in Austin, TX. Licensed, insured, and IICRC certified professionals.',
            keywords: ['water damage restoration', 'fire damage restoration', 'Austin TX', 'emergency restoration'],
            businessId: business.id,
            published: true,
          },
          {
            type: 'service_page',
            title: 'Water Damage Restoration Services',
            content: '# Water Damage Restoration\n\nFast, professional water damage restoration services...',
            seoTitle: 'Water Damage Restoration Austin | 24/7 Emergency Service',
            seoDescription: 'Professional water damage restoration in Austin, TX. Our certified technicians respond 24/7 to minimize damage and restore your property.',
            keywords: ['water damage', 'flood restoration', 'Austin water damage', 'emergency water removal'],
            businessId: business.id,
            published: true,
          },
        ],
      });

      // Create sample visual assets
      await prisma.visualAsset.createMany({
        data: [
          {
            assetType: 'hero_banner',
            title: 'Professional Restoration Team',
            description: 'Elite team of certified restoration professionals',
            imageUrl: '/assets/hero-restoration-team.jpg',
            altText: 'Professional restoration team with equipment',
            dimensions: '1920x1080',
            businessId: business.id,
          },
          {
            assetType: 'logo',
            title: 'Elite Restoration Logo',
            description: 'Company logo with professional design',
            imageUrl: '/assets/elite-restoration-logo.png',
            altText: 'Elite Restoration Services Logo',
            dimensions: '400x200',
            businessId: business.id,
          },
        ],
      });

      // Create sample SEO analytics
      await prisma.seoAnalytics.create({
        data: {
          targetKeywords: ['water damage restoration Austin', 'fire damage repair', 'emergency restoration services'],
          currentRankings: {
            'water damage restoration Austin': 12,
            'fire damage repair': 18,
            'emergency restoration services': 25,
          },
          seoScore: 78,
          recommendations: {
            'title_tags': 'Optimize title tags for better keyword targeting',
            'meta_descriptions': 'Add compelling meta descriptions to increase CTR',
            'local_seo': 'Improve Google My Business profile and local citations',
          },
          businessId: business.id,
        },
      });
    }
  }

  // Create system metrics
  await prisma.systemMetrics.createMany({
    data: [
      {
        metricType: 'response_time',
        value: 95.5,
        unit: 'ms',
        metadata: { endpoint: '/api/health' },
      },
      {
        metricType: 'cpu_usage',
        value: 25.3,
        unit: 'percentage',
      },
      {
        metricType: 'memory_usage',
        value: 67.8,
        unit: 'percentage',
      },
      {
        metricType: 'queue_size',
        value: 12,
        unit: 'count',
        metadata: { queue: 'onboarding' },
      },
    ],
  });

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`👤 Users: ${await prisma.user.count()}`);
  console.log(`🏢 Businesses: ${await prisma.business.count()}`);
  console.log(`📄 Content Pieces: ${await prisma.contentPiece.count()}`);
  console.log(`🎨 Visual Assets: ${await prisma.visualAsset.count()}`);
  console.log(`📊 SEO Analytics: ${await prisma.seoAnalytics.count()}`);
  console.log(`📈 System Metrics: ${await prisma.systemMetrics.count()}`);
  console.log('\n🔑 Demo Credentials:');
  console.log('Admin: admin@zenith.local / admin123');
  console.log('User:  demo@zenith.local / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });