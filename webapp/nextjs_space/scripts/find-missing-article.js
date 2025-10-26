const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findMissingArticle() {
  try {
    console.log('Looking for the missing article...\n');
    
    // Get the content strategy
    const strategy = await prisma.contentStrategy.findFirst({
      where: {
        name: {
          contains: 'Solar SEO',
        },
      },
      include: {
        pillars: {
          include: {
            blogPost: {
              select: {
                id: true,
                title: true,
                content: true,
              },
            },
            clusters: {
              include: {
                blogPost: {
                  select: {
                    id: true,
                    title: true,
                    content: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!strategy) {
      console.log('No strategy found!');
      return;
    }

    console.log(`Strategy: ${strategy.name}`);
    console.log(`Total Pillars: ${strategy.totalPillars}`);
    console.log(`Total Clusters: ${strategy.totalClusters}`);
    console.log(`Expected Total: ${strategy.totalPillars + strategy.totalClusters}\n`);

    // Check pillars
    console.log('PILLARS:');
    const missingPillars = [];
    strategy.pillars.forEach((pillar, index) => {
      if (pillar.blogPostId && pillar.blogPost) {
        const contentLength = pillar.blogPost.content ? pillar.blogPost.content.length : 0;
        console.log(`${index + 1}. ${pillar.topic} - ${pillar.blogPost.title}`);
        console.log(`   Content: ${contentLength} chars | BlogPost ID: ${pillar.blogPostId}`);
        
        if (contentLength < 100) {
          missingPillars.push({
            topic: pillar.topic,
            title: pillar.blogPost.title,
            blogPostId: pillar.blogPostId,
          });
        }
      } else if (pillar.blogPostId) {
        console.log(`${index + 1}. ${pillar.topic} - ❌ BlogPost not found (ID: ${pillar.blogPostId})`);
        missingPillars.push({
          topic: pillar.topic,
          blogPostId: pillar.blogPostId,
          deleted: true,
        });
      } else {
        console.log(`${index + 1}. ${pillar.topic} - ⚠️ No BlogPost ID`);
        missingPillars.push({
          topic: pillar.topic,
          noBlogPost: true,
        });
      }
    });

    console.log('\nCLUSTERS:');
    const missingClusters = [];
    strategy.pillars.forEach((pillar, pillarIndex) => {
      console.log(`\nPillar ${pillarIndex + 1}: ${pillar.topic}`);
      pillar.clusters.forEach((cluster, clusterIndex) => {
        if (cluster.blogPostId && cluster.blogPost) {
          const contentLength = cluster.blogPost.content ? cluster.blogPost.content.length : 0;
          console.log(`  ${clusterIndex + 1}. ${cluster.topic} - ${cluster.blogPost.title}`);
          console.log(`     Content: ${contentLength} chars | BlogPost ID: ${cluster.blogPostId}`);
          
          if (contentLength < 100) {
            missingClusters.push({
              pillar: pillar.topic,
              topic: cluster.topic,
              title: cluster.blogPost.title,
              blogPostId: cluster.blogPostId,
            });
          }
        } else if (cluster.blogPostId) {
          console.log(`  ${clusterIndex + 1}. ${cluster.topic} - ❌ BlogPost not found (ID: ${cluster.blogPostId})`);
          missingClusters.push({
            pillar: pillar.topic,
            topic: cluster.topic,
            blogPostId: cluster.blogPostId,
            deleted: true,
          });
        } else {
          console.log(`  ${clusterIndex + 1}. ${cluster.topic} - ⚠️ No BlogPost ID`);
          missingClusters.push({
            pillar: pillar.topic,
            topic: cluster.topic,
            noBlogPost: true,
          });
        }
      });
    });

    console.log('\n\n📊 SUMMARY:');
    console.log(`Missing/Empty Pillars: ${missingPillars.length}`);
    console.log(`Missing/Empty Clusters: ${missingClusters.length}`);
    console.log(`Total Missing: ${missingPillars.length + missingClusters.length}`);

    if (missingPillars.length > 0) {
      console.log('\n❌ MISSING PILLARS:');
      missingPillars.forEach((p, i) => {
        if (p.deleted) {
          console.log(`${i + 1}. ${p.topic} - BlogPost deleted (ID: ${p.blogPostId})`);
        } else if (p.noBlogPost) {
          console.log(`${i + 1}. ${p.topic} - Never generated`);
        } else {
          console.log(`${i + 1}. ${p.topic} - Empty content (ID: ${p.blogPostId})`);
        }
      });
    }

    if (missingClusters.length > 0) {
      console.log('\n❌ MISSING CLUSTERS:');
      missingClusters.forEach((c, i) => {
        if (c.deleted) {
          console.log(`${i + 1}. [${c.pillar}] ${c.topic} - BlogPost deleted (ID: ${c.blogPostId})`);
        } else if (c.noBlogPost) {
          console.log(`${i + 1}. [${c.pillar}] ${c.topic} - Never generated`);
        } else {
          console.log(`${i + 1}. [${c.pillar}] ${c.topic} - Empty content (ID: ${c.blogPostId})`);
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMissingArticle();
