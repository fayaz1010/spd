const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStackedLinks() {
  try {
    console.log('🔧 Fixing stacked funnel elements...\n');

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
        const calcIndex = content.indexOf('Calculate My Savings', startPos);
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
        const magnetIndex = content.indexOf('Get My Free Quote', startPos);
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

      if (funnelElements.length > 1) {
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

        // Find ALL H3 and H2 headings
        const headingPositions = [];
        let pos = 0;
        
        // Get all H3s
        while (true) {
          const h3End = cleanContent.indexOf('</h3>', pos);
          if (h3End === -1) break;
          headingPositions.push({ pos: h3End + 5, type: 'h3' });
          pos = h3End + 5;
        }
        
        // Get all H2s if not enough H3s
        if (headingPositions.length < 3) {
          pos = 0;
          while (true) {
            const h2End = cleanContent.indexOf('</h2>', pos);
            if (h2End === -1) break;
            headingPositions.push({ pos: h2End + 5, type: 'h2' });
            pos = h2End + 5;
          }
        }

        // Sort by position
        headingPositions.sort((a, b) => a.pos - b.pos);

        if (headingPositions.length >= funnelElements.length) {
          // Limit to max 3 elements with good spacing
          const maxElements = Math.min(3, funnelElements.length);
          
          // Select diverse elements
          const selectedElements = [];
          const calculators = funnelElements.filter(el => el.type === 'calculator');
          const packages = funnelElements.filter(el => el.type === 'package');
          const magnets = funnelElements.filter(el => el.type === 'magnet');
          
          // Priority: 1 calculator, 1-2 packages (prefer packages over magnets)
          if (calculators.length > 0) selectedElements.push(calculators[0]);
          if (packages.length > 0) selectedElements.push(packages[0]);
          if (packages.length > 1 && selectedElements.length < maxElements) {
            selectedElements.push(packages[1]);
          }
          // Only add magnet if we have room and no second package
          if (magnets.length > 0 && selectedElements.length < maxElements && packages.length < 2) {
            selectedElements.push(magnets[0]);
          }

          // Distribute with MINIMUM spacing - at least 3 headings apart
          const minHeadingGap = 3;
          const positions = [];
          
          if (selectedElements.length === 1) {
            // Single element: place in middle
            positions.push(Math.floor(headingPositions.length / 2));
          } else if (selectedElements.length === 2) {
            // Two elements: place at 1/3 and 2/3
            positions.push(Math.floor(headingPositions.length / 3));
            positions.push(Math.floor(headingPositions.length * 2 / 3));
          } else if (selectedElements.length === 3) {
            // Three elements: place at 1/4, 1/2, 3/4
            positions.push(Math.floor(headingPositions.length / 4));
            positions.push(Math.floor(headingPositions.length / 2));
            positions.push(Math.floor(headingPositions.length * 3 / 4));
          }

          // Insert elements
          let newContent = cleanContent;
          let offset = 0;

          selectedElements.forEach((el, i) => {
            const headingIndex = Math.min(positions[i], headingPositions.length - 1);
            const insertPos = headingPositions[headingIndex].pos + offset;

            newContent = 
              newContent.slice(0, insertPos) + 
              '\n\n' + el.html + '\n\n' + 
              newContent.slice(insertPos);

            offset += el.html.length + 4;
          });

          content = newContent;
          hasChanges = true;
          console.log(`   ✅ Redistributed ${selectedElements.length} elements with proper spacing`);
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

fixStackedLinks();
