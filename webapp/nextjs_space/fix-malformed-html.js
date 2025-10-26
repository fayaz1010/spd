const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMalformedHTML() {
  try {
    console.log('🔧 Fixing malformed HTML...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // Fix 1: Mismatched closing tags in FAQ boxes
      // Pattern: </h3> followed by <h3></p>
      if (content.includes('</h3>\n<h3></p>')) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        content = content.replace(/<\/h3>\s*<h3><\/p>/g, '</h3>\n</div>');
        hasChanges = true;
        console.log('   ✅ Fixed mismatched FAQ tags');
      }

      // Fix 2: Orphaned closing div + table fragment
      // Pattern: </div> followed immediately by table data without opening tags
      const orphanedTableRegex = /<\/div>\s*ft">/g;
      if (orphanedTableRegex.test(content)) {
        // This means the table header is missing, need to reconstruct
        content = content.replace(
          /<\/div>\s*ft">\$[\d,]+<\/td>/,
          '</div>\n\n<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">\n<thead>\n<tr style="background: #f3f4f6;">\n<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Usable Capacity</th>\n<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Average Installed Cost (Battery Only)</th>\n<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Installed Cost per kWh (Battery Only)</th>\n<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Average Installed Cost (Battery + Inverter)</th>\n<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Installed Cost per kWh (Battery + Inverter)</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td style="padding: 12px; border: 1px solid #e5e7eb;">15 kWh</td>\n<td style="padding: 12px; border: 1px solid #e5e7eb;">$11,190</td>\n<td style="padding: 12px; border: 1px solid #e5e7eb;">$746</td>\n<td style="padding: 12px; border: 1px solid #e5e7eb;">$13,140</td>\n<td style="padding: 12px; border: 1px solid #e5e7eb;">$876</td>\n</tr>\n<tr style="background: #f9fafb;">'
        );
        hasChanges = true;
        console.log('   ✅ Reconstructed table header');
      }

      // Fix 3: Malformed list items with em tags
      content = content.replace(/<li><em>(.*?)<\/li>/g, '<li>$1</li>');
      content = content.replace(/<\/ul>\s*<p><em><\/em>/g, '</ul>\n\n<p>');
      
      // Fix 4: Add proper styling to existing table cells if missing
      if (content.includes('<td align="left">') && !content.includes('td style=')) {
        content = content.replace(
          /<td align="left">/g,
          '<td style="padding: 12px; border: 1px solid #e5e7eb;">'
        );
        hasChanges = true;
        console.log('   ✅ Added table cell styling');
      }

      // Fix 5: Add table styling if missing
      if (content.includes('<table>') || (content.includes('<tbody>') && !content.includes('<table'))) {
        // Find tables without proper opening tag
        if (!content.includes('<table')) {
          content = content.replace(
            /<tbody>/,
            '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">\n<tbody>'
          );
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

fixMalformedHTML();
