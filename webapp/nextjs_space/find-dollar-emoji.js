const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDollarEmoji() {
  const posts = await prisma.blogPost.findMany();
  
  for (const post of posts) {
    if (post.content.includes('💰')) {
      console.log(`\n📄 Found in: ${post.title}`);
      
      const dollarIndex = post.content.indexOf('💰');
      const context = post.content.substring(Math.max(0, dollarIndex - 200), dollarIndex + 300);
      console.log('\n💰 Context:\n');
      console.log(context);
      
      // Check FAQ
      if (post.content.includes('Frequently Asked Questions')) {
        const faqIndex = post.content.indexOf('Frequently Asked Questions');
        const faqSection = post.content.substring(faqIndex, Math.min(post.content.length, faqIndex + 1500));
        console.log('\n\n❓ FAQ Section:\n');
        console.log(faqSection);
      }
      
      break; // Just check first one
    }
  }

  await prisma.$disconnect();
}

findDollarEmoji();
