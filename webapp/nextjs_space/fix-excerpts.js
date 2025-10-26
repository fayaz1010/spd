const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExcerpts() {
  try {
    console.log('🔧 Fixing article excerpts...\n');

    const posts = await prisma.blogPost.findMany();
    
    let fixed = 0;

    for (const post of posts) {
      let excerpt = post.excerpt || '';
      
      // Remove markdown from excerpt
      excerpt = excerpt.replace(/^#{1,6}\s+/gm, '');
      excerpt = excerpt.replace(/\*\*([^*]+)\*\*/g, '$1');
      excerpt = excerpt.replace(/\*([^*]+)\*/g, '$1');
      excerpt = excerpt.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      
      if (excerpt !== post.excerpt) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { excerpt },
        });
        console.log(`✅ Fixed excerpt for: ${post.title.substring(0, 60)}...`);
        fixed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} excerpts!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExcerpts();
