const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFunnelPlacement() {
  try {
    console.log('🔧 Fixing funnel element placement...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // Extract all funnel elements using simpler patterns
      const funnelElements = [];
      
      // 1. Find all divs with "Start Calculator"
      let startPos = 0;
      while (true) {
        const calcIndex = content.indexOf('Start Calculator', startPos);
        if (calcIndex === -1) break;
        
        // Find the opening <div before it
        const before = content.substring(0, calcIndex);
        const divStart = before.lastIndexOf('<div');
        
        // Find the closing </div> after it
        const after = content.substring(calcIndex);
        const divEnd = after.indexOf('</div>') + calcIndex + 6;
        
        if (divStart !== -1 && divEnd > calcIndex) {
          const html = content.substring(divStart, divEnd);
          funnelElements.push({ type: 'calculator', html, start: divStart, end: divEnd });
          startPos = divEnd;
        } else {
          break;
        }
      }

      // 2. Find all divs with "Get Started Free"
      startPos = 0;
      while (true) {
        const magnetIndex = content.indexOf('Get Started Free', startPos);
        if (magnetIndex === -1) break;
        
        const before = content.substring(0, magnetIndex);
        const divStart = before.lastIndexOf('<div');
        const after = content.substring(magnetIndex);
        const divEnd = after.indexOf('</div>') + magnetIndex + 6;
        
        if (divStart !== -1 && divEnd > magnetIndex) {
          const html = content.substring(divStart, divEnd);
          funnelElements.push({ type: 'magnet', html, start: divStart, end: divEnd });
          startPos = divEnd;
        } else {
          break;
        }
      }

      // 3. Find all divs with "View Package Details"
      startPos = 0;
      while (true) {
        const packageIndex = content.indexOf('View Package Details', startPos);
        if (packageIndex === -1) break;
        
        const before = content.substring(0, packageIndex);
        const divStart = before.lastIndexOf('<div');
        const after = content.substring(packageIndex);
        const divEnd = after.indexOf('</div>') + packageIndex + 6;
        
        if (divStart !== -1 && divEnd > packageIndex) {
          const html = content.substring(divStart, divEnd);
          funnelElements.push({ type: 'package', html, start: divStart, end: divEnd });
          startPos = divEnd;
        } else {
          break;
        }
      }

      if (funnelElements.length > 0) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        console.log(`   Found: ${funnelElements.length} funnel elements`);

        // Sort by position (reverse order for removal)
        funnelElements.sort((a, b) => b.start - a.start);

        // Remove all funnel elements (from end to start to preserve positions)
        let cleanContent = content;
        funnelElements.forEach(el => {
          cleanContent = cleanContent.substring(0, el.start) + cleanContent.substring(el.end);
        });

        // Clean up extra whitespace
        cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
        cleanContent = cleanContent.replace(/<\/p>\s*<p>/g, '</p>\n\n<p>');

        // Find all H3 headings for insertion points
        const h3Positions = [];
        let pos = 0;
        while (true) {
          const h3End = cleanContent.indexOf('</h3>', pos);
          if (h3End === -1) break;
          h3Positions.push(h3End + 5);
          pos = h3End + 5;
        }

        // If no H3s, use H2s
        if (h3Positions.length === 0) {
          pos = 0;
          while (true) {
            const h2End = cleanContent.indexOf('</h2>', pos);
            if (h2End === -1) break;
            h3Positions.push(h2End + 5);
            pos = h2End + 5;
          }
        }

        if (h3Positions.length >= funnelElements.length) {
          // Distribute funnel elements evenly
          const step = Math.floor(h3Positions.length / funnelElements.length);
          let newContent = cleanContent;
          let offset = 0;

          // Reverse back to original order
          funnelElements.reverse();

          funnelElements.forEach((el, i) => {
            const targetIndex = Math.min((i + 1) * step - 1, h3Positions.length - 1);
            const insertPos = h3Positions[targetIndex] + offset;

            newContent = 
              newContent.slice(0, insertPos) + 
              '\n\n' + el.html + '\n\n' + 
              newContent.slice(insertPos);

            offset += el.html.length + 4;
          });

          content = newContent;
          hasChanges = true;
          console.log(`   ✅ Repositioned after H3/H2 headings`);
        } else {
          console.log(`   ⚠️  Not enough headings (${h3Positions.length}) for ${funnelElements.length} elements`);
        }
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

fixFunnelPlacement();
