const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMissingContent() {
  try {
    console.log('Checking for articles with missing or empty content...\n');
    
    // Find all articles with no content or very short content
    const articles = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        featuredImage: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const missingContent = [];
    const hasContent = [];
    
    articles.forEach(article => {
      const contentLength = article.content ? article.content.length : 0;
      
      if (contentLength < 100) {
        missingContent.push({
          title: article.title,
          contentLength,
          status: article.status,
          hasImage: !!article.featuredImage,
        });
      } else {
        hasContent.push({
          title: article.title,
          contentLength,
          status: article.status,
          hasImage: !!article.featuredImage,
        });
      }
    });

    console.log('📊 SUMMARY:');
    console.log(`Total articles: ${articles.length}`);
    console.log(`With content: ${hasContent.length}`);
    console.log(`Missing/empty content: ${missingContent.length}\n`);

    if (missingContent.length > 0) {
      console.log('❌ ARTICLES WITH MISSING CONTENT:');
      missingContent.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Content: ${article.contentLength} chars | Status: ${article.status} | Image: ${article.hasImage ? 'Yes' : 'No'}`);
      });
      console.log('');
    }

    if (hasContent.length > 0) {
      console.log('✅ ARTICLES WITH CONTENT:');
      const enhanced = hasContent.filter(a => a.status === 'ENHANCED');
      const draft = hasContent.filter(a => a.status === 'DRAFT');
      
      console.log(`\nENHANCED (${enhanced.length}):`);
      enhanced.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${Math.round(article.contentLength / 1000)}KB)`);
      });
      
      console.log(`\nDRAFT (${draft.length}):`);
      draft.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${Math.round(article.contentLength / 1000)}KB)`);
      });
    }

  } catch (error) {
    console.error('Error checking content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingContent();
