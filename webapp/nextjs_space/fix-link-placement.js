const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLinkPlacement() {
  try {
    console.log('🔧 Fixing link placement in articles...\n');

    const posts = await prisma.blogPost.findMany();
    
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;
      
      // Find all calculator CTAs and package links
      const ctaRegex = /<div style="background: linear-gradient[^>]*>[\s\S]*?<\/div>/g;
      const matches = content.match(ctaRegex) || [];
      
      if (matches.length > 0) {
        console.log(`📝 Processing: ${post.title.substring(0, 60)}...`);
        
        // Remove all CTAs first
        let cleanContent = content;
        matches.forEach(match => {
          cleanContent = cleanContent.replace(match, '|||CTA_PLACEHOLDER|||');
        });
        
        // Find good insertion points (after h3, h2, or p tags)
        const insertionPoints = [];
        let position = 0;
        
        // Find all </h3> tags
        const h3Regex = /<\/h3>/g;
        let h3Match;
        while ((h3Match = h3Regex.exec(cleanContent)) !== null) {
          insertionPoints.push({ pos: h3Match.index + 5, type: 'h3' });
        }
        
        // Sort by position
        insertionPoints.sort((a, b) => a.pos - b.pos);
        
        // Distribute CTAs evenly across insertion points
        if (insertionPoints.length > 0) {
          const step = Math.floor(insertionPoints.length / matches.length);
          let newContent = cleanContent;
          
          matches.forEach((cta, index) => {
            const targetIndex = Math.min(index * step, insertionPoints.length - 1);
            const insertPoint = insertionPoints[targetIndex];
            
            // Replace first placeholder with CTA at correct position
            newContent = newContent.replace('|||CTA_PLACEHOLDER|||', '');
          });
          
          // Remove remaining placeholders
          newContent = newContent.replace(/\|\|\|CTA_PLACEHOLDER\|\|\|/g, '');
          
          // Re-insert CTAs at proper positions
          let finalContent = newContent;
          matches.forEach((cta, index) => {
            const targetIndex = Math.min(index * step, insertionPoints.length - 1);
            const insertPoint = insertionPoints[targetIndex];
            
            const before = finalContent.substring(0, insertPoint.pos);
            const after = finalContent.substring(insertPoint.pos);
            finalContent = before + '\n\n' + cta + '\n\n' + after;
          });
          
          content = finalContent;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { content },
        });
        console.log(`  ✅ Fixed link placement`);
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

fixLinkPlacement();
