const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateStrategyProgress() {
  try {
    console.log('🔄 Updating strategy progress...\n');

    const strategies = await prisma.contentStrategy.findMany({
      include: {
        pillars: {
          include: {
            clusters: true,
          },
        },
      },
    });

    for (const strategy of strategies) {
      let completedCount = 0;
      
      // Count completed pillars
      for (const pillar of strategy.pillars) {
        if (pillar.blogPostId && pillar.status === 'GENERATED') {
          completedCount++;
        }
        
        // Count completed clusters
        for (const cluster of pillar.clusters) {
          if (cluster.blogPostId && cluster.status === 'GENERATED') {
            completedCount++;
          }
        }
      }

      const totalArticles = strategy.pillars.length + 
        strategy.pillars.reduce((sum, p) => sum + p.clusters.length, 0);
      
      const progress = totalArticles > 0 ? Math.round((completedCount / totalArticles) * 100) : 0;

      // Update strategy
      await prisma.contentStrategy.update({
        where: { id: strategy.id },
        data: {
          completedCount,
          generationProgress: progress,
          generationPhase: completedCount === 0 ? 'NOT_STARTED' : 
                          completedCount === totalArticles ? 'COMPLETE' : 'CONTENT',
        },
      });

      console.log(`✅ ${strategy.name}`);
      console.log(`   Completed: ${completedCount}/${totalArticles} (${progress}%)`);
      console.log(`   Phase: ${completedCount === 0 ? 'NOT_STARTED' : completedCount === totalArticles ? 'COMPLETE' : 'CONTENT'}\n`);
    }

    console.log('✅ Strategy progress updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStrategyProgress();
