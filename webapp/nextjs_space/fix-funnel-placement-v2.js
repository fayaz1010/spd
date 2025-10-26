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

      // Extract all funnel elements
      const funnelElements = [];
      
      // 1. Calculator CTAs (gradient backgrounds)
      const ctaRegex = /<div style="background: linear-gradient[^>]*>[\s\S]*?Start Calculator.*?<\/div>/g;
      let match;
      while ((match = ctaRegex.exec(content)) !== null) {
        funnelElements.push({ type: 'calculator', html: match[0], index: match.index });
      }

      // 2. Package links (gray boxes with border)
      const packageRegex = /<div style="background: #f8f9fa[^>]*>[\s\S]*?View Package Details.*?<\/div>/g;
      while ((match = packageRegex.exec(content)) !== null) {
        funnelElements.push({ type: 'package', html: match[0], index: match.index });
      }

      // 3. Lead magnets (purple gradient boxes)
      const magnetRegex = /<div style="background: linear-gradient\(135deg, #667eea[^>]*>[\s\S]*?Get Started Free.*?<\/div>/g;
      while ((match = magnetRegex.exec(content)) !== null) {
        funnelElements.push({ type: 'magnet', html: match[0], index: match.index });
      }

      if (funnelElements.length > 0) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        console.log(`   Found: ${funnelElements.length} funnel elements`);

        // Remove all funnel elements
        let cleanContent = content;
        funnelElements.forEach(el => {
          cleanContent = cleanContent.replace(el.html, '');
        });

        // Clean up extra whitespace
        cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');

        // Find all H3 headings for insertion points
        const h3Positions = [];
        const h3Regex = /<\/h3>/g;
        while ((match = h3Regex.exec(cleanContent)) !== null) {
          h3Positions.push(match.index + 5);
        }

        // If no H3s, use H2s
        if (h3Positions.length === 0) {
          const h2Regex = /<\/h2>/g;
          while ((match = h2Regex.exec(cleanContent)) !== null) {
            h3Positions.push(match.index + 5);
          }
        }

        if (h3Positions.length > 0) {
          // Distribute funnel elements evenly
          const step = Math.max(1, Math.floor(h3Positions.length / funnelElements.length));
          let newContent = cleanContent;
          let offset = 0;

          funnelElements.forEach((el, i) => {
            const targetIndex = Math.min(i * step, h3Positions.length - 1);
            const insertPos = h3Positions[targetIndex] + offset;

            newContent = 
              newContent.slice(0, insertPos) + 
              '\n\n' + el.html + '\n\n' + 
              newContent.slice(insertPos);

            offset += el.html.length + 4; // +4 for \n\n before and after
          });

          content = newContent;
          hasChanges = true;
          console.log(`   ✅ Repositioned after H3 headings`);
        } else {
          console.log(`   ⚠️  No H3/H2 headings found, skipping`);
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
  } finally {
    await prisma.$disconnect();
  }
}

fixFunnelPlacement();
