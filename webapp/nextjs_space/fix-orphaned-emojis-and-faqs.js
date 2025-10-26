const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrphanedEmojisAndFAQs() {
  try {
    console.log('🔧 Fixing orphaned emojis and FAQ formatting...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // 1. Remove orphaned emoji divs (emoji without surrounding content)
      const orphanedEmojiRegex = /<div style="font-size: 48px; margin-bottom: 15px;">[\p{Emoji}]+<\/div>/gu;
      if (orphanedEmojiRegex.test(content)) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        console.log('   Removing orphaned emoji');
        content = content.replace(orphanedEmojiRegex, '');
        hasChanges = true;
      }

      // 2. Format FAQ section properly
      if (content.includes('Frequently Asked Questions')) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        console.log('   Formatting FAQ section');
        
        // Find FAQ section
        const faqStart = content.indexOf('Frequently Asked Questions');
        const faqHeading = content.substring(faqStart - 50, faqStart + 100);
        
        // Check if it's already in an H2
        if (!faqHeading.includes('<h2>')) {
          // Wrap in H2 if not already
          content = content.replace(
            /Frequently Asked Questions \(FAQs\)/g,
            '<h2>Frequently Asked Questions (FAQs)</h2>'
          );
          hasChanges = true;
        }

        // Format Q&A pairs - look for Q1:, Q2:, etc.
        const qaRegex = /(Q\d+:.*?A:.*?)(?=Q\d+:|$)/gs;
        const matches = content.match(qaRegex);
        
        if (matches) {
          matches.forEach(qa => {
            // Extract question and answer
            const qMatch = qa.match(/Q\d+:\s*(.+?)\s*A:/s);
            const aMatch = qa.match(/A:\s*(.+?)$/s);
            
            if (qMatch && aMatch) {
              const question = qMatch[1].trim();
              const answer = aMatch[1].trim();
              
              // Create formatted FAQ item
              const formatted = `
<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f9fafb;">
  <h3 style="color: #FF6B6B; margin-bottom: 10px; font-size: 18px;">❓ ${question}</h3>
  <p style="color: #4b5563; line-height: 1.6;">${answer}</p>
</div>`;
              
              content = content.replace(qa, formatted);
              hasChanges = true;
            }
          });
        }
      }

      // 3. Clean up excessive whitespace
      if (hasChanges) {
        content = content.replace(/\n{3,}/g, '\n\n');
        
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { content },
        });
        
        console.log('   ✅ Fixed');
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

fixOrphanedEmojisAndFAQs();
