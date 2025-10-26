const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const post = await prisma.blogPost.findFirst({
    where: { title: { contains: 'Best Solar Battery' } }
  });
  
  console.log('\n📄 Checking HTML structure:\n');
  console.log(post.content.substring(0, 1200));
  console.log('\n\n🔍 Checking for spacing patterns:');
  console.log('Has </h2>\\n\\n:', post.content.includes('</h2>\n\n'));
  console.log('Has </p>\\n\\n:', post.content.includes('</p>\n\n'));
  console.log('Has </h3>\\n\\n:', post.content.includes('</h3>\n\n'));
  
  await prisma.$disconnect();
}

check();
