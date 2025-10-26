const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClusterBlogPostIds() {
  try {
    const strategy = await prisma.contentStrategy.findUnique({
      where: { id: 'cmh6fn89r0000g68c31ji6bxt' },
      include: {
        pillars: {
          include: {
            clusters: {
              select: {
                id: true,
                title: true,
                blogPostId: true,
                status: true,
              }
            },
          },
        },
      },
    });

    console.log('\n🔍 Checking cluster blogPostId values:\n');

    let withBlogPostId = 0;
    let withoutBlogPostId = 0;

    for (const pillar of strategy.pillars) {
      console.log(`\n📌 ${pillar.title}`);
      for (const cluster of pillar.clusters) {
        if (cluster.blogPostId) {
          console.log(`  ✅ ${cluster.title.substring(0, 60)}... (HAS blogPostId)`);
          withBlogPostId++;
        } else {
          console.log(`  ❌ ${cluster.title.substring(0, 60)}... (NO blogPostId)`);
          withoutBlogPostId++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   With blogPostId: ${withBlogPostId}`);
    console.log(`   Without blogPostId: ${withoutBlogPostId}`);
    console.log(`   Total clusters: ${withBlogPostId + withoutBlogPostId}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClusterBlogPostIds();
