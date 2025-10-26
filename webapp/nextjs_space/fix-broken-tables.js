const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBrokenTables() {
  try {
    console.log('🔧 Fixing broken tables...\n');

    const posts = await prisma.blogPost.findMany();
    let fixed = 0;

    for (const post of posts) {
      let content = post.content;
      let hasChanges = false;

      // Look for broken table data (prices and numbers in sequence)
      const brokenTableRegex = /ft">\$[\d,]+\s+\$[\d,]+\s+\d+\s+kWh\s+\$[\d,]+\s+\$[\d,]+\s+\$[\d,]+\s+\$[\d,]+/g;
      
      if (brokenTableRegex.test(content)) {
        console.log(`📝 ${post.title.substring(0, 60)}...`);
        console.log('   Found broken table data');

        // Find the broken table section
        const match = content.match(brokenTableRegex);
        if (match) {
          // This appears to be battery cost data
          // Create a proper HTML table
          const properTable = `
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  <thead>
    <tr style="background: #f3f4f6;">
      <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Usable Capacity</th>
      <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Average Installed Cost (Battery Only)</th>
      <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Installed Cost per kWh (Battery Only)</th>
      <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Average Installed Cost (Battery + Inverter)</th>
      <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Installed Cost per kWh (Battery + Inverter)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">5 kWh</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$5,180</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$1,036</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$6,580</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$1,316</td>
    </tr>
    <tr style="background: #f9fafb;">
      <td style="padding: 12px; border: 1px solid #e5e7eb;">10 kWh</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$8,260</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$826</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$9,860</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$986</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">15 kWh</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$11,190</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$746</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$13,140</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$876</td>
    </tr>
    <tr style="background: #f9fafb;">
      <td style="padding: 12px; border: 1px solid #e5e7eb;">20 kWh</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$14,120</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$706</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$16,920</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">$846</td>
    </tr>
  </tbody>
</table>`;

          // Replace broken table with proper one
          content = content.replace(match[0], properTable);
          hasChanges = true;
          console.log('   ✅ Fixed broken table');
        }
      }

      // Also fix any tables that exist but have poor styling
      if (content.includes('<table') && !content.includes('border-collapse')) {
        content = content.replace(
          /<table>/g,
          '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">'
        );
        content = content.replace(
          /<th>/g,
          '<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; background: #f3f4f6;">'
        );
        content = content.replace(
          /<td>/g,
          '<td style="padding: 12px; border: 1px solid #e5e7eb;">'
        );
        hasChanges = true;
        console.log('   ✅ Enhanced table styling');
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

fixBrokenTables();
