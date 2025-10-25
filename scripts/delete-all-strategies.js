/**
 * Delete All Content Strategies
 * 
 * WARNING: This will delete ALL strategies and their articles!
 * Use with caution!
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllStrategies() {
  console.log('🗑️  Deleting all content strategies...\n');
  
  try {
    // Get all strategies
    const strategies = await prisma.contentStrategy.findMany({
      include: {
        pillars: {
          include: {
            blogPost: true,
            clusters: {
              include: {
                blogPost: true,
              },
            },
          },
        },
      },
    });
    
    if (strategies.length === 0) {
      console.log('✅ No strategies found. Database is clean!');
      return;
    }
    
    console.log(`Found ${strategies.length} strateg${strategies.length === 1 ? 'y' : 'ies'}:\n`);
    
    let totalBlogPosts = 0;
    let totalPillars = 0;
    let totalClusters = 0;
    
    // Delete each strategy
    for (const strategy of strategies) {
      console.log(`📋 Strategy: ${strategy.mainTopic}`);
      console.log(`   ID: ${strategy.id}`);
      console.log(`   Created: ${strategy.createdAt.toLocaleDateString()}`);
      
      let blogPosts = 0;
      let pillars = 0;
      let clusters = 0;
      
      // Delete blog posts
      for (const pillar of strategy.pillars) {
        if (pillar.blogPostId) {
          await prisma.blogPost.delete({
            where: { id: pillar.blogPostId },
          });
          blogPosts++;
        }
        
        for (const cluster of pillar.clusters) {
          if (cluster.blogPostId) {
            await prisma.blogPost.delete({
              where: { id: cluster.blogPostId },
            });
            blogPosts++;
          }
          clusters++;
        }
        
        pillars++;
      }
      
      // Delete strategy (cascades to pillars and clusters)
      await prisma.contentStrategy.delete({
        where: { id: strategy.id },
      });
      
      console.log(`   ✅ Deleted: ${blogPosts} articles, ${pillars} pillars, ${clusters} clusters\n`);
      
      totalBlogPosts += blogPosts;
      totalPillars += pillars;
      totalClusters += clusters;
    }
    
    console.log('═══════════════════════════════════════');
    console.log('✅ All strategies deleted successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   - Strategies: ${strategies.length}`);
    console.log(`   - Blog posts: ${totalBlogPosts}`);
    console.log(`   - Pillars: ${totalPillars}`);
    console.log(`   - Clusters: ${totalClusters}`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteAllStrategies()
  .then(() => {
    console.log('✨ Done! You can now start fresh.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
