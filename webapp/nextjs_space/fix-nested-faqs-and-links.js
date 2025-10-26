const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNestedFAQsAndLinks() {
  try {
    console.log('🔧 Fixing nested FAQs and misplaced links...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // Fix 1: Remove nested FAQ boxes (FAQ inside FAQ)
      // Pattern: FAQ div containing another FAQ div
      const nestedFAQRegex = /<div style="border: 1px solid #e5e7eb[^>]*>[\s\S]*?<div style="border: 1px solid #e5e7eb[^>]*>[\s\S]*?<\/div>[\s\S]*?<\/div>/g;
      
      if (content.includes('Can I combine the WA and Federal')) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        
        // Find the nested FAQ section
        const combineIndex = content.indexOf('Can I combine the WA and Federal');
        if (combineIndex !== -1) {
          // Find the outer FAQ div
          const before = content.substring(0, combineIndex);
          const outerDivStart = before.lastIndexOf('<div style="border: 1px solid #e5e7eb');
          
          // Find where this FAQ ends
          let divCount = 0;
          let currentPos = outerDivStart;
          let outerDivEnd = -1;
          
          while (currentPos < content.length && currentPos !== -1) {
            const nextOpenDiv = content.indexOf('<div', currentPos + 1);
            const nextCloseDiv = content.indexOf('</div>', currentPos + 1);
            
            if (nextCloseDiv === -1) break;
            
            if (nextOpenDiv !== -1 && nextOpenDiv < nextCloseDiv) {
              divCount++;
              currentPos = nextOpenDiv;
            } else {
              if (divCount === 0) {
                outerDivEnd = nextCloseDiv + 6;
                break;
              }
              divCount--;
              currentPos = nextCloseDiv;
            }
          }
          
          if (outerDivStart !== -1 && outerDivEnd !== -1) {
            const faqSection = content.substring(outerDivStart, outerDivEnd);
            
            // Extract just the question and answer, removing nested content
            const questionMatch = faqSection.match(/<h3[^>]*>❓\s*(.*?)<\/h3>/);
            const question = questionMatch ? questionMatch[1] : '';
            
            // Get the answer text before any nested div or link
            const answerStart = faqSection.indexOf('</h3>') + 5;
            const answerSection = faqSection.substring(answerStart);
            
            // Find where the answer actually ends (before nested div or Get Your)
            let answerText = '';
            const nestedDivIndex = answerSection.indexOf('<div style="border:');
            const getLinkIndex = answerSection.indexOf('Get Your');
            
            if (nestedDivIndex !== -1) {
              answerText = answerSection.substring(0, nestedDivIndex);
            } else if (getLinkIndex !== -1) {
              answerText = answerSection.substring(0, getLinkIndex);
            } else {
              answerText = answerSection;
            }
            
            // Clean up the answer text
            answerText = answerText.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '').trim();
            
            // Create clean FAQ
            const cleanFAQ = `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f9fafb;">
  <h3 style="color: #FF6B6B; margin-bottom: 10px; font-size: 18px;">❓ ${question}</h3>
  <p style="color: #4b5563; line-height: 1.6;">${answerText}</p>
</div>`;
            
            content = content.substring(0, outerDivStart) + cleanFAQ + content.substring(outerDivEnd);
            hasChanges = true;
            console.log('   ✅ Fixed nested FAQ');
          }
        }
      }

      // Fix 2: Remove calculator CTAs that appear inside FAQ answers
      // Pattern: "Get Your Personalized..." or "Calculate My Savings" inside FAQ divs
      const faqWithLinkRegex = /<div style="border: 1px solid #e5e7eb[^>]*>([\s\S]*?)(Get Your Personalized|Calculate My Savings)([\s\S]*?)<\/div>/g;
      
      content = content.replace(faqWithLinkRegex, (match, before, linkText, after) => {
        // If this is a FAQ div (has ❓), remove the link parts
        if (before.includes('❓')) {
          // Remove everything from "Get Your" or "Calculate" onwards
          const cleanBefore = before.split(/Get Your|Calculate My/)[0];
          const cleanAfter = after.split('</a>')[1] || after;
          return `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f9fafb;">${cleanBefore}${cleanAfter}</div>`;
        }
        return match;
      });

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

fixNestedFAQsAndLinks();
