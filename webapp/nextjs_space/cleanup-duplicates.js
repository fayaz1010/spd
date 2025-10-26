const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  try {
    console.log('🧹 Starting cleanup...\n');

    const strategyId = 'cmh6fn89r0000g68c31ji6bxt';

    // Get all blog posts
    const allPosts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
      }
    });

    console.log(`📊 Total blog posts: ${allPosts.length}\n`);

    // Find duplicates by similar titles
    const titleMap = new Map();
    const duplicates = [];

    for (const post of allPosts) {
      const normalizedTitle = post.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (titleMap.has(normalizedTitle)) {
        duplicates.push(post);
        console.log(`🔄 Duplicate found: ${post.title}`);
        console.log(`   Created: ${post.createdAt}`);
        console.log(`   Will DELETE this one\n`);
      } else {
        titleMap.set(normalizedTitle, post);
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    console.log(`\n⚠️  Found ${duplicates.length} duplicate articles`);
    console.log(`📝 Keeping ${allPosts.length - duplicates.length} original articles\n`);

    // Delete duplicates
    for (const dup of duplicates) {
      await prisma.blogPost.delete({
        where: { id: dup.id }
      });
      console.log(`🗑️  Deleted: ${dup.title}`);
    }

    // Reset strategy progress
    await prisma.contentStrategy.update({
      where: { id: strategyId },
      data: {
        status: 'PLANNING',
        generationPhase: 'NOT_STARTED',
        generationProgress: 0,
      }
    });

    console.log('\n✅ Cleanup complete!');
    console.log(`   Deleted: ${duplicates.length} duplicates`);
    console.log(`   Remaining: ${allPosts.length - duplicates.length} articles`);
    console.log(`   Strategy reset to PLANNING\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();
