const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTableNotesStyle() {
  try {
    console.log('🔧 Updating table notes styling...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // Update existing Battery Only and Battery + Inverter list items with new styling
      if (content.includes('<li><strong>Battery Only:') || content.includes('<li><strong>Battery + Inverter:')) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        
        // Replace Battery Only items
        content = content.replace(
          /<li><strong>Battery Only:<\/strong>(.*?)<\/li>/gi,
          '<li style="font-size: 0.875rem; font-style: italic; color: #6b7280; line-height: 1.5;"><strong style="font-style: normal;">Battery Only:</strong>$1</li>'
        );

        // Replace Battery + Inverter items
        content = content.replace(
          /<li><strong>Battery \+ Inverter:<\/strong>(.*?)<\/li>/gi,
          '<li style="font-size: 0.875rem; font-style: italic; color: #6b7280; line-height: 1.5;"><strong style="font-style: normal;">Battery + Inverter:</strong>$1</li>'
        );

        // Update ul wrapper styling
        content = content.replace(
          /<ul style="list-style-type: disc; padding-left: 1\.5rem; margin: 1rem 0;">/g,
          '<ul style="list-style-type: disc; padding-left: 2rem; margin: 1rem 0; font-size: 0.875rem;">'
        );

        hasChanges = true;
        console.log('   ✅ Updated table notes styling');
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

updateTableNotesStyle();
