const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTableEditComments() {
  try {
    console.log('🔧 Adding helpful comments to tables for editing...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // Add HTML comment before tables to help with editing
      if (content.includes('<table') && !content.includes('<!-- TABLE:')) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        
        // Add comment before each table
        content = content.replace(
          /<table style="width: 100%; border-collapse: collapse;/g,
          '<!-- TABLE: To edit values, find the <td> tags below and change the text between them. Example: <td>$5,180</td> -->\n<table style="width: 100%; border-collapse: collapse;'
        );

        hasChanges = true;
        console.log('   ✅ Added edit comment');
      }

      if (hasChanges) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { content },
        });
        fixed++;
      }
    }

    console.log(`\n✅ Updated ${fixed} articles!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

addTableEditComments();
