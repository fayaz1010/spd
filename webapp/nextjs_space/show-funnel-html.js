const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showFunnelHTML() {
  const post = await prisma.blogPost.findFirst({
    where: { title: { contains: 'Best Solar Battery' } }
  });

  // Find first calculator CTA
  const ctaStart = post.content.indexOf('Start Calculator');
  if (ctaStart !== -1) {
    const before = post.content.substring(Math.max(0, ctaStart - 500), ctaStart);
    const divStart = before.lastIndexOf('<div');
    const sample = post.content.substring(ctaStart - 500 + divStart, ctaStart + 200);
    console.log('\n📊 Calculator CTA HTML:\n');
    console.log(sample);
  }

  // Find first lead magnet
  const magnetStart = post.content.indexOf('Get Started Free');
  if (magnetStart !== -1) {
    const before = post.content.substring(Math.max(0, magnetStart - 500), magnetStart);
    const divStart = before.lastIndexOf('<div');
    const sample = post.content.substring(magnetStart - 500 + divStart, magnetStart + 200);
    console.log('\n\n💜 Lead Magnet HTML:\n');
    console.log(sample);
  }

  // Find first package link
  const packageStart = post.content.indexOf('View Package Details');
  if (packageStart !== -1) {
    const before = post.content.substring(Math.max(0, packageStart - 500), packageStart);
    const divStart = before.lastIndexOf('<div');
    const sample = post.content.substring(packageStart - 500 + divStart, packageStart + 200);
    console.log('\n\n📦 Package Link HTML:\n');
    console.log(sample);
  }

  await prisma.$disconnect();
}

showFunnelHTML();
