const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findBrokenTable() {
  const posts = await prisma.blogPost.findMany();
  
  for (const post of posts) {
    // Look for the specific text from the screenshot
    if (post.content.includes('$13,140') && post.content.includes('$876')) {
      console.log(`\n📄 Found in: ${post.title}`);
      
      const index = post.content.indexOf('$13,140');
      const context = post.content.substring(Math.max(0, index - 500), index + 500);
      console.log('\n📊 Table context:\n');
      console.log(context);
      break;
    }
  }

  await prisma.$disconnect();
}

findBrokenTable();
