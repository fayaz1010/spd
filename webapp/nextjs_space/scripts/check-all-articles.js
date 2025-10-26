const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllArticles() {
  try {
    console.log('Checking all articles by status...\n');
    
    // Get all articles grouped by status
    const allArticles = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        content: true,
        featuredImage: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const byStatus = {
      PUBLISHED: [],
      ENHANCED: [],
      DRAFT: [],
      ARCHIVED: [],
    };

    allArticles.forEach(article => {
      const contentLength = article.content ? article.content.length : 0;
      byStatus[article.status].push({
        title: article.title,
        contentLength,
        hasImage: !!article.featuredImage,
        publishedAt: article.publishedAt,
      });
    });

    console.log('📊 ARTICLES BY STATUS:\n');
    
    console.log(`🟢 PUBLISHED (${byStatus.PUBLISHED.length}):`);
    if (byStatus.PUBLISHED.length > 0) {
      byStatus.PUBLISHED.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Content: ${Math.round(article.contentLength / 1000)}KB | Image: ${article.hasImage ? 'Yes' : 'No'} | Published: ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}`);
      });
    } else {
      console.log('   None');
    }

    console.log(`\n🟣 ENHANCED (${byStatus.ENHANCED.length}):`);
    if (byStatus.ENHANCED.length > 0) {
      byStatus.ENHANCED.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Content: ${Math.round(article.contentLength / 1000)}KB | Image: ${article.hasImage ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('   None');
    }

    console.log(`\n🟡 DRAFT (${byStatus.DRAFT.length}):`);
    if (byStatus.DRAFT.length > 0) {
      byStatus.DRAFT.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Content: ${Math.round(article.contentLength / 1000)}KB | Image: ${article.hasImage ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('   None');
    }

    console.log(`\n⚪ ARCHIVED (${byStatus.ARCHIVED.length}):`);
    if (byStatus.ARCHIVED.length > 0) {
      byStatus.ARCHIVED.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Content: ${Math.round(article.contentLength / 1000)}KB | Image: ${article.hasImage ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('   None');
    }

    console.log('\n\n📈 SUMMARY:');
    console.log(`Total Articles: ${allArticles.length}`);
    console.log(`Published: ${byStatus.PUBLISHED.length}`);
    console.log(`Enhanced: ${byStatus.ENHANCED.length}`);
    console.log(`Draft: ${byStatus.DRAFT.length}`);
    console.log(`Archived: ${byStatus.ARCHIVED.length}`);
    console.log(`\nExpected from strategy: 40 articles`);
    console.log(`Missing: ${40 - allArticles.length} articles`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllArticles();
