const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEnhancedStatus() {
  try {
    console.log('Finding articles with images (already enhanced)...');
    
    // Find all articles that have featuredImage (meaning they were enhanced)
    // but still have DRAFT status
    const articlesWithImages = await prisma.blogPost.findMany({
      where: {
        featuredImage: {
          not: null,
        },
        status: 'DRAFT',
      },
      select: {
        id: true,
        title: true,
        featuredImage: true,
      },
    });

    console.log(`Found ${articlesWithImages.length} articles with images but DRAFT status`);

    if (articlesWithImages.length === 0) {
      console.log('No articles to update!');
      return;
    }

    // Update them to ENHANCED
    const result = await prisma.blogPost.updateMany({
      where: {
        featuredImage: {
          not: null,
        },
        status: 'DRAFT',
      },
      data: {
        status: 'ENHANCED',
      },
    });

    console.log(`✅ Updated ${result.count} articles to ENHANCED status`);
    
    // Show which articles were updated
    articlesWithImages.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
    });

  } catch (error) {
    console.error('Error updating status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEnhancedStatus();
