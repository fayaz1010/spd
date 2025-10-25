/**
 * Check Database Status
 * 
 * Quick script to see what's in the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');
  
  try {
    // Check strategies
    const strategies = await prisma.contentStrategy.findMany({
      include: {
        _count: {
          select: {
            pillars: true,
          },
        },
      },
    });
    
    console.log('📋 STRATEGIES:');
    console.log(`   Total: ${strategies.length}`);
    if (strategies.length > 0) {
      strategies.forEach(s => {
        console.log(`   - ${s.mainTopic} (${s.status}) - ${s._count.pillars} pillars`);
      });
    }
    console.log('');
    
    // Check pillars
    const pillars = await prisma.pillar.findMany();
    console.log('📌 PILLARS:');
    console.log(`   Total: ${pillars.length}`);
    console.log('');
    
    // Check clusters
    const clusters = await prisma.cluster.findMany();
    console.log('📎 CLUSTERS:');
    console.log(`   Total: ${clusters.length}`);
    console.log('');
    
    // Check blog posts
    const blogPosts = await prisma.blogPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    console.log('📝 BLOG POSTS (last 10):');
    console.log(`   Total: ${blogPosts.length}`);
    if (blogPosts.length > 0) {
      blogPosts.forEach(post => {
        console.log(`   - ${post.title} (${post.status})`);
      });
    }
    console.log('');
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('SUMMARY:');
    console.log(`   Strategies: ${strategies.length}`);
    console.log(`   Pillars: ${pillars.length}`);
    console.log(`   Clusters: ${clusters.length}`);
    console.log(`   Blog Posts: ${blogPosts.length}`);
    console.log('═══════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
