const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setAllToDraft() {
  try {
    console.log('Changing all PUBLISHED articles to DRAFT...');
    
    const result = await prisma.blogPost.updateMany({
      where: {
        status: 'PUBLISHED'
      },
      data: {
        status: 'DRAFT'
      }
    });
    
    console.log(`✅ Successfully updated ${result.count} articles from PUBLISHED to DRAFT`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setAllToDraft();
