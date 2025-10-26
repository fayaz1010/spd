const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClusterStatus() {
  try {
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

    console.log(`\n📊 Strategy: ${strategy.name}\n`);
    console.log(`Total Pillars: ${strategy.pillars.length}`);
    console.log(`Total Clusters: ${strategy.pillars.reduce((sum, p) => sum + p.clusters.length, 0)}\n`);

    let totalGenerated = 0;
    let totalMissing = 0;

    for (const pillar of strategy.pillars) {
      const pillarGenerated = pillar.blogPostId ? '✅' : '❌';
      console.log(`${pillarGenerated} Pillar: ${pillar.title}`);
      console.log(`   Status: ${pillar.status}`);
      console.log(`   BlogPostId: ${pillar.blogPostId || 'NONE'}`);
      
      if (pillar.blogPostId) totalGenerated++;
      else totalMissing++;

      for (const cluster of pillar.clusters) {
        const clusterGenerated = cluster.blogPostId ? '✅' : '❌';
        console.log(`   ${clusterGenerated} Cluster: ${cluster.title}`);
        console.log(`      Status: ${cluster.status}`);
        console.log(`      BlogPostId: ${cluster.blogPostId || 'NONE'}`);
        
        if (cluster.blogPostId) totalGenerated++;
        else totalMissing++;
      }
      console.log('');
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Generated: ${totalGenerated}`);
    console.log(`   Missing: ${totalMissing}`);
    console.log(`   Total: ${totalGenerated + totalMissing}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClusterStatus();
