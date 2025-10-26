const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  try {
    const pillars = await prisma.pillar.findMany({
      where: { strategyId: 'cmh6fn89r0000g68c31ji6bxt' },
      select: { title: true, status: true, blogPostId: true }
    });

    console.log('\n📊 Pillar Status:\n');
    pillars.forEach(p => {
      console.log(`${p.blogPostId ? '✅' : '❌'} ${p.title}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   BlogPostId: ${p.blogPostId || 'NONE'}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
