const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTableNotes() {
  try {
    console.log('🔧 Fixing table notes formatting...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // Fix 1: Convert asterisk-prefixed notes to proper list items
      // Pattern: *Battery + Inverter: or *Battery Only:
      if (content.includes('*Battery + Inverter:') || content.includes('*Battery Only:')) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        
        // Replace standalone asterisk notes with list items
        content = content.replace(
          /<p>\*Battery \+ Inverter:(.*?)<\/p>/g,
          '<li><strong>Battery + Inverter:</strong>$1</li>'
        );
        
        content = content.replace(
          /<p>\*Battery Only:(.*?)<\/p>/g,
          '<li><strong>Battery Only:</strong>$1</li>'
        );

        // Ensure they're wrapped in a ul if not already
        // Look for consecutive li tags not in a ul
        content = content.replace(
          /(<li><strong>Battery Only:.*?<\/li>)\s*(<li><strong>Battery \+ Inverter:.*?<\/li>)/gs,
          '<ul style="list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0;">\n$1\n$2\n</ul>'
        );

        hasChanges = true;
        console.log('   ✅ Fixed table notes');
      }

      // Fix 2: Ensure existing battery notes in lists are properly formatted
      if (content.includes('<li>Battery Only:') || content.includes('<li><em>Battery Only:')) {
        content = content.replace(
          /<li><em>Battery Only:(.*?)<\/em><\/li>/g,
          '<li><strong>Battery Only:</strong>$1</li>'
        );
        
        content = content.replace(
          /<li>Battery Only:(.*?)<\/li>/g,
          '<li><strong>Battery Only:</strong>$1</li>'
        );

        content = content.replace(
          /<li><em>Battery \+ Inverter:(.*?)<\/em><\/li>/g,
          '<li><strong>Battery + Inverter:</strong>$1</li>'
        );

        hasChanges = true;
      }

      if (hasChanges) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { content },
        });
        fixed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} articles!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixTableNotes();
