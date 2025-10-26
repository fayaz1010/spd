const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detailedCheck() {
  try {
    console.log('Detailed check of strategy vs blog posts...\n');
    
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

    let totalExpected = 0;
    let totalWithBlogPostId = 0;
    let totalWithoutBlogPostId = 0;

    console.log('PILLARS:');
    strategy.pillars.forEach((pillar, i) => {
      totalExpected++;
      if (pillar.blogPostId) {
        totalWithBlogPostId++;
        console.log(`${i + 1}. ${pillar.topic || 'Untitled'} ✅ Has BlogPost ID`);
      } else {
        totalWithoutBlogPostId++;
        console.log(`${i + 1}. ${pillar.topic || 'Untitled'} ❌ NO BlogPost ID`);
      }
    });

    console.log('\nCLUSTERS:');
    strategy.pillars.forEach((pillar, pi) => {
      console.log(`\nPillar ${pi + 1}: ${pillar.topic || 'Untitled'}`);
      pillar.clusters.forEach((cluster, ci) => {
        totalExpected++;
        if (cluster.blogPostId) {
          totalWithBlogPostId++;
          console.log(`  ${ci + 1}. ${cluster.topic || 'Untitled'} ✅ Has BlogPost ID`);
        } else {
          totalWithoutBlogPostId++;
          console.log(`  ${ci + 1}. ${cluster.topic || 'Untitled'} ❌ NO BlogPost ID`);
        }
      });
    });

    console.log('\n\n📊 SUMMARY:');
    console.log(`Total expected (pillars + clusters): ${totalExpected}`);
    console.log(`With BlogPost ID: ${totalWithBlogPostId}`);
    console.log(`Without BlogPost ID: ${totalWithoutBlogPostId}`);

    // Now check actual blog posts
    const allPosts = await prisma.blogPost.count();
    console.log(`\nActual blog posts in database: ${allPosts}`);
    console.log(`\nDifference: ${totalWithBlogPostId} references - ${allPosts} actual = ${totalWithBlogPostId - allPosts} deleted`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

detailedCheck();
