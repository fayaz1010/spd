const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteRecentDuplicates() {
  try {
    console.log('🧹 Deleting recent duplicates...\n');

    // Get all blog posts created in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const recentPosts = await prisma.blogPost.findMany({
      where: {
        createdAt: {
          gte: tenMinutesAgo
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${recentPosts.length} articles created in last 10 minutes\n`);

    if (recentPosts.length === 0) {
      console.log('✅ No recent articles to delete');
      return;
    }

    // Show what will be deleted
    console.log('Will DELETE these articles:');
    recentPosts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`);
      console.log(`   Created: ${post.createdAt}\n`);
    });

    // Delete them
    const result = await prisma.blogPost.deleteMany({
      where: {
        createdAt: {
          gte: tenMinutesAgo
        }
      }
    });

    console.log(`\n✅ Deleted ${result.count} recent duplicate articles`);

    // Reset strategy
    await prisma.contentStrategy.update({
      where: { id: 'cmh6fn89r0000g68c31ji6bxt' },
      data: {
        status: 'PLANNING',
        generationPhase: 'CONTENT',
        generationProgress: 71,
      }
    });

    console.log('✅ Strategy reset\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteRecentDuplicates();
