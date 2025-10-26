const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeadMagnet() {
  const post = await prisma.blogPost.findFirst({
    where: { id: 'cmh6bakh0015g6ewt38esl0t' } // From URL
  });

  if (!post) {
    console.log('Post not found');
    await prisma.$disconnect();
    return;
  }

  console.log('\n📄 Article:', post.title);
  
  // Find the dollar bag emoji
  const dollarIndex = post.content.indexOf('💰');
  if (dollarIndex !== -1) {
    const context = post.content.substring(Math.max(0, dollarIndex - 300), dollarIndex + 500);
    console.log('\n💰 Dollar bag context:\n');
    console.log(context);
  }

  // Check FAQ section
  const faqIndex = post.content.indexOf('Frequently Asked Questions');
  if (faqIndex !== -1) {
    const faqSection = post.content.substring(faqIndex, Math.min(post.content.length, faqIndex + 2000));
    console.log('\n\n❓ FAQ Section:\n');
    console.log(faqSection);
  }

  await prisma.$disconnect();
}

checkLeadMagnet();
