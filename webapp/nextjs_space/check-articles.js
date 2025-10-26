const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArticles() {
  try {
    // Count total blog posts
    const total = await prisma.blogPost.count();
    console.log(`\n📊 Total BlogPosts in database: ${total}\n`);

    // Get recent posts
    const recent = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        wordCount: true,
        createdAt: true,
      }
    });

    if (recent.length > 0) {
      console.log('📝 Recent Articles:\n');
      recent.forEach((post, i) => {
        const date = new Date(post.createdAt).toLocaleString();
        console.log(`${i + 1}. ${post.title}`);
        console.log(`   Status: ${post.status} | Words: ${post.wordCount || 'N/A'} | Created: ${date}\n`);
      });
    } else {
      console.log('❌ No articles found in database\n');
    }

    // Check for articles created in last 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const recentCount = await prisma.blogPost.count({
      where: {
        createdAt: {
          gte: threeHoursAgo
        }
      }
    });

    console.log(`\n⏰ Articles created in last 3 hours: ${recentCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticles();
