const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFunnelPlacement() {
  try {
    console.log('🔧 Fixing funnel element placement (final)...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // Extract all funnel elements
      const funnelElements = [];
      
      // Find all calculator CTAs
      let startPos = 0;
      while (true) {
        const calcIndex = content.indexOf('Start Calculator', startPos);
        if (calcIndex === -1) break;
        
        const before = content.substring(0, calcIndex);
        const divStart = before.lastIndexOf('<div');
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

      // Find all lead magnets
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

      // Find all package links
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

        // Sort by position (reverse for removal)
        funnelElements.sort((a, b) => b.start - a.start);

        // Remove all funnel elements
        let cleanContent = content;
        funnelElements.forEach(el => {
          cleanContent = cleanContent.substring(0, el.start) + cleanContent.substring(el.end);
        });

        // Clean up whitespace
        cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');

        // Find all H3 headings
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

        if (h3Positions.length > 0) {
          // Limit funnel elements to max 3-4 per article
          const maxElements = Math.min(4, h3Positions.length);
          const selectedElements = [];
          
          // Select diverse elements (1 calculator, 1-2 packages, 1 magnet max)
          const calculators = funnelElements.filter(el => el.type === 'calculator');
          const packages = funnelElements.filter(el => el.type === 'package');
          const magnets = funnelElements.filter(el => el.type === 'magnet');
          
          if (calculators.length > 0) selectedElements.push(calculators[0]);
          if (packages.length > 0) selectedElements.push(packages[0]);
          if (packages.length > 1 && selectedElements.length < maxElements) selectedElements.push(packages[1]);
          if (magnets.length > 0 && selectedElements.length < maxElements) selectedElements.push(magnets[0]);
          
          // Distribute evenly across headings
          const step = Math.floor(h3Positions.length / selectedElements.length);
          let newContent = cleanContent;
          let offset = 0;

          selectedElements.forEach((el, i) => {
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
          console.log(`   ✅ Kept ${selectedElements.length} elements, repositioned after headings`);
        } else {
          console.log(`   ⚠️  No headings found, removing all funnel elements`);
          content = cleanContent;
          hasChanges = true;
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
