const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFunnelElements() {
  const post = await prisma.blogPost.findFirst({
    where: { title: { contains: 'Best Solar Battery' } }
  });

  console.log('\n📄 Article:', post.title);
  console.log('\n🔍 Searching for funnel elements...\n');

  // Check for calculator CTAs
  const calculatorMatches = post.content.match(/Start Calculator/g) || [];
  console.log(`📊 Calculator CTAs found: ${calculatorMatches.length}`);

  // Check for package links
  const packageMatches = post.content.match(/View Package Details/g) || [];
  console.log(`📦 Package links found: ${packageMatches.length}`);

  // Check for lead magnets (purple boxes)
  const leadMagnetMatches = post.content.match(/Get Started Free/g) || [];
  console.log(`💜 Lead magnets found: ${leadMagnetMatches.length}`);

  // Show a sample of where they appear
  if (calculatorMatches.length > 0) {
    const index = post.content.indexOf('Start Calculator');
    const context = post.content.substring(Math.max(0, index - 200), index + 100);
    console.log('\n📍 Calculator CTA context:');
    console.log(context.substring(context.lastIndexOf('<'), context.indexOf('>') + 1));
  }

  if (leadMagnetMatches.length > 0) {
    const index = post.content.indexOf('Get Started Free');
    const before = post.content.substring(Math.max(0, index - 300), index);
    const lastTag = before.lastIndexOf('</');
    const tagEnd = before.indexOf('>', lastTag);
    console.log('\n📍 Lead magnet appears after:');
    console.log(before.substring(lastTag, tagEnd + 1));
  }

  await prisma.$disconnect();
}

checkFunnelElements();
