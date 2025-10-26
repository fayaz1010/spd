const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeletedArticles() {
  try {
    console.log('Checking for orphaned pillar/cluster references...\n');
    
    // Get the strategy
    const strategy = await prisma.contentStrategy.findFirst({
      where: {
        name: {
          contains: 'Solar SEO',
        },
      },
      include: {
        pillars: {
          include: {
            clusters: true,
          },
        },
      },
    });

    if (!strategy) {
      console.log('No strategy found!');
      return;
    }

    // Check for blogPostIds that don't exist
    const allBlogPostIds = [];
    
    strategy.pillars.forEach(pillar => {
      if (pillar.blogPostId) {
        allBlogPostIds.push({
          id: pillar.blogPostId,
          type: 'pillar',
          topic: pillar.topic,
        });
      }
      
      pillar.clusters.forEach(cluster => {
        if (cluster.blogPostId) {
          allBlogPostIds.push({
            id: cluster.blogPostId,
            type: 'cluster',
            topic: cluster.topic,
          });
        }
      });
    });

    console.log(`Total blogPostIds in strategy: ${allBlogPostIds.length}\n`);

    // Check which ones actually exist
    const existingPosts = await prisma.blogPost.findMany({
      where: {
        id: {
          in: allBlogPostIds.map(b => b.id),
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const existingIds = new Set(existingPosts.map(p => p.id));
    const deletedRefs = allBlogPostIds.filter(b => !existingIds.has(b.id));

    console.log(`Existing blog posts: ${existingPosts.length}`);
    console.log(`Deleted/Missing blog posts: ${deletedRefs.length}\n`);

    if (deletedRefs.length > 0) {
      console.log('❌ DELETED/MISSING ARTICLES:');
      deletedRefs.forEach((ref, index) => {
        console.log(`${index + 1}. [${ref.type}] ${ref.topic || 'Unknown'}`);
        console.log(`   BlogPost ID: ${ref.id}`);
      });
      console.log('\n💡 These pillar/cluster entries reference blog posts that no longer exist.');
      console.log('   This could happen if:');
      console.log('   1. The article was deleted manually');
      console.log('   2. The save operation failed and rolled back');
      console.log('   3. Database inconsistency');
    }

    // Check for blog posts not linked to strategy
    const allExistingPosts = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const linkedIds = new Set(allBlogPostIds.map(b => b.id));
    const unlinkedPosts = allExistingPosts.filter(p => !linkedIds.has(p.id));

    if (unlinkedPosts.length > 0) {
      console.log('\n\n⚠️ UNLINKED BLOG POSTS (not in strategy):');
      unlinkedPosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   ID: ${post.id} | Created: ${new Date(post.createdAt).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeletedArticles();
