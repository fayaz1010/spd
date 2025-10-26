const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkClustersToPosts() {
  try {
    console.log('🔗 Linking clusters to their blog posts...\n');

    const strategy = await prisma.contentStrategy.findUnique({
      where: { id: 'cmh6fn89r0000g68c31ji6bxt' },
      include: {
        pillars: {
          include: {
            clusters: true,
          },
        },
      },
    });

    // Get all blog posts
    const allPosts = await prisma.blogPost.findMany();

    let linked = 0;

    for (const pillar of strategy.pillars) {
      for (const cluster of pillar.clusters) {
        if (!cluster.blogPostId) {
          // Find matching blog post by title similarity
          const normalizedClusterTitle = cluster.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          const matchingPost = allPosts.find(post => {
            const normalizedPostTitle = post.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalizedPostTitle === normalizedClusterTitle;
          });

          if (matchingPost) {
            await prisma.cluster.update({
              where: { id: cluster.id },
              data: {
                blogPostId: matchingPost.id,
                status: 'GENERATED',
              },
            });
            console.log(`✅ Linked: ${cluster.title.substring(0, 60)}...`);
            linked++;
          } else {
            console.log(`❌ No match found for: ${cluster.title.substring(0, 60)}...`);
          }
        }
      }
    }

    console.log(`\n✅ Linked ${linked} clusters to their blog posts\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkClustersToPosts();
