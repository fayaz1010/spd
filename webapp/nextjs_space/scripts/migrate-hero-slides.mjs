/**
 * Migration Script: Import Existing Hero Slides to Database
 * Run with: node scripts/migrate-hero-slides.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const existingSlides = [
  {
    title: 'Massive Rebates Available',
    subtitle: 'Over $20,000 in Government Incentives',
    description: 'Take advantage of Federal SRES and State battery rebates. Reduce your upfront solar investment costs by up to 70% with combined rebates.',
    ctaText: 'Calculate My Rebates',
    ctaLink: '/calculator-v2',
    iconName: 'DollarSign',
    imageUrl: '/rebate carousel.png',
    gradient: 'from-gold/20 to-coral/20',
    stats: [
      { value: '$400-600', label: 'Per kW SRES' },
      { value: '30% Off', label: 'Battery Rebate' },
      { value: '$20,000+', label: 'Total Savings' },
    ],
    sortOrder: 1,
    isActive: true,
  },
  {
    title: 'Near-Zero Power Bills',
    subtitle: 'Cut Your Electricity Costs by 95%',
    description: 'Join thousands of Perth families enjoying near-zero electricity bills. Our premium solar systems with battery storage ensure maximum savings year-round.',
    ctaText: 'See My Savings',
    ctaLink: '/calculator-v2',
    iconName: 'Zap',
    imageUrl: '/0 bill carousel.png',
    gradient: 'from-primary/20 to-emerald/20',
    stats: [
      { value: '95%', label: 'Bill Reduction' },
      { value: '$3,000+', label: 'Annual Savings' },
      { value: '3-5 Years', label: 'Payback Period' },
    ],
    sortOrder: 2,
    isActive: true,
  },
  {
    title: 'Reduce Your Carbon Footprint',
    subtitle: 'Make a Real Environmental Impact',
    description: 'Every solar system installed prevents tons of CO₂ emissions annually. Help combat climate change while saving money on your energy bills.',
    ctaText: 'Calculate My Impact',
    ctaLink: '/calculator-v2',
    iconName: 'Leaf',
    imageUrl: '/images/carbon carousel.jpg',
    gradient: 'from-emerald/20 to-primary/20',
    stats: [
      { value: '4-6 Tons', label: 'CO₂ Saved/Year' },
      { value: '100+ Tons', label: 'Over 25 Years' },
      { value: 'Clean', label: 'Renewable Energy' },
    ],
    sortOrder: 3,
    isActive: true,
  },
  {
    title: 'Plant Trees with Every Install',
    subtitle: 'Equivalent to Planting 100+ Trees',
    description: 'Your solar system has the same environmental benefit as planting over 100 trees. Create a sustainable future for Perth and generations to come.',
    ctaText: 'Start Your Journey',
    ctaLink: '/calculator-v2',
    iconName: 'TreePine',
    imageUrl: '/green carousel.png',
    gradient: 'from-emerald/20 to-gold/20',
    stats: [
      { value: '100+', label: 'Tree Equivalent' },
      { value: '25 Years', label: 'System Warranty' },
      { value: '5,000+', label: 'Happy Customers' },
    ],
    sortOrder: 4,
    isActive: true,
  },
];

async function migrateSlides() {
  console.log('🚀 Starting hero slides migration...\n');

  try {
    // Check if slides already exist
    const existingCount = await prisma.heroSlide.count();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing slides in database. Skipping migration.`);
      console.log('If you want to re-import, delete existing slides first.');
      return;
    }

    // Create all slides
    for (const slide of existingSlides) {
      const created = await prisma.heroSlide.create({
        data: slide,
      });
      console.log(`✅ Created: "${created.title}" (ID: ${created.id})`);
    }

    console.log(`\n🎉 Successfully migrated ${existingSlides.length} hero slides!`);
    console.log('\n📝 Next step: Refresh the admin page to see your slides!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateSlides()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
