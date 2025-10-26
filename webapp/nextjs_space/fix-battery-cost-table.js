const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBatteryCostTable() {
  try {
    console.log('🔧 Fixing battery cost table...\n');

    const post = await prisma.blogPost.findFirst({
      where: { title: { contains: 'Solar Battery System Cost' } }
    });

    if (!post) {
      console.log('Article not found');
      return;
    }

    console.log(`📝 ${post.title}`);

    let content = post.content;

    // Find and replace the entire broken table
    const tableStart = content.indexOf('<table style="width: 100%; border-collapse: collapse;');
    const tableEnd = content.indexOf('</table>', tableStart) + 8;

    if (tableStart !== -1 && tableEnd > tableStart) {
      const completeTable = `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
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

      content = content.substring(0, tableStart) + completeTable + content.substring(tableEnd);

      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content },
      });

      console.log('✅ Fixed battery cost table with all 4 rows!\n');
    } else {
      console.log('❌ Table not found in expected format\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixBatteryCostTable();
