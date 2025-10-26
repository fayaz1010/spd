const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCTAsAndBullets() {
  try {
    console.log('🔧 Updating CTAs and fixing bullet formatting...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // 1. Update calculator CTA text
      if (content.includes('Start Calculator →')) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        
        // Replace generic "Start Calculator" with more compelling CTAs
        content = content.replace(
          /Start Calculator →/g,
          'Calculate My Savings →'
        );
        
        // Update headings
        content = content.replace(
          /Calculate Your Potential Savings/g,
          'See How Much You Could Save with Solar'
        );
        content = content.replace(
          /Get Your Free Solar Quote Now/g,
          'Find Out Your Solar Savings in 60 Seconds'
        );
        content = content.replace(
          /Calculate Your Savings in 2 Minutes!/g,
          'Discover Your Solar Potential - Free Quote'
        );
        
        hasChanges = true;
        console.log('   ✅ Updated calculator CTAs');
      }

      // 2. Update lead magnet CTAs
      if (content.includes('Get Started Free →')) {
        content = content.replace(
          /Get Started Free →/g,
          'Get My Free Quote →'
        );
        hasChanges = true;
        console.log('   ✅ Updated lead magnet CTAs');
      }

      // 3. Fix bullet formatting issues
      // Remove empty list items
      content = content.replace(/<li>\s*<\/li>/g, '');
      
      // Fix italic text in bullets (should be regular)
      content = content.replace(
        /<li><em>(.*?)<\/em><\/li>/g,
        '<li>$1</li>'
      );
      
      // Ensure proper spacing in list items
      content = content.replace(
        /<li>\s*([^<])/g,
        '<li>$1'
      );

      // 4. Fix table formatting if present
      if (content.includes('<table')) {
        // Add proper table styling
        content = content.replace(
          /<table>/g,
          '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">'
        );
        content = content.replace(
          /<th>/g,
          '<th style="background: #f3f4f6; padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">'
        );
        content = content.replace(
          /<td>/g,
          '<td style="padding: 12px; border: 1px solid #e5e7eb;">'
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

    console.log(`\n✅ Updated ${fixed} articles!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

updateCTAsAndBullets();
